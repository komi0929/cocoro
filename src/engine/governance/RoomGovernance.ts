/**
 * cocoro — RoomGovernance
 * ルームの**階層的権限管理**システム
 *
 * X Spacesから学ぶ: ホストコントロールの重要性
 * Discord/VTuberから学ぶ: モデレーター階層
 * Clubhouseの教訓: モデレーション不足→荒れる
 *
 * 権限階層:
 *   Owner > Moderator > Regular > Guest
 *
 * 各権限:
 * - Owner: 全権限 + ルーム設定 + モデ任命
 * - Moderator: ミュート/キック/招待承認
 * - Regular: 発話/リアクション/ゲーム参加
 * - Guest: 視聴/リアクション
 */

export type RoomRole = 'owner' | 'moderator' | 'regular' | 'guest';

export interface RoomRule {
  maxParticipants: number;
  allowGuests: boolean;
  topicRestriction: string | null;
  languageRestriction: string | null;
  ageRestriction: 'none' | '13+' | '18+';
  autoModeration: boolean;
  recordingAllowed: boolean;
  gamesAllowed: boolean;
  bgmEnabled: boolean;
}

export interface RoomMember {
  participantId: string;
  role: RoomRole;
  joinedAt: number;
  isMuted: boolean;
  warnings: number;
  lastActivity: number;
}

export interface GovernanceAction {
  type: 'mute' | 'unmute' | 'kick' | 'ban' | 'warn' | 'promote' | 'demote';
  actorId: string;
  targetId: string;
  reason?: string;
  timestamp: number;
}

const ROLE_PERMISSIONS: Record<RoomRole, Set<string>> = {
  owner: new Set([
    'speak', 'react', 'game', 'mute', 'unmute', 'kick', 'ban', 'warn',
    'promote', 'demote', 'set_rules', 'invite', 'record', 'close_room',
    'assign_moderator', 'remove_moderator', 'change_topic',
  ]),
  moderator: new Set([
    'speak', 'react', 'game', 'mute', 'unmute', 'kick', 'warn',
    'invite', 'pin_message', 'slow_mode',
  ]),
  regular: new Set(['speak', 'react', 'game', 'raise_hand']),
  guest: new Set(['react', 'raise_hand']),
};

export class RoomGovernance {
  private members: Map<string, RoomMember> = new Map();
  private rules: RoomRule;
  private actionLog: GovernanceAction[] = [];
  private banList: Set<string> = new Set();
  private ownerId: string;

  constructor(ownerId: string) {
    this.ownerId = ownerId;
    this.rules = {
      maxParticipants: 20,
      allowGuests: true,
      topicRestriction: null,
      languageRestriction: null,
      ageRestriction: 'none',
      autoModeration: true,
      recordingAllowed: false,
      gamesAllowed: true,
      bgmEnabled: true,
    };

    // Owner auto-join
    this.members.set(ownerId, {
      participantId: ownerId,
      role: 'owner',
      joinedAt: Date.now(),
      isMuted: false,
      warnings: 0,
      lastActivity: Date.now(),
    });
  }

  /** メンバー参加 */
  addMember(participantId: string, role: RoomRole = 'regular'): boolean {
    if (this.banList.has(participantId)) return false;
    if (this.members.size >= this.rules.maxParticipants) return false;
    if (!this.rules.allowGuests && role === 'guest') return false;

    this.members.set(participantId, {
      participantId,
      role,
      joinedAt: Date.now(),
      isMuted: false,
      warnings: 0,
      lastActivity: Date.now(),
    });
    return true;
  }

  /** ガバナンスアクション実行 */
  executeAction(actorId: string, action: GovernanceAction['type'], targetId: string, reason?: string): { success: boolean; error?: string } {
    const actor = this.members.get(actorId);
    const target = this.members.get(targetId);
    if (!actor) return { success: false, error: '権限がありません' };

    // Check permission
    if (!ROLE_PERMISSIONS[actor.role].has(action)) {
      return { success: false, error: `${actor.role}にはこの操作の権限がありません` };
    }

    // Cannot act on higher roles
    if (target) {
      const roleOrder: RoomRole[] = ['guest', 'regular', 'moderator', 'owner'];
      if (roleOrder.indexOf(target.role) >= roleOrder.indexOf(actor.role) && actor.role !== 'owner') {
        return { success: false, error: '自分以上の権限に対して操作できません' };
      }
    }

    // Execute
    switch (action) {
      case 'mute':
        if (target) target.isMuted = true;
        break;
      case 'unmute':
        if (target) target.isMuted = false;
        break;
      case 'kick':
        this.members.delete(targetId);
        break;
      case 'ban':
        this.members.delete(targetId);
        this.banList.add(targetId);
        break;
      case 'warn':
        if (target) {
          target.warnings++;
          if (target.warnings >= 3) {
            // Auto-kick on 3 warnings
            this.members.delete(targetId);
          }
        }
        break;
      case 'promote':
        if (target) {
          const roles: RoomRole[] = ['guest', 'regular', 'moderator'];
          const idx = roles.indexOf(target.role);
          if (idx < roles.length - 1) target.role = roles[idx + 1];
        }
        break;
      case 'demote':
        if (target) {
          const roles: RoomRole[] = ['guest', 'regular', 'moderator'];
          const idx = roles.indexOf(target.role);
          if (idx > 0) target.role = roles[idx - 1];
        }
        break;
    }

    this.actionLog.push({ type: action, actorId, targetId, reason, timestamp: Date.now() });
    return { success: true };
  }

  /** ルール変更(Owner only) */
  updateRules(actorId: string, partial: Partial<RoomRule>): boolean {
    const actor = this.members.get(actorId);
    if (!actor || actor.role !== 'owner') return false;
    Object.assign(this.rules, partial);
    return true;
  }

  /** 権限チェック */
  hasPermission(participantId: string, permission: string): boolean {
    const member = this.members.get(participantId);
    if (!member) return false;
    return ROLE_PERMISSIONS[member.role].has(permission);
  }

  /** モデレーター一覧 */
  getModerators(): RoomMember[] {
    return Array.from(this.members.values()).filter(m => m.role === 'moderator');
  }

  getRules(): RoomRule { return { ...this.rules }; }
  getMembers(): RoomMember[] { return Array.from(this.members.values()); }
  getMember(id: string): RoomMember | undefined { return this.members.get(id); }
  getActionLog(): GovernanceAction[] { return [...this.actionLog]; }
  getOwnerId(): string { return this.ownerId; }
  isBanned(participantId: string): boolean { return this.banList.has(participantId); }
}
