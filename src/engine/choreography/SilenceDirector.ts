/**
 * cocoro — Silence Director
 * 沈黙を「気まずさ」から「演出」に変換する
 *
 * サイクル2: ラジオの「間」を再現
 * - 沈黙5秒: BGMがゆっくりフェードイン
 * - 沈黙10秒: 「考え中...」のやさしい表示
 * - 沈黙15秒: トピックカードが浮かび上がる
 * - 沈黙30秒: BGMが盛り上がり → 「誰か最初に話す？」
 * = 沈黙を恐れなくていい空間設計
 */

export type SilencePhase = 'none' | 'ambient' | 'thinking' | 'suggest' | 'encourage';

export interface SilenceState {
  phase: SilencePhase;
  durationSeconds: number;
  bgmVolume: number;     // 0-1
  showThinking: boolean;
  showTopicSuggestion: boolean;
  showEncouragement: boolean;
  encouragementText: string;
}

const ENCOURAGEMENTS = [
  '最初に話した人はヒーロー 🦸',
  'なにか思いついた？ 💭',
  '沈黙も会話の一部 🌙',
  'ひとこと、なんでもOK ✨',
  'このままゆったりもアリ 🍃',
];

export class SilenceDirector {
  private silenceStart: number | null = null;
  private state: SilenceState = {
    phase: 'none', durationSeconds: 0,
    bgmVolume: 0, showThinking: false,
    showTopicSuggestion: false, showEncouragement: false,
    encouragementText: '',
  };
  private encouragementIndex = 0;

  /**
   * フレーム更新
   */
  update(anySpeaking: boolean, participantCount: number): SilenceState {
    if (anySpeaking || participantCount <= 1) {
      // 誰か話している or 一人しかいない → リセット
      this.silenceStart = null;
      this.state = {
        phase: 'none', durationSeconds: 0,
        bgmVolume: 0, showThinking: false,
        showTopicSuggestion: false, showEncouragement: false,
        encouragementText: '',
      };
      return this.state;
    }

    // 沈黙計測
    if (!this.silenceStart) this.silenceStart = Date.now();
    const duration = (Date.now() - this.silenceStart) / 1000;
    this.state.durationSeconds = duration;

    if (duration < 5) {
      this.state.phase = 'none';
      this.state.bgmVolume = 0;
    } else if (duration < 10) {
      // Phase 1: BGMフェードイン
      this.state.phase = 'ambient';
      this.state.bgmVolume = Math.min(0.3, (duration - 5) / 5 * 0.3);
    } else if (duration < 15) {
      // Phase 2: 「考え中...」
      this.state.phase = 'thinking';
      this.state.bgmVolume = 0.3;
      this.state.showThinking = true;
    } else if (duration < 30) {
      // Phase 3: トピック提案
      this.state.phase = 'suggest';
      this.state.bgmVolume = 0.4;
      this.state.showThinking = false;
      this.state.showTopicSuggestion = true;
    } else {
      // Phase 4: 励まし
      this.state.phase = 'encourage';
      this.state.bgmVolume = 0.5;
      this.state.showTopicSuggestion = true;
      this.state.showEncouragement = true;
      this.state.encouragementText = ENCOURAGEMENTS[this.encouragementIndex % ENCOURAGEMENTS.length];
      // 30秒ごとにメッセージ変更
      if (Math.floor(duration) % 30 === 0) this.encouragementIndex++;
    }

    return { ...this.state };
  }

  getState(): SilenceState { return { ...this.state }; }
  getSilenceDuration(): number { return this.state.durationSeconds; }
}
