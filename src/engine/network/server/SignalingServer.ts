/**
 * cocoro — Socket.IO Signaling Server
 * Next.js API Route ベースのリアルタイムサーバー
 * ルーム管理、状態ブロードキャスト、フェーズ同期を担当
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { RoomManager } from '../RoomManager';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  AvatarStateBroadcast,
  AvatarStateUpdate,
  ParticipantDTO,
  RoomJoinRequest,
  RoomJoinResponse,
  ReactionSendPayload,
  PhaseUpdatePayload,
  FindBestRoomResponse,
  RoomCreateRequest,
  RoomCreateResponse,
} from '../SyncProtocol';
import { SYNC_CONFIG } from '../SyncProtocol';
import { SFUServerHandler } from './SFUServer';

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Parameters<Parameters<TypedServer['on']>[1]>[0];

export class SignalingServer {
  private io: TypedServer;
  private roomManager: RoomManager;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private sfuHandler: SFUServerHandler;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 20000,
      pingInterval: 10000,
    });

    this.roomManager = new RoomManager();
    this.roomManager.initializeDefaultRooms(3);

    // SFU Handler (mediasoup対応 or P2Pパススルー)
    this.sfuHandler = new SFUServerHandler(this.io as unknown as import('socket.io').Server, {
      enabled: !!process.env.MEDIASOUP_ENABLED,
      hasMediasoup: false,
    });

    this.setupEventHandlers();
    this.startCleanupLoop();

    console.log('[SignalingServer] Ready');
  }

  /**
   * Socket.IOイベントハンドラーの設定
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: TypedSocket) => {
      console.log(`[SignalingServer] Client connected: ${socket.id}`);

      // SFUイベントハンドラをアタッチ
      this.sfuHandler.setupHandlers(socket as unknown as import('socket.io').Socket, socket.id);

      // --- Room Join ---
      socket.on('room:join', (data: RoomJoinRequest, ack: (response: RoomJoinResponse) => void) => {
        let roomId = data.roomId;

        // Auto-routing: roomIdがnullなら最適なルームを自動選択
        if (!roomId) {
          const best = this.roomManager.findBestRoom();
          if (best.shouldCreate || !best.roomId) {
            const newRoom = this.roomManager.createRoom();
            roomId = newRoom.id;
          } else {
            roomId = best.roomId;
          }
        }

        // ルームが存在しなければ作成
        if (!this.roomManager.getRoom(roomId)) {
          this.roomManager.createRoom(undefined, undefined);
          // 再取得（createRoomは内部IDを生成するため、指定IDのルームがない場合は新規作成）
          const newRoom = this.roomManager.createRoom();
          roomId = newRoom.id;
        }

        const result = this.roomManager.addParticipant(
          roomId,
          socket.id,
          data.displayName,
          data.vrmUrl,
          data.isGuest
        );

        if (!result) {
          ack({ success: false, roomId: '', participantId: '', participants: [], error: 'Room is full or not found' });
          return;
        }

        // Socket.IOルームに参加
        socket.join(roomId);

        // 既存参加者のリストを作成
        const participants: ParticipantDTO[] = [];
        result.room.participants.forEach((p) => {
          participants.push({
            id: p.id,
            displayName: p.displayName,
            vrmUrl: p.vrmUrl,
            isGuest: p.isGuest,
            transform: p.transform,
            speakingState: p.speakingState,
            emotion: p.emotion,
          });
        });

        // ACK応答
        ack({
          success: true,
          roomId,
          participantId: result.participantId,
          participants,
        });

        // 他の参加者に通知
        const newParticipant = result.room.participants.get(result.participantId);
        if (newParticipant) {
          socket.to(roomId).emit('participant:joined', {
            participant: {
              id: newParticipant.id,
              displayName: newParticipant.displayName,
              vrmUrl: newParticipant.vrmUrl,
              isGuest: newParticipant.isGuest,
              transform: newParticipant.transform,
              speakingState: newParticipant.speakingState,
              emotion: newParticipant.emotion,
            },
          });
        }
      });

      // --- Avatar State Update (30fps broadcast) ---
      socket.on('avatar:state', (data: AvatarStateUpdate) => {
        const info = this.roomManager.findParticipantBySocketId(socket.id);
        if (!info) return;

        // サーバー側の状態を更新
        this.roomManager.updateParticipantState(
          info.roomId,
          info.participantId,
          data.tr,
          data.sp,
          data.em
        );

        // 他の参加者にブロードキャスト
        const broadcast: AvatarStateBroadcast = {
          pid: info.participantId,
          t: data.t,
          tr: data.tr,
          sp: data.sp,
          em: data.em,
        };

        socket.to(info.roomId).emit('avatar:state', broadcast);
      });

      // --- Reaction ---
      socket.on('reaction:send', (data: ReactionSendPayload) => {
        const info = this.roomManager.findParticipantBySocketId(socket.id);
        if (!info) return;

        // ルーム全体にブロードキャスト（送信者含む）
        this.io.to(info.roomId).emit('reaction:broadcast', {
          participantId: info.participantId,
          type: data.type,
          timestamp: Date.now(),
        });
      });

      // --- Phase Update ---
      socket.on('phase:update', (data: PhaseUpdatePayload) => {
        const info = this.roomManager.findParticipantBySocketId(socket.id);
        if (!info) return;

        // ホスト権限チェック
        const room = this.roomManager.getRoom(info.roomId);
        if (!room || room.hostId !== info.participantId) return;

        room.phase = data.phase;
        const density = data.activeSpeakers.length / SYNC_CONFIG.OPTIMAL_ROOM_SIZE;

        this.io.to(info.roomId).emit('phase:change', {
          phase: data.phase,
          activeSpeakers: data.activeSpeakers,
          density: Math.min(1, density),
        });
      });

      // --- Find Best Room ---
      socket.on('rooms:find-best', (ack: (response: FindBestRoomResponse) => void) => {
        const result = this.roomManager.findBestRoom();
        ack(result);
      });

      // --- Room Create ---
      socket.on('room:create', (data: RoomCreateRequest, ack: (response: RoomCreateResponse) => void) => {
        const room = this.roomManager.createRoom(data.name, data.maxParticipants);
        ack({ success: true, roomId: room.id });
      });

      // --- Room Leave ---
      socket.on('room:leave', () => {
        this.handleDisconnect(socket);
      });

      // --- WebRTC Signaling Relay ---
      socket.on('webrtc:offer', (data: { targetId: string; sdp: RTCSessionDescriptionInit }) => {
        const info = this.roomManager.findParticipantBySocketId(socket.id);
        if (!info) return;
        const targetSocketId = this.roomManager.getSocketIdForParticipant(data.targetId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:offer', {
            fromId: info.participantId,
            sdp: data.sdp,
          });
        }
      });

      socket.on('webrtc:answer', (data: { targetId: string; sdp: RTCSessionDescriptionInit }) => {
        const info = this.roomManager.findParticipantBySocketId(socket.id);
        if (!info) return;
        const targetSocketId = this.roomManager.getSocketIdForParticipant(data.targetId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:answer', {
            fromId: info.participantId,
            sdp: data.sdp,
          });
        }
      });

      socket.on('webrtc:ice-candidate', (data: { targetId: string; candidate: RTCIceCandidateInit }) => {
        const info = this.roomManager.findParticipantBySocketId(socket.id);
        if (!info) return;
        const targetSocketId = this.roomManager.getSocketIdForParticipant(data.targetId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:ice-candidate', {
            fromId: info.participantId,
            candidate: data.candidate,
          });
        }
      });

      // --- Disconnect ---
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * 切断時の処理
   */
  private handleDisconnect(socket: TypedSocket): void {
    const info = this.roomManager.findParticipantBySocketId(socket.id);
    if (!info) return;

    this.roomManager.removeParticipant(info.roomId, info.participantId);

    // ルーム内の他の参加者に通知
    socket.to(info.roomId).emit('participant:left', {
      participantId: info.participantId,
    });

    socket.leave(info.roomId);
    console.log(`[SignalingServer] Client disconnected: ${socket.id}`);
  }

  /**
   * 定期クリーンアップ（アイドル参加者の除去）
   */
  private startCleanupLoop(): void {
    this.cleanupInterval = setInterval(() => {
      const removed = this.roomManager.cleanupStaleParticipants(30_000);
      if (removed.length > 0) {
        console.log(`[SignalingServer] Cleaned up ${removed.length} stale participants`);
      }

      // ルーム一覧をブロードキャスト（ロビー用）
      const rooms = this.roomManager.getRoomList();
      this.io.emit('rooms:list', { rooms });
    }, 10_000);
  }

  /**
   * サーバーシャットダウン
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.io.close();
    console.log('[SignalingServer] Shutdown');
  }
}
