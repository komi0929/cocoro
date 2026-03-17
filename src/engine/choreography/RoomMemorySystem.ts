/**
 * cocoro — Room Memory System
 * 各ルームの思い出を記録し、再訪問時に振り返れる
 * 
 * 反復151-155: 
 * - セッションごとのハイライトを保存
 * - 再訪問時に「前回のハイライト」を表示
 * - 累計統計（総発話時間、総訪問回数、最長フロー記録）
 * = 「自分の居場所」感を醸成するメモリーシステム
 */

import type { PeakMoment } from './PeakMomentDetector';

export interface RoomSessionRecord {
  id: string;
  roomId: string;
  roomName: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  participants: string[];
  peakMoments: PeakMoment[];
  dominantEmotion: string;
  flowPeakScore: number;
  speechMinutes: number;
}

export interface RoomMemoryStats {
  roomId: string;
  roomName: string;
  totalVisits: number;
  totalMinutes: number;
  totalSpeechMinutes: number;
  bestFlowScore: number;
  longestSession: number;
  bestMoment: PeakMoment | null;
  lastVisit: number;
  favoriteEmotion: string;
}

const STORAGE_KEY = 'cocoro_room_memories';

export class RoomMemorySystem {
  private records: RoomSessionRecord[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.records = JSON.parse(data);
      }
    } catch {
      this.records = [];
    }
  }

  private save(): void {
    try {
      // Keep last 100 sessions
      const toSave = this.records.slice(-100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Storage full
    }
  }

  /**
   * セッション記録を追加
   */
  addRecord(record: RoomSessionRecord): void {
    this.records.push(record);
    this.save();
  }

  /**
   * ルームの統計を取得
   */
  getRoomStats(roomId: string): RoomMemoryStats | null {
    const roomRecords = this.records.filter(r => r.roomId === roomId);
    if (roomRecords.length === 0) return null;

    const roomName = roomRecords[roomRecords.length - 1].roomName;

    // 感情集計
    const emotionCounts: Record<string, number> = {};
    for (const r of roomRecords) {
      emotionCounts[r.dominantEmotion] = (emotionCounts[r.dominantEmotion] ?? 0) + 1;
    }
    const favoriteEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'neutral';

    // 最高ピークモーメント
    let bestMoment: PeakMoment | null = null;
    for (const r of roomRecords) {
      for (const m of r.peakMoments) {
        if (!bestMoment || m.intensity > bestMoment.intensity) {
          bestMoment = m;
        }
      }
    }

    return {
      roomId,
      roomName,
      totalVisits: roomRecords.length,
      totalMinutes: Math.round(roomRecords.reduce((s, r) => s + r.durationMinutes, 0)),
      totalSpeechMinutes: Math.round(roomRecords.reduce((s, r) => s + r.speechMinutes, 0)),
      bestFlowScore: Math.round(Math.max(...roomRecords.map(r => r.flowPeakScore)) * 100) / 100,
      longestSession: Math.round(Math.max(...roomRecords.map(r => r.durationMinutes))),
      bestMoment,
      lastVisit: Math.max(...roomRecords.map(r => r.endTime)),
      favoriteEmotion,
    };
  }

  /**
   * 全ルームの概要
   */
  getAllRoomStats(): RoomMemoryStats[] {
    const roomIds = [...new Set(this.records.map(r => r.roomId))];
    return roomIds
      .map(id => this.getRoomStats(id))
      .filter((s): s is RoomMemoryStats => s !== null)
      .sort((a, b) => b.lastVisit - a.lastVisit);
  }

  /**
   * 最近のセッション
   */
  getRecentSessions(count: number = 5): RoomSessionRecord[] {
    return this.records.slice(-count).reverse();
  }
}
