/**
 * cocoro — Seasonal Content Engine
 * 季節 / 時間帯に合わせたコンテンツ — 「いつ来ても新しい」
 *
 * - 季節テーマ(桜/夏祭り/紅葉/雪)
 * - 時間帯の雰囲気(朝カフェ/深夜ラジオ)
 * - 期間限定アバターアイテム
 * - 季節イベント自動生成
 * = 「昨日来た時と違う」新鮮さ → Variable Reward
 */

export interface SeasonalTheme {
  id: string;
  name: string;
  emoji: string;
  bgColor: string;         // 背景グラデーション
  particleType: string;
  ambientSound: string;
  limitedItems: string[];
  startMonth: number;       // 1-12
  endMonth: number;
}

export interface TimeOfDayTheme {
  id: string;
  name: string;
  emoji: string;
  bgGradient: string;
  mood: string;
  suggestedActivity: string;
}

const SEASONS: SeasonalTheme[] = [
  {
    id: 'spring', name: '桜の季節', emoji: '🌸',
    bgColor: 'from-pink-900/30 to-purple-900/40',
    particleType: 'sakura', ambientSound: 'birds',
    limitedItems: ['桜のオーラ', '花びらエフェクト'],
    startMonth: 3, endMonth: 5,
  },
  {
    id: 'summer', name: '夏祭り', emoji: '🎆',
    bgColor: 'from-blue-900/30 to-indigo-900/40',
    particleType: 'fireworks', ambientSound: 'insects',
    limitedItems: ['花火エフェクト', '浴衣アバター'],
    startMonth: 6, endMonth: 8,
  },
  {
    id: 'autumn', name: '紅葉', emoji: '🍁',
    bgColor: 'from-orange-900/30 to-red-900/40',
    particleType: 'leaves', ambientSound: 'wind',
    limitedItems: ['紅葉オーラ', '温もりエフェクト'],
    startMonth: 9, endMonth: 11,
  },
  {
    id: 'winter', name: '雪景色', emoji: '❄️',
    bgColor: 'from-slate-800/30 to-blue-900/40',
    particleType: 'snow', ambientSound: 'crackling_fire',
    limitedItems: ['雪のオーラ', 'マフラーアバター'],
    startMonth: 12, endMonth: 2,
  },
];

const TIME_THEMES: TimeOfDayTheme[] = [
  { id: 'morning', name: '朝のカフェ', emoji: '☕', bgGradient: 'from-amber-900/20 to-orange-900/20', mood: 'のんびり', suggestedActivity: 'ゆるトーク' },
  { id: 'afternoon', name: '午後のリビング', emoji: '🛋️', bgGradient: 'from-emerald-900/20 to-teal-900/20', mood: 'まったり', suggestedActivity: '趣味の話' },
  { id: 'evening', name: '夕暮れのテラス', emoji: '🌅', bgGradient: 'from-orange-900/20 to-pink-900/20', mood: 'ワクワク', suggestedActivity: '今日あったこと' },
  { id: 'night', name: '夜のバー', emoji: '🌙', bgGradient: 'from-violet-900/20 to-indigo-900/20', mood: '大人', suggestedActivity: '深い話' },
  { id: 'latenight', name: '深夜ラジオ', emoji: '📻', bgGradient: 'from-slate-900/30 to-gray-900/30', mood: 'まったり', suggestedActivity: '独り言のような話' },
];

export class SeasonalContentEngine {
  /**
   * 現在の季節テーマ
   */
  getCurrentSeason(): SeasonalTheme {
    const month = new Date().getMonth() + 1;
    return SEASONS.find(s => {
      if (s.startMonth <= s.endMonth) {
        return month >= s.startMonth && month <= s.endMonth;
      }
      return month >= s.startMonth || month <= s.endMonth; // winter wraps
    }) || SEASONS[0];
  }

  /**
   * 現在の時間帯テーマ
   */
  getCurrentTimeTheme(): TimeOfDayTheme {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return TIME_THEMES[0];   // morning
    if (hour >= 12 && hour < 17) return TIME_THEMES[1];  // afternoon
    if (hour >= 17 && hour < 21) return TIME_THEMES[2];  // evening
    if (hour >= 21 && hour < 24) return TIME_THEMES[3];  // night
    return TIME_THEMES[4]; // late night (0-5)
  }

  /**
   * 今日の限定アイテム
   */
  getDailyLimitedItems(): string[] {
    const season = this.getCurrentSeason();
    return season.limitedItems;
  }

  /**
   * 季節イベント提案
   */
  getSeasonalEvent(): { name: string; description: string; emoji: string } {
    const season = this.getCurrentSeason();
    const time = this.getCurrentTimeTheme();

    return {
      name: `${season.emoji} ${season.name}の${time.name}`,
      description: `${time.mood}な雰囲気で${time.suggestedActivity}`,
      emoji: `${season.emoji}${time.emoji}`,
    };
  }

  /**
   * 背景グラデーション(季節+時間帯を合成)
   */
  getBackgroundStyle(): { gradient: string; particles: string } {
    const season = this.getCurrentSeason();
    const time = this.getCurrentTimeTheme();
    return {
      gradient: `bg-gradient-to-br ${season.bgColor}`,
      particles: season.particleType,
    };
  }

  static getAllSeasons(): SeasonalTheme[] { return [...SEASONS]; }
  static getAllTimeThemes(): TimeOfDayTheme[] { return [...TIME_THEMES]; }
}
