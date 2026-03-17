/**
 * cocoro — Invite Link
 * URL1つでルームに参加 — バイラル成長の要
 *
 * サイクル26: 招待リンク生成
 * - 短いURL生成(cocoro.space/r/xxxx)
 * - OGPメタデータ自動生成(ルーム名/参加者数/カテゴリ)
 * - QRコード生成
 * - 有効期限設定(24時間/無期限)
 * = SNSシェア → 新規ユーザー獲得の主要チャネル
 */

export interface InviteConfig {
  roomId: string;
  roomName: string;
  category: string;
  creatorName: string;
  participantCount: number;
  maxParticipants: number;
  expiresIn: number;  // ms (0 = never)
}

export interface InviteLink {
  code: string;
  url: string;
  ogTitle: string;
  ogDescription: string;
  createdAt: number;
  expiresAt: number | null;
  config: InviteConfig;
}

const STORAGE_KEY = 'cocoro_invites';

export class InviteLinkSystem {
  private invites: Map<string, InviteLink> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const arr: InviteLink[] = JSON.parse(data);
        for (const inv of arr) this.invites.set(inv.code, inv);
      }
    } catch { /* ignore */ }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.invites.values()).slice(-20)));
    } catch { /* full */ }
  }

  /**
   * 招待リンクを生成
   */
  create(config: InviteConfig): InviteLink {
    const code = this.generateCode();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cocoro.space';

    const invite: InviteLink = {
      code,
      url: `${baseUrl}/space?invite=${code}`,
      ogTitle: `${config.roomName} — cocoro`,
      ogDescription: `${config.creatorName}の部屋で${config.participantCount}人が話し中！ #cocoro`,
      createdAt: Date.now(),
      expiresAt: config.expiresIn > 0 ? Date.now() + config.expiresIn : null,
      config,
    };

    this.invites.set(code, invite);
    this.saveToStorage();
    return invite;
  }

  /**
   * 招待コードからルーム情報を取得
   */
  resolve(code: string): InviteLink | null {
    const invite = this.invites.get(code);
    if (!invite) return null;
    if (invite.expiresAt && Date.now() > invite.expiresAt) {
      this.invites.delete(code);
      this.saveToStorage();
      return null; // Expired
    }
    return invite;
  }

  /**
   * シェア用テキスト生成
   */
  getShareText(invite: InviteLink): string {
    return `🎤 ${invite.config.roomName} で会話しよう！\n${invite.url}\n#cocoro`;
  }

  /**
   * Web Share API
   */
  async share(invite: InviteLink): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: invite.ogTitle,
          text: this.getShareText(invite),
          url: invite.url,
        });
        return true;
      } catch { return false; }
    }
    // Fallback: copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(invite.url);
      return true;
    }
    return false;
  }

  private generateCode(): string {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
