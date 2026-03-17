/**
 * kokoro — Virtual Gift System
 * バーチャルギフト — マネタイズの核心
 *
 * サイクル41: アジア市場で証明済みのモデル
 * - ギフトアイテム購入 (コイン消費)
 * - ギフト送信 (3Dアニメーション付き)
 * - ルームホストへの収益還元
 * - ギフト履歴 + ランキング
 * = 「この人の話、面白い！」→ ギフトで応援
 */

export interface VirtualGift {
  id: string;
  name: string;
  emoji: string;
  coinCost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation: 'float' | 'burst' | 'rain' | 'firework';
  creatorSharePercent: number; // ホストの取り分 %
}

export interface GiftTransaction {
  id: string;
  giftId: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  roomId: string;
  coinCost: number;
  timestamp: number;
}

const GIFT_CATALOG: VirtualGift[] = [
  { id: 'heart', name: 'ハート', emoji: '❤️', coinCost: 10, rarity: 'common', animation: 'float', creatorSharePercent: 50 },
  { id: 'star', name: 'キラキラ', emoji: '⭐', coinCost: 30, rarity: 'common', animation: 'float', creatorSharePercent: 50 },
  { id: 'clap', name: '拍手喝采', emoji: '👏', coinCost: 50, rarity: 'rare', animation: 'burst', creatorSharePercent: 50 },
  { id: 'flower', name: '花束', emoji: '💐', coinCost: 100, rarity: 'rare', animation: 'rain', creatorSharePercent: 50 },
  { id: 'crown', name: 'クラウン', emoji: '👑', coinCost: 300, rarity: 'epic', animation: 'firework', creatorSharePercent: 60 },
  { id: 'diamond', name: 'ダイヤモンド', emoji: '💎', coinCost: 500, rarity: 'epic', animation: 'firework', creatorSharePercent: 60 },
  { id: 'rocket', name: 'ロケット', emoji: '🚀', coinCost: 1000, rarity: 'legendary', animation: 'firework', creatorSharePercent: 70 },
  { id: 'rainbow', name: 'レインボー', emoji: '🌈', coinCost: 2000, rarity: 'legendary', animation: 'rain', creatorSharePercent: 70 },
];

const STORAGE_KEY = 'kokoro_gifts';

export class VirtualGiftSystem {
  private transactions: GiftTransaction[] = [];
  private onGiftCallbacks: Array<(tx: GiftTransaction, gift: VirtualGift) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) this.transactions = JSON.parse(data);
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions.slice(-100)));
    } catch { /* full */ }
  }

  /**
   * ギフト送信
   */
  sendGift(params: {
    giftId: string; senderId: string; senderName: string;
    receiverId: string; receiverName: string; roomId: string;
    userCoins: number;
  }): { success: boolean; transaction?: GiftTransaction; remainingCoins?: number; error?: string } {
    const gift = GIFT_CATALOG.find(g => g.id === params.giftId);
    if (!gift) return { success: false, error: 'ギフトが見つかりません' };
    if (params.userCoins < gift.coinCost) return { success: false, error: 'コインが足りません' };

    const tx: GiftTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      giftId: gift.id,
      senderId: params.senderId, senderName: params.senderName,
      receiverId: params.receiverId, receiverName: params.receiverName,
      roomId: params.roomId, coinCost: gift.coinCost,
      timestamp: Date.now(),
    };

    this.transactions.push(tx);
    this.saveToStorage();

    for (const fn of this.onGiftCallbacks) fn(tx, gift);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([10, 20, 30]);

    return { success: true, transaction: tx, remainingCoins: params.userCoins - gift.coinCost };
  }

  /**
   * ギフトカタログ
   */
  static getCatalog(): VirtualGift[] { return [...GIFT_CATALOG]; }

  /**
   * ランキング(受信コイン合計)
   */
  getTopReceivers(limit: number = 10): Array<{ receiverName: string; totalCoins: number }> {
    const totals = new Map<string, { name: string; coins: number }>();
    for (const tx of this.transactions) {
      const existing = totals.get(tx.receiverId) || { name: tx.receiverName, coins: 0 };
      existing.coins += tx.coinCost;
      totals.set(tx.receiverId, existing);
    }
    return Array.from(totals.values())
      .sort((a, b) => b.coins - a.coins)
      .slice(0, limit)
      .map(t => ({ receiverName: t.name, totalCoins: t.coins }));
  }

  onGift(fn: (tx: GiftTransaction, gift: VirtualGift) => void): () => void {
    this.onGiftCallbacks.push(fn);
    return () => { this.onGiftCallbacks = this.onGiftCallbacks.filter(f => f !== fn); };
  }
}
