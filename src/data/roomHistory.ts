/**
 * kokoro — Room History Manager
 * 最近訪れたルームの履歴を管理
 * 
 * 思想: 「緩い繋がり」= 一期一会ではなく、また戻れる場所がある
 */

export interface RoomHistoryEntry {
  roomId: string;
  roomName: string;
  themeId: string;
  lastVisited: number;
  visitCount: number;
}

const STORAGE_KEY = 'kokoro_room_history';
const MAX_HISTORY = 20;

/** 訪問履歴を取得 */
export function getRoomHistory(): RoomHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RoomHistoryEntry[];
  } catch {
    return [];
  }
}

/** ルーム訪問を記録 */
export function recordRoomVisit(roomId: string, roomName: string, themeId: string): void {
  const history = getRoomHistory();
  const existing = history.find((h) => h.roomId === roomId);

  if (existing) {
    existing.lastVisited = Date.now();
    existing.visitCount++;
  } else {
    history.unshift({
      roomId,
      roomName,
      themeId,
      lastVisited: Date.now(),
      visitCount: 1,
    });
  }

  // Sort by last visited, cap at max
  history.sort((a, b) => b.lastVisited - a.lastVisited);
  const trimmed = history.slice(0, MAX_HISTORY);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** 訪問回数の合計 */
export function getTotalVisits(): number {
  return getRoomHistory().reduce((sum, h) => sum + h.visitCount, 0);
}
