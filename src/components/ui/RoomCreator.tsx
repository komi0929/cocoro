/**
 * kokoro — Room Creator
 * ユーザーが「場」を作れる — VRChatの成功要因
 *
 * サイクル11: テーマ付きルーム作成
 * - カテゴリ/タグ/説明/ルール設定
 * - 最大人数設定
 * - 公開/フレンド限定/招待制
 * = ユーザーが場を作る → 帰属意識 → リテンション
 */
'use client';

import { useState, useCallback } from 'react';

export type RoomVisibility = 'public' | 'friends' | 'invite';

export interface RoomConfig {
  name: string;
  description: string;
  category: string;
  tags: string[];
  visibility: RoomVisibility;
  maxParticipants: number;
  bgmTheme: string;
  rules: string[];
}

const CATEGORIES = [
  { key: 'casual', label: '雑談', emoji: '💬' },
  { key: 'hobby', label: '趣味', emoji: '🎮' },
  { key: 'music', label: '音楽', emoji: '🎵' },
  { key: 'study', label: '勉強', emoji: '📖' },
  { key: 'night', label: '深夜雑談', emoji: '🌙' },
  { key: 'game', label: 'ゲーム', emoji: '🎲' },
  { key: 'anime', label: 'アニメ', emoji: '📺' },
];

const TAG_SUGGESTIONS = ['初心者歓迎', '20代', '30代', '社会人', '学生', 'まったり', 'ワイワイ', '人見知りOK'];

interface RoomCreatorProps {
  onCreateRoom: (config: RoomConfig) => void;
  onClose: () => void;
}

export function RoomCreator({ onCreateRoom, onClose }: RoomCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('casual');
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [maxParticipants, setMaxParticipants] = useState(8);

  const toggleTag = useCallback((tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev.slice(0, 4), tag]);
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    onCreateRoom({
      name: name.trim(),
      description: description.trim(),
      category, tags, visibility, maxParticipants,
      bgmTheme: 'default', rules: [],
    });
    if (navigator.vibrate) navigator.vibrate([10, 20, 10]);
  }, [name, description, category, tags, visibility, maxParticipants, onCreateRoom]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0f0a1a]">
      <div className="max-w-md mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-white/90">ルームを作る</h1>
          <button onClick={onClose} className="text-white/30 hover:text-white/60">✕</button>
        </div>

        <div className="space-y-5">
          {/* Room name */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">ルーム名</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="例: 金曜深夜の雑談部屋"
              maxLength={30}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10
                text-white/80 text-sm placeholder:text-white/20 outline-none
                focus:border-violet-400/30 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">説明 (任意)</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="どんな部屋か教えてください"
              maxLength={100} rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10
                text-white/80 text-sm placeholder:text-white/20 outline-none resize-none
                focus:border-violet-400/30 transition-colors"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setCategory(c.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all active:scale-95
                    ${category === c.key
                      ? 'bg-violet-500/20 border border-violet-400/30 text-violet-200'
                      : 'bg-white/5 border border-white/8 text-white/40 hover:bg-white/8'
                    }`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">タグ (最大4つ)</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_SUGGESTIONS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-all active:scale-95
                    ${tags.includes(tag)
                      ? 'bg-emerald-500/15 border border-emerald-400/25 text-emerald-300'
                      : 'bg-white/5 border border-white/8 text-white/30 hover:bg-white/8'
                    }`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">公開設定</label>
            <div className="flex gap-2">
              {([['public', '🌐 公開'], ['friends', '👫 フレンド'], ['invite', '🔒 招待制']] as const).map(([v, label]) => (
                <button key={v} onClick={() => setVisibility(v)}
                  className={`flex-1 py-2.5 rounded-xl text-xs transition-all active:scale-95
                    ${visibility === v
                      ? 'bg-violet-500/20 border border-violet-400/30 text-violet-200'
                      : 'bg-white/5 border border-white/8 text-white/40'
                    }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max participants */}
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">最大人数: {maxParticipants}人</label>
            <input type="range" min={2} max={16} value={maxParticipants}
              onChange={e => setMaxParticipants(Number(e.target.value))}
              className="w-full accent-violet-400" />
          </div>

          {/* Create button */}
          <button onClick={handleCreate} disabled={!name.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-98
              ${name.trim()
                ? 'bg-violet-500/20 border border-violet-400/30 text-violet-200 hover:bg-violet-500/30'
                : 'bg-white/5 border border-white/8 text-white/15 cursor-not-allowed'
              }`}>
            ルームを作成 ✨
          </button>
        </div>
      </div>
    </div>
  );
}
