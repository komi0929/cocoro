/**
 * cocoro - Furniture Catalog v4
 * 50 voxel furniture definitions
 * Procedural generation with color noise + wall placement support
 */

import type { FurnitureDef } from '@/types/cocoro';

export const FURNITURE_CATALOG: FurnitureDef[] = [
  // ============================================================
  // Chill - 13
  // ============================================================
  {
    type: 'bed', name: '\u4E8C\u6BB5\u30D9\u30C3\u30C9', icon: '\u{1F6CF}\uFE0F', cost: 20, category: 'chill',
    nanoBananaPrompt: 'Pixel art bunk bed icon, cozy blankets, voxel style, dark bg',
  },
  {
    type: 'sofa', name: '\u30BD\u30D5\u30A1 (\u30D1\u30FC\u30D7\u30EB)', icon: '\u{1F6CB}\uFE0F', cost: 15, category: 'chill',
    nanoBananaPrompt: 'Pixel art chunky sofa icon, purple cushions, voxel style, dark bg',
  },
  {
    type: 'sofa_red', name: '\u30BD\u30D5\u30A1 (\u30EC\u30C3\u30C9)', icon: '\u{1F6CB}\uFE0F', cost: 15, category: 'chill',
    nanoBananaPrompt: 'Pixel art chunky sofa icon, red cushions, voxel style, dark bg',
  },
  {
    type: 'sofa_green', name: '\u30BD\u30D5\u30A1 (\u30B0\u30EA\u30FC\u30F3)', icon: '\u{1F6CB}\uFE0F', cost: 15, category: 'chill',
    nanoBananaPrompt: 'Pixel art chunky sofa icon, olive green cushions, voxel style, dark bg',
  },
  {
    type: 'l_sofa', name: 'L\u5B57\u30BD\u30D5\u30A1', icon: '\u{1F532}', cost: 22, category: 'chill',
    nanoBananaPrompt: 'Pixel art L-shaped sectional sofa, neon accents, voxel style, dark bg',
  },
  {
    type: 'beanbag', name: '\u30D3\u30FC\u30BA\u30AF\u30C3\u30B7\u30E7\u30F3', icon: '\u{1F7E3}', cost: 8, category: 'chill',
    nanoBananaPrompt: 'Pixel art beanbag chair icon, soft round shape, voxel style, dark bg',
  },
  {
    type: 'hammock', name: '\u30CF\u30F3\u30E2\u30C3\u30AF', icon: '\u{1F3D6}\uFE0F', cost: 12, category: 'chill',
    nanoBananaPrompt: 'Pixel art indoor hammock icon, colorful fabric, voxel style, dark bg',
  },
  {
    type: 'rug', name: '\u30E9\u30B0\u30DE\u30C3\u30C8', icon: '\u{1F7EA}', cost: 6, category: 'chill',
    nanoBananaPrompt: 'Pixel art colorful floor rug, geometric pattern, voxel style, dark bg',
  },
  {
    type: 'rug_round', name: '\u4E38\u30E9\u30B0', icon: '\u2B55', cost: 5, category: 'chill',
    nanoBananaPrompt: 'Pixel art round fluffy rug, pastel colors, voxel style, dark bg',
  },
  {
    type: 'rug_stripe', name: '\u30B9\u30C8\u30E9\u30A4\u30D7\u30E9\u30B0', icon: '\u{1F7EB}', cost: 6, category: 'chill',
    nanoBananaPrompt: 'Pixel art striped floor rug, warm tones, voxel style, dark bg',
  },
  {
    type: 'cushion', name: '\u30D5\u30ED\u30A2 \u30AF\u30C3\u30B7\u30E7\u30F3', icon: '\u{1F49C}', cost: 3, category: 'chill',
    nanoBananaPrompt: 'Pixel art floor cushion icon, stack of two, voxel style, dark bg',
  },
  {
    type: 'low_table', name: '\u30BB\u30F3\u30BF\u30FC\u30C6\u30FC\u30D6\u30EB', icon: '\u{1FAB5}', cost: 10, category: 'chill',
    nanoBananaPrompt: 'Pixel art wooden low table, minimalist, voxel style, dark bg',
  },
  {
    type: 'cactus', name: '\u30B5\u30DC\u30C6\u30F3', icon: '\u{1F335}', cost: 5, category: 'chill',
    nanoBananaPrompt: 'Pixel art potted cactus, desert green, voxel style, dark bg',
  },

  // ============================================================
  // Play - 11
  // ============================================================
  {
    type: 'arcade', name: '\u30A2\u30FC\u30B1\u30FC\u30C9\u7B50\u4F53', icon: '\u{1F579}\uFE0F', cost: 25, category: 'play',
    nanoBananaPrompt: 'Pixel art retro arcade cabinet icon, glowing screen, voxel style, dark bg',
  },
  {
    type: 'skateboard', name: '\u30B9\u30B1\u30DC\u30FC', icon: '\u{1F6F9}', cost: 4, category: 'play',
    nanoBananaPrompt: 'Pixel art skateboard icon lying on floor, neon wheels, voxel style, dark bg',
  },
  {
    type: 'dj_booth', name: 'DJ\u30D6\u30FC\u30B9', icon: '\u{1F3A7}', cost: 28, category: 'play',
    nanoBananaPrompt: 'Pixel art DJ turntable booth icon, LED lights, voxel style, dark bg',
  },
  {
    type: 'pizza_box', name: '\u30D4\u30B6\u306E\u7BB1', icon: '\u{1F355}', cost: 2, category: 'play',
    nanoBananaPrompt: 'Pixel art stacked pizza boxes icon, open one on top, voxel style, dark bg',
  },
  {
    type: 'basketball', name: '\u30D0\u30B9\u30B1\u30C3\u30C8\u30DC\u30FC\u30EB', icon: '\u{1F3C0}', cost: 3, category: 'play',
    nanoBananaPrompt: 'Pixel art basketball icon, orange with black lines, voxel style, dark bg',
  },
  {
    type: 'guitar', name: '\u30AE\u30BF\u30FC', icon: '\u{1F3B8}', cost: 10, category: 'play',
    nanoBananaPrompt: 'Pixel art electric guitar on stand icon, red body, voxel style, dark bg',
  },
  {
    type: 'boombox', name: '\u30D6\u30FC\u30E0\u30DC\u30C3\u30AF\u30B9', icon: '\u{1F4FB}', cost: 8, category: 'play',
    nanoBananaPrompt: 'Pixel art retro boombox icon, big speakers, voxel style, dark bg',
  },
  {
    type: 'big_speaker', name: '\u5DE8\u5927\u30B9\u30D4\u30FC\u30AB\u30FC', icon: '\u{1F50A}', cost: 18, category: 'play',
    nanoBananaPrompt: 'Pixel art tall PA speaker tower, bass heavy, voxel style, dark bg',
  },
  {
    type: 'pinball', name: '\u30D4\u30F3\u30DC\u30FC\u30EB', icon: '\u{1F3B0}', cost: 22, category: 'play',
    nanoBananaPrompt: 'Pixel art pinball machine, flashy lights, voxel style, dark bg',
  },
  {
    type: 'vinyl_player', name: '\u30EC\u30B3\u30FC\u30C9\u30D7\u30EC\u30A4\u30E4\u30FC', icon: '\u{1F4BF}', cost: 12, category: 'play',
    nanoBananaPrompt: 'Pixel art vinyl record player, spinning disc, voxel style, dark bg',
  },
  {
    type: 'foam_sword', name: '\u30B9\u30DD\u30F3\u30B8\u5263', icon: '\u2694\uFE0F', cost: 3, category: 'play',
    nanoBananaPrompt: 'Pixel art foam sword toy, bright blue, voxel style, dark bg',
  },

  // ============================================================
  // Desk - 11
  // ============================================================
  {
    type: 'desk', name: '\u30B2\u30FC\u30DF\u30F3\u30B0\u30C7\u30B9\u30AF', icon: '\u{1F5A5}\uFE0F', cost: 15, category: 'desk',
    nanoBananaPrompt: 'Pixel art gaming desk with LED strip, voxel style, dark bg',
  },
  {
    type: 'gaming_chair', name: '\u30B2\u30FC\u30DF\u30F3\u30B0\u30C1\u30A7\u30A2', icon: '\u{1F4BA}', cost: 12, category: 'desk',
    nanoBananaPrompt: 'Pixel art racing gaming chair, red and black, voxel style, dark bg',
  },
  {
    type: 'monitor', name: '\u30E2\u30CB\u30BF\u30FC', icon: '\u{1F5A5}\uFE0F', cost: 10, category: 'desk',
    nanoBananaPrompt: 'Pixel art curved gaming monitor, glowing screen, voxel style, dark bg',
  },
  {
    type: 'monitor_dual', name: '\u30C7\u30E5\u30A2\u30EB\u30E2\u30CB\u30BF\u30FC', icon: '\u{1F5A5}\uFE0F', cost: 18, category: 'desk',
    nanoBananaPrompt: 'Pixel art dual monitor setup, wide screens, voxel style, dark bg',
  },
  {
    type: 'gaming_pc', name: '\u30B2\u30FC\u30DF\u30F3\u30B0PC', icon: '\u{1F4BB}', cost: 20, category: 'desk',
    nanoBananaPrompt: 'Pixel art gaming PC tower, RGB lights, tempered glass, voxel style, dark bg',
  },
  {
    type: 'steel_rack', name: '\u30B9\u30C1\u30FC\u30EB\u30E9\u30C3\u30AF', icon: '\u{1F5C4}\uFE0F', cost: 8, category: 'desk',
    nanoBananaPrompt: 'Pixel art industrial steel rack with items, voxel style, dark bg',
  },
  {
    type: 'chair', name: '\u30A4\u30B9', icon: '\u{1FA91}', cost: 5, category: 'desk',
    nanoBananaPrompt: 'Pixel art wooden chair icon, simple design, voxel style, dark bg',
  },
  {
    type: 'table', name: '\u30ED\u30FC\u30C6\u30FC\u30D6\u30EB', icon: '\u{1F375}', cost: 10, category: 'desk',
    nanoBananaPrompt: 'Pixel art low table with snacks and drinks, voxel style, dark bg',
  },
  {
    type: 'shelf', name: '\u30B7\u30A7\u30EB\u30D5', icon: '\u{1F4DA}', cost: 10, category: 'desk',
    nanoBananaPrompt: 'Pixel art bookshelf with manga and figures, voxel style, dark bg',
  },
  {
    type: 'filing_cabinet', name: '\u30D5\u30A1\u30A4\u30EA\u30F3\u30B0\u30AD\u30E3\u30D3\u30CD\u30C3\u30C8', icon: '\u{1F5C3}\uFE0F', cost: 7, category: 'desk',
    nanoBananaPrompt: 'Pixel art metal filing cabinet, industrial, voxel style, dark bg',
  },
  {
    type: 'whiteboard', name: '\u30DB\u30EF\u30A4\u30C8\u30DC\u30FC\u30C9', icon: '\u{1F4CB}', cost: 8, category: 'desk', placement: 'wall',
    nanoBananaPrompt: 'Pixel art whiteboard on wheels, notes pinned, voxel style, dark bg',
  },

  // ============================================================
  // Light - 9
  // ============================================================
  {
    type: 'lamp', name: '\u30C7\u30B9\u30AF\u30E9\u30F3\u30D7', icon: '\u{1F4A1}', cost: 8, category: 'light',
    nanoBananaPrompt: 'Pixel art desk lamp glowing warm yellow, voxel style, dark bg',
  },
  {
    type: 'floor_lamp', name: '\u30D5\u30ED\u30A2\u30E9\u30F3\u30D7', icon: '\u{1F526}', cost: 12, category: 'light',
    nanoBananaPrompt: 'Pixel art tall floor lamp, warm amber glow, voxel style, dark bg',
  },
  {
    type: 'neon_sign', name: '\u30CD\u30AA\u30F3\u30B5\u30A4\u30F3', icon: '\u2728', cost: 15, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art neon sign "CHILL" in cyan, voxel style, dark bg',
  },
  {
    type: 'neon_heart', name: '\u30CD\u30AA\u30F3\u30CF\u30FC\u30C8', icon: '\u{1F497}', cost: 12, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art neon heart, glowing pink, voxel style, dark bg',
  },
  {
    type: 'neon_star', name: '\u30CD\u30AA\u30F3\u30B9\u30BF\u30FC', icon: '\u2B50', cost: 12, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art neon star, glowing yellow, voxel style, dark bg',
  },
  {
    type: 'lava_lamp', name: '\u30E9\u30D0\u30E9\u30F3\u30D7', icon: '\u{1FAE7}', cost: 7, category: 'light',
    nanoBananaPrompt: 'Pixel art lava lamp, purple blob inside, voxel style, dark bg',
  },
  {
    type: 'string_lights', name: '\u30B9\u30C8\u30EA\u30F3\u30B0\u30E9\u30A4\u30C8', icon: '\u{1F31F}', cost: 6, category: 'light', placement: 'wall',
    nanoBananaPrompt: 'Pixel art fairy string lights, warm glow, voxel style, dark bg',
  },
  {
    type: 'pendant_light', name: '\u30DA\u30F3\u30C0\u30F3\u30C8\u30E9\u30A4\u30C8', icon: '\u{1FA94}', cost: 10, category: 'light',
    nanoBananaPrompt: 'Pixel art hanging pendant light, industrial, voxel style, dark bg',
  },
  {
    type: 'candle_set', name: '\u30AD\u30E3\u30F3\u30C9\u30EB\u30BB\u30C3\u30C8', icon: '\u{1F56F}\uFE0F', cost: 5, category: 'light',
    nanoBananaPrompt: 'Pixel art set of candles, flickering flame, voxel style, dark bg',
  },

  // ============================================================
  // Deco - 12
  // ============================================================
  {
    type: 'poster', name: '\u30DD\u30B9\u30BF\u30FC', icon: '\u{1F5BC}\uFE0F', cost: 5, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art poster frame on wall, anime style, voxel style, dark bg',
  },
  {
    type: 'poster_frame', name: '\u30A2\u30FC\u30C8\u30D5\u30EC\u30FC\u30E0', icon: '\u{1F3A8}', cost: 6, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art framed artwork, abstract art, voxel style, dark bg',
  },
  {
    type: 'wall_shelf', name: '\u30A6\u30A9\u30FC\u30EB\u30B7\u30A7\u30EB\u30D5', icon: '\u{1F4D5}', cost: 8, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art wall-mounted shelf with items, voxel style, dark bg',
  },
  {
    type: 'plant', name: '\u89B3\u8449\u690D\u7269', icon: '\u{1F33F}', cost: 4, category: 'deco',
    nanoBananaPrompt: 'Pixel art potted plant, small monstera, voxel style, dark bg',
  },
  {
    type: 'plant_tall', name: '\u5927\u304D\u3044\u89B3\u8449\u690D\u7269', icon: '\u{1F334}', cost: 7, category: 'deco',
    nanoBananaPrompt: 'Pixel art tall fiddle leaf fig tree in pot, voxel style, dark bg',
  },
  {
    type: 'plant_hanging', name: '\u540A\u308A\u4E0B\u3052\u690D\u7269', icon: '\u{1F331}', cost: 5, category: 'deco',
    nanoBananaPrompt: 'Pixel art hanging plant in macrame holder, voxel style, dark bg',
  },
  {
    type: 'terrarium', name: '\u30C6\u30E9\u30EA\u30A6\u30E0', icon: '\u{1F3FA}', cost: 6, category: 'deco',
    nanoBananaPrompt: 'Pixel art glass terrarium with moss, voxel style, dark bg',
  },
  {
    type: 'globe', name: '\u5730\u7403\u5100', icon: '\u{1F30D}', cost: 6, category: 'deco',
    nanoBananaPrompt: 'Pixel art retro desk globe, spinning, voxel style, dark bg',
  },
  {
    type: 'trophy', name: '\u30C8\u30ED\u30D5\u30A3\u30FC', icon: '\u{1F3C6}', cost: 5, category: 'deco',
    nanoBananaPrompt: 'Pixel art golden trophy cup, voxel style, dark bg',
  },
  {
    type: 'clock', name: '\u639B\u3051\u6642\u8A08', icon: '\u{1F550}', cost: 4, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art round wall clock, neon frame, voxel style, dark bg',
  },
  {
    type: 'vinyl_record', name: '\u30EC\u30B3\u30FC\u30C9\u98FE\u308A', icon: '\u{1F4C0}', cost: 3, category: 'deco', placement: 'wall',
    nanoBananaPrompt: 'Pixel art vinyl record wall decor, retro, voxel style, dark bg',
  },
  {
    type: 'mini_fridge', name: '\u30DF\u30CB\u51B7\u8535\u5EAB', icon: '\u{1F9CA}', cost: 10, category: 'deco',
    nanoBananaPrompt: 'Pixel art mini fridge with stickers, retro, voxel style, dark bg',
  },
];

export const ROOM_CAPACITY_MAX = 200;

export function getFurnitureDef(type: string): FurnitureDef | undefined {
  return FURNITURE_CATALOG.find(f => f.type === type);
}

export function getCatalogByCategory() {
  const groups: Record<string, typeof FURNITURE_CATALOG> = {};
  for (const def of FURNITURE_CATALOG) {
    const cat = def.category ?? 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(def);
  }
  return groups;
}

export const CATEGORY_LABELS: Record<string, string> = {
  chill: '\u{1F6CB}\uFE0F \u30C1\u30EB',
  play: '\u{1F579}\uFE0F \u904A\u3073',
  desk: '\u{1F5A5}\uFE0F \u30C7\u30B9\u30AF',
  light: '\u{1F4A1} \u7167\u660E',
  deco: '\u{1F33F} \u30C7\u30B3',
};
