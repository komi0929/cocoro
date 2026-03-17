/**
 * kokoro — Cognitive Context Engine
 * 空間の「認知的記憶」を統合するエンジン
 *
 * 2026メタバース動向:
 *   - Google Titans: 200万トークン超の長期記憶
 *   - NEOM XVRS: コグニティブ・デジタルツイン
 *   - Inworld AI: NPC行動記憶 + 状況認識
 *
 * 実装方針:
 *   AIランタイムゼロ — テンプレートベースの認知コンテキスト生成
 *   SpatialMemory (IndexedDB) のデータを読み取り、
 *   空間に「記憶」を持たせる
 *
 * 出力:
 *   - ウェルカムメッセージ (再訪問時)
 *   - 環境パーソナライズパラメータ
 *   - 認知サマリー (空間の「性格」)
 */

import { spatialMemory, type VisitRecord, type AvatarEvolution, type HeatmapCell } from './SpatialMemory';

/** 認知コンテキストの出力 */
export interface CognitiveSnapshot {
  /** 再訪問時のウェルカムメッセージ */
  welcomeMessage: string | null;
  /** 空間の「温度」(0-1) — 過去の活動量に基づく */
  spatialWarmth: number;
  /** 空間の支配的感情 */
  dominantMood: string;
  /** 訪問回数 */
  visitCount: number;
  /** 累積滞在時間(秒) */
  totalDuration: number;
  /** 最も活発だったエリア (gridX, gridZ) */
  hotspot: { x: number; z: number } | null;
  /** パーティクル密度乗数 (空間の「活気」) */
  particleDensityMultiplier: number;
  /** 推奨カラー温度 (K) */
  suggestedColorTemp: number;
}

/** ウェルカムメッセージテンプレート */
const WELCOME_TEMPLATES = {
  firstVisit: [
    'はじめまして。ここは声で繋がる空間です',
    '新しい声が加わりました',
  ],
  returning: [
    'おかえりなさい。前回は{duration}分過ごしました',
    'また来てくれたんですね。{visitCount}回目の訪問です',
    '前回から{daysSince}日ぶりですね',
  ],
  frequent: [
    'おなじみの顔ですね。通算{totalHours}時間この空間にいます',
    'あなたはこの空間の常連です',
  ],
  emotionBased: {
    joy: 'この空間は、あなたが来ると明るくなります',
    sorrow: '静かな空間へようこそ',
    anger: 'この空間で落ち着いてください',
    surprise: 'いつも驚きのある会話をありがとう',
    neutral: 'ゆっくりしていってください',
  },
};

/** 感情→カラー温度マッピング */
const MOOD_TO_TEMP: Record<string, number> = {
  joy: 5500,     // warm daylight
  anger: 3000,   // warm/red
  sorrow: 7000,  // cool blue
  surprise: 6000, // bright
  neutral: 4500, // balanced
};

export class CognitiveContext {
  /**
   * 空間の認知スナップショットを生成
   * SpatialMemory (IndexedDB) から非同期にデータを読み取り、
   * テンプレートベースで認知コンテキストを構築
   */
  async buildSnapshot(roomId: string, avatarId: string): Promise<CognitiveSnapshot> {
    try {
      const [visits, heatmap, evolution] = await Promise.all([
        spatialMemory.getVisitHistory(roomId),
        spatialMemory.getHeatmap(),
        spatialMemory.loadAvatarEvolution(avatarId),
      ]);

      const visitCount = visits.length;
      const totalDuration = visits.reduce((sum, v) => sum + v.durationSeconds, 0);
      const dominantMood = this.calculateDominantMood(visits, heatmap);
      const hotspot = this.findHotspot(heatmap);
      const spatialWarmth = this.calculateWarmth(visits, evolution);

      const welcomeMessage = this.generateWelcome(
        visits,
        evolution,
        dominantMood,
        visitCount,
        totalDuration,
      );

      const particleDensityMultiplier = this.calculateParticleDensity(
        visitCount,
        spatialWarmth,
      );

      const suggestedColorTemp = MOOD_TO_TEMP[dominantMood] ?? 4500;

      return {
        welcomeMessage,
        spatialWarmth,
        dominantMood,
        visitCount,
        totalDuration,
        hotspot,
        particleDensityMultiplier,
        suggestedColorTemp,
      };
    } catch {
      // IndexedDB unavailable — return defaults
      return {
        welcomeMessage: WELCOME_TEMPLATES.firstVisit[0],
        spatialWarmth: 0,
        dominantMood: 'neutral',
        visitCount: 0,
        totalDuration: 0,
        hotspot: null,
        particleDensityMultiplier: 1,
        suggestedColorTemp: 4500,
      };
    }
  }

  /** 過去の訪問・ヒートマップから支配的感情を算出 */
  private calculateDominantMood(visits: VisitRecord[], heatmap: HeatmapCell[]): string {
    const emotionCounts: Record<string, number> = {};

    // Visits の感情
    for (const visit of visits) {
      const e = visit.dominantEmotion || 'neutral';
      emotionCounts[e] = (emotionCounts[e] ?? 0) + 1;
    }

    // Heatmap の感情
    for (const cell of heatmap) {
      if (cell.peakEmotion) {
        emotionCounts[cell.peakEmotion] = (emotionCounts[cell.peakEmotion] ?? 0) + cell.energy;
      }
    }

    let dominant = 'neutral';
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = emotion;
      }
    }

    return dominant;
  }

  /** ヒートマップからホットスポットを特定 */
  private findHotspot(heatmap: HeatmapCell[]): { x: number; z: number } | null {
    if (heatmap.length === 0) return null;

    let maxEnergy = 0;
    let hotspot = heatmap[0];
    for (const cell of heatmap) {
      if (cell.energy > maxEnergy) {
        maxEnergy = cell.energy;
        hotspot = cell;
      }
    }

    return { x: hotspot.x, z: hotspot.z };
  }

  /** 空間の「温度」を計算 (0-1) */
  private calculateWarmth(
    visits: VisitRecord[],
    evolution: AvatarEvolution | null
  ): number {
    if (visits.length === 0) return 0;

    // 最終訪問からの経過日数 (鮮度)
    const lastVisit = visits[visits.length - 1];
    const daysSinceLastVisit = (Date.now() - lastVisit.timestamp) / (1000 * 60 * 60 * 24);
    const recency = Math.max(0, 1 - daysSinceLastVisit / 30); // 30日で冷却

    // 累積滞在時間
    const totalMinutes = visits.reduce((s, v) => s + v.durationSeconds, 0) / 60;
    const durationFactor = Math.min(1, totalMinutes / 120); // 2時間で最大

    // アバター進化度
    const evolutionFactor = evolution
      ? Math.min(1, evolution.totalSpeechSeconds / 3600)
      : 0;

    return recency * 0.4 + durationFactor * 0.3 + evolutionFactor * 0.3;
  }

  /** ウェルカムメッセージ生成 (テンプレートベース) */
  private generateWelcome(
    visits: VisitRecord[],
    evolution: AvatarEvolution | null,
    dominantMood: string,
    visitCount: number,
    totalDuration: number,
  ): string | null {
    // 初回訪問
    if (visitCount === 0) {
      const templates = WELCOME_TEMPLATES.firstVisit;
      return templates[Math.floor(Math.random() * templates.length)];
    }

    // 常連 (10回以上)
    if (visitCount >= 10) {
      const templates = WELCOME_TEMPLATES.frequent;
      const totalHours = Math.round(totalDuration / 3600 * 10) / 10;
      return templates[Math.floor(Math.random() * templates.length)]
        .replace('{totalHours}', String(totalHours));
    }

    // リピーター
    const lastVisit = visits[visits.length - 1];
    const daysSince = Math.round((Date.now() - lastVisit.timestamp) / (1000 * 60 * 60 * 24));
    const lastDurationMin = Math.round(lastVisit.durationSeconds / 60);

    // 感情ベースのメッセージを時々混ぜる
    if (evolution && Math.random() < 0.3) {
      const moodMsg = WELCOME_TEMPLATES.emotionBased[dominantMood as keyof typeof WELCOME_TEMPLATES.emotionBased];
      if (moodMsg) return moodMsg;
    }

    const templates = WELCOME_TEMPLATES.returning;
    return templates[Math.floor(Math.random() * templates.length)]
      .replace('{duration}', String(lastDurationMin || 1))
      .replace('{visitCount}', String(visitCount + 1))
      .replace('{daysSince}', String(daysSince || 1));
  }

  /** パーティクル密度乗数 — 空間の活気を反映 */
  private calculateParticleDensity(visitCount: number, warmth: number): number {
    // Base: 1.0, Max: 1.6
    return 1 + Math.min(0.6, visitCount * 0.03 + warmth * 0.3);
  }
}

// Singleton
export const cognitiveContext = new CognitiveContext();
