/**
 * cocoro — Coin Economy
 * コイン/ポイント経済 — マネタイズの基盤通貨
 *
 * サイクル43: 仮想通貨制度
 * - コイン購入(実際の決済はStripe等で外部処理)
 * - コイン消費(ギフト/アバター/背景)
 * - 無料コイン獲得(デイリーログイン/チャレンジ/レベルアップ)
 * - 残高管理 + 履歴
 * = 「課金しなくても遊べるが、課金すると楽しさが増す」
 */

export interface CoinTransaction {
  id: string;
  type: 'purchase' | 'earn' | 'spend' | 'gift_received';
  amount: number;        // +earn/-spend
  balance: number;       // 取引後残高
  description: string;
  timestamp: number;
}

export interface CoinState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalPurchased: number;
  transactions: CoinTransaction[];
}

const STORAGE_KEY = 'cocoro_coins';

// 無料で獲得できるコインの設定
const FREE_COIN_REWARDS = {
  dailyLogin: 5,
  dailyChallenge: 10,
  levelUp: 20,
  firstSession: 50,     // 初回ボーナス
  inviteFriend: 30,
  streak7: 50,
  streak30: 200,
} as const;

export class CoinEconomy {
  private state: CoinState;
  private onChangeCallbacks: Array<(state: CoinState) => void> = [];

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): CoinState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch { /* ignore */ }
    return { balance: 0, totalEarned: 0, totalSpent: 0, totalPurchased: 0, transactions: [] };
  }

  private saveState(): void {
    try {
      // Keep last 50 transactions
      this.state.transactions = this.state.transactions.slice(-50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch { /* full */ }
  }

  /**
   * コインを獲得(無料報酬)
   */
  earn(amount: number, description: string): void {
    this.state.balance += amount;
    this.state.totalEarned += amount;
    this.state.transactions.push({
      id: `tx_${Date.now()}`, type: 'earn',
      amount, balance: this.state.balance,
      description, timestamp: Date.now(),
    });
    this.saveState();
    this.notifyChange();
  }

  /**
   * コインを消費
   */
  spend(amount: number, description: string): boolean {
    if (this.state.balance < amount) return false;
    this.state.balance -= amount;
    this.state.totalSpent += amount;
    this.state.transactions.push({
      id: `tx_${Date.now()}`, type: 'spend',
      amount: -amount, balance: this.state.balance,
      description, timestamp: Date.now(),
    });
    this.saveState();
    this.notifyChange();
    return true;
  }

  /**
   * コイン購入(決済成功後に呼ぶ)
   */
  addPurchasedCoins(amount: number): void {
    this.state.balance += amount;
    this.state.totalPurchased += amount;
    this.state.transactions.push({
      id: `tx_${Date.now()}`, type: 'purchase',
      amount, balance: this.state.balance,
      description: `${amount}コイン購入`, timestamp: Date.now(),
    });
    this.saveState();
    this.notifyChange();
  }

  /**
   * 初回ボーナス付与
   */
  grantFirstTimeBonus(): void {
    if (this.state.totalEarned === 0) {
      this.earn(FREE_COIN_REWARDS.firstSession, '🎉 初回ボーナス！');
    }
  }

  getBalance(): number { return this.state.balance; }
  getState(): CoinState { return { ...this.state }; }
  static getRewards(): typeof FREE_COIN_REWARDS { return FREE_COIN_REWARDS; }

  canAfford(amount: number): boolean { return this.state.balance >= amount; }

  onChange(fn: (state: CoinState) => void): () => void {
    this.onChangeCallbacks.push(fn);
    return () => { this.onChangeCallbacks = this.onChangeCallbacks.filter(f => f !== fn); };
  }

  private notifyChange(): void {
    for (const fn of this.onChangeCallbacks) fn({ ...this.state });
  }
}
