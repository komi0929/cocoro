/**
 * cocoro — Room Manager (Server-side logic)
 * ルーム管理・自動ルーティングアルゴリズム
 * 
 * PRD要件: 「誰もいない」状態を防ぐため、
 * 適切な密度のアクティブな空間へ自動ルーティング
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ParticipantDTO,
  RoomInfo,
  TransformDTO,
  SpeakingStateDTO,
  EmotionDTO,
} from './SyncProtocol';
import { SYNC_CONFIG } from './SyncProtocol';

// ============================================================
// Room State (Server Memory)
// ============================================================

export interface ServerParticipant extends ParticipantDTO {
  socketId: string;
  joinedAt: number;
  lastActivityAt: number;
}

export interface ServerRoom {
  id: string;
  name: string;
  maxParticipants: number;
  participants: Map<string, ServerParticipant>;
  phase: 'SILENCE' | 'TRIGGER' | 'GRAVITY';
  density: number;
  activeSpeakers: Set<string>;
  createdAt: number;
  hostId: string | null;
}

// ============================================================
// Room Manager
// ============================================================

export class RoomManager {
  private rooms: Map<string, ServerRoom> = new Map();

  // Room name pool for auto-generated rooms
  private roomNames = [
    '焚き火のそば', '月明かりの広場', '星降る丘', '秘密の隠れ家',
    '夕暮れのカフェ', '深夜のラウンジ', '朝もやの森', '波音の浜辺',
    '屋上の夜空', '灯りの小路', '雲の上', '木漏れ日の下',
  ];

  /**
   * 新しいルームを作成
   */
  createRoom(name?: string, maxParticipants?: number): ServerRoom {
    const id = uuidv4().substring(0, 8);
    const roomName = name ?? this.roomNames[this.rooms.size % this.roomNames.length];

    const room: ServerRoom = {
      id,
      name: roomName,
      maxParticipants: maxParticipants ?? SYNC_CONFIG.MAX_ROOM_PARTICIPANTS,
      participants: new Map(),
      phase: 'SILENCE',
      density: 0,
      activeSpeakers: new Set(),
      createdAt: Date.now(),
      hostId: null,
    };

    this.rooms.set(id, room);
    console.log(`[RoomManager] Room created: ${id} "${roomName}"`);
    return room;
  }

  /**
   * 最適なルームを自動検索
   * Growth Agentの要件: 過疎化対策 — 人がいるルームに優先的にルーティング
   * 
   * ルーティングアルゴリズム:
   * 1. 空でなく、満席でないルームを候補に
   * 2. OPTIMAL_ROOM_SIZE未満のルームを優先（密度 > 0 が望ましい）
   * 3. 候補がなければ新規作成
   */
  findBestRoom(): { roomId: string | null; shouldCreate: boolean } {
    const candidates: ServerRoom[] = [];

    for (const room of this.rooms.values()) {
      const count = room.participants.size;
      if (count >= room.maxParticipants) continue; // 満席スキップ
      if (count === 0) continue; // 空ルームは後回し
      candidates.push(room);
    }

    if (candidates.length === 0) {
      // 空ルームがあればそこへ
      for (const room of this.rooms.values()) {
        if (room.participants.size === 0) {
          return { roomId: room.id, shouldCreate: false };
        }
      }
      // 完全に存在しない → 作成推奨
      return { roomId: null, shouldCreate: true };
    }

    // 最適サイズ未満で最も人が多いルームを選択（密集感を演出）
    candidates.sort((a, b) => {
      const aSize = a.participants.size;
      const bSize = b.participants.size;
      const aUnder = aSize < SYNC_CONFIG.OPTIMAL_ROOM_SIZE;
      const bUnder = bSize < SYNC_CONFIG.OPTIMAL_ROOM_SIZE;

      // 最適サイズ未満を優先
      if (aUnder && !bUnder) return -1;
      if (!aUnder && bUnder) return 1;
      // 同条件なら人数が多い方を優先（密度を上げる）
      return bSize - aSize;
    });

    return { roomId: candidates[0].id, shouldCreate: false };
  }

  /**
   * 参加者をルームに追加
   */
  addParticipant(
    roomId: string,
    socketId: string,
    displayName: string,
    vrmUrl: string | null,
    isGuest: boolean
  ): { participantId: string; room: ServerRoom } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.participants.size >= room.maxParticipants) return null;

    const participantId = uuidv4();
    const count = room.participants.size;
    
    // 初期配置: 大きめの円上に均等配置
    const angle = (count / Math.max(count + 1, 6)) * Math.PI * 2;
    const radius = 4 + (count * 0.3);

    const participant: ServerParticipant = {
      id: participantId,
      socketId,
      displayName,
      vrmUrl,
      isGuest,
      transform: {
        px: Math.cos(angle) * radius * 1000,
        py: 0,
        pz: Math.sin(angle) * radius * 1000,
        rx: 0,
        ry: (angle + Math.PI) * 10000,
        rz: 0,
        lx: null, ly: null, lz: null,
      },
      speakingState: { s: false, v: 0, p: 0, vi: 0, vw: 0 },
      emotion: { j: 0, a: 0, s: 0, su: 0, n: 255 },
      joinedAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    room.participants.set(participantId, participant);

    // 最初の参加者がホスト
    if (!room.hostId) {
      room.hostId = participantId;
    }

    console.log(`[RoomManager] ${displayName} joined room ${roomId} (${room.participants.size} participants)`);
    return { participantId, room };
  }

  /**
   * 参加者をルームから削除
   */
  removeParticipant(roomId: string, participantId: string): ServerRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.get(participantId);
    if (!participant) return null;

    room.participants.delete(participantId);
    room.activeSpeakers.delete(participantId);

    // ホスト移譲
    if (room.hostId === participantId) {
      const next = room.participants.keys().next();
      room.hostId = next.done ? null : next.value;
    }

    console.log(`[RoomManager] Participant left room ${roomId} (${room.participants.size} remaining)`);

    // 空ルームで古いものは削除
    if (room.participants.size === 0) {
      const age = Date.now() - room.createdAt;
      if (age > 60_000) { // 1分以上経過した空ルームは削除
        this.rooms.delete(roomId);
        console.log(`[RoomManager] Empty room ${roomId} cleaned up`);
      }
    }

    return room;
  }

  /**
   * SocketIDから参加者を逆引き
   */
  findParticipantBySocketId(socketId: string): {
    roomId: string;
    participantId: string;
    room: ServerRoom;
  } | null {
    for (const [roomId, room] of this.rooms) {
      for (const [pid, p] of room.participants) {
        if (p.socketId === socketId) {
          return { roomId, participantId: pid, room };
        }
      }
    }
    return null;
  }

  /**
   * ParticipantIDからSocketIDを逆引き（WebRTCシグナリング用）
   */
  getSocketIdForParticipant(participantId: string): string | null {
    for (const room of this.rooms.values()) {
      const p = room.participants.get(participantId);
      if (p) return p.socketId;
    }
    return null;
  }

  /**
   * 参加者のアバター状態を更新
   */
  updateParticipantState(
    roomId: string,
    participantId: string,
    transform?: TransformDTO,
    speakingState?: SpeakingStateDTO,
    emotion?: EmotionDTO
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const p = room.participants.get(participantId);
    if (!p) return;

    if (transform) p.transform = transform;
    if (speakingState) {
      p.speakingState = speakingState;
      // VAD update
      if (speakingState.s) {
        room.activeSpeakers.add(participantId);
      } else {
        room.activeSpeakers.delete(participantId);
      }
    }
    if (emotion) p.emotion = emotion;
    p.lastActivityAt = Date.now();
  }

  /**
   * ルーム一覧を取得
   */
  getRoomList(): RoomInfo[] {
    const list: RoomInfo[] = [];
    for (const room of this.rooms.values()) {
      list.push({
        id: room.id,
        name: room.name,
        participantCount: room.participants.size,
        maxParticipants: room.maxParticipants,
        phase: room.phase,
        density: room.density,
      });
    }
    return list;
  }

  /**
   * ルームを取得
   */
  getRoom(roomId: string): ServerRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 初期ルームの作成（サーバー起動時）
   * Growth Agent要件: 最初からルームを存在させておく
   */
  initializeDefaultRooms(count: number = 3): void {
    for (let i = 0; i < count; i++) {
      this.createRoom();
    }
    console.log(`[RoomManager] ${count} default rooms initialized`);
  }

  /**
   * アイドル参加者のクリーンアップ（ハートビート失敗検知）
   */
  cleanupStaleParticipants(maxIdleMs: number = 30_000): string[] {
    const removed: string[] = [];
    const now = Date.now();

    for (const [roomId, room] of this.rooms) {
      for (const [pid, p] of room.participants) {
        if (now - p.lastActivityAt > maxIdleMs) {
          room.participants.delete(pid);
          room.activeSpeakers.delete(pid);
          removed.push(pid);
          console.log(`[RoomManager] Stale participant ${pid} removed from room ${roomId}`);
        }
      }
    }

    return removed;
  }
}
