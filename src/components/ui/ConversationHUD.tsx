/**
 * kokoro — Conversation HUD
 * 沈黙演出 + 会話アーク + 現在の状態表示
 *
 * サイクル11: SilenceDirector + ConversationArcのUI
 * - 沈黙フェーズの表示(考え中.../トピック提案/励まし)
 * - 会話の盛り上がりメーター
 * - クライマックスエフェクト
 * - セッション時間表示
 */
'use client';

import { useMemo } from 'react';
import type { SilenceState } from '@/engine/choreography/SilenceDirector';
import type { ArcState } from '@/engine/choreography/ConversationArcDirector';

interface ConversationHUDProps {
  silenceState: SilenceState;
  arcState: ArcState;
  sessionMinutes: number;
  participantCount: number;
}

export function ConversationHUD({ silenceState, arcState, sessionMinutes, participantCount }: ConversationHUDProps) {
  const arcColor = useMemo(() => {
    switch (arcState.phase) {
      case 'opening': return 'from-blue-400/20 to-blue-600/20';
      case 'developing': return 'from-emerald-400/20 to-emerald-600/20';
      case 'climax': return 'from-orange-400/30 to-red-500/30';
      case 'resolution': return 'from-purple-400/20 to-purple-600/20';
      case 'ending': return 'from-gray-400/10 to-gray-600/10';
    }
  }, [arcState.phase]);

  const arcLabel = useMemo(() => {
    switch (arcState.phase) {
      case 'opening': return '🌅 はじまり';
      case 'developing': return '💬 盛り上がり中';
      case 'climax': return '🔥 最高潮！';
      case 'resolution': return '🌙 余韻';
      case 'ending': return '✨ おしまい';
    }
  }, [arcState.phase]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      {/* Session info */}
      <div className="flex items-center gap-3 mb-2 justify-center">
        <span className="text-[9px] text-white/20">
          {Math.floor(sessionMinutes)}分 · {participantCount}人
        </span>
      </div>

      {/* Conversation arc indicator */}
      <div className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${arcColor}
        backdrop-blur-xl border border-white/5 transition-all duration-1000`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40">{arcLabel}</span>
          {/* Intensity bar */}
          <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-white/30 transition-all duration-500"
              style={{ width: `${arcState.intensity * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Silence-phase displays */}
      {silenceState.showThinking && (
        <div className="mt-3 text-center" style={{ animation: 'fade-in-up 0.5s ease-out' }}>
          <span className="text-xs text-white/25">考え中... 💭</span>
        </div>
      )}

      {silenceState.showEncouragement && (
        <div className="mt-3 text-center" style={{ animation: 'fade-in-up 0.5s ease-out' }}>
          <span className="text-xs text-white/30">{silenceState.encouragementText}</span>
        </div>
      )}

      {/* Climax effect */}
      {arcState.phase === 'climax' && (
        <div className="fixed inset-0 pointer-events-none z-10
          bg-gradient-to-t from-orange-500/5 via-transparent to-transparent
          transition-opacity duration-1000" />
      )}

      {/* Suggested action */}
      {arcState.suggestedAction && arcState.phase === 'ending' && (
        <div className="mt-3 text-center" style={{ animation: 'fade-in-up 0.5s ease-out' }}>
          <span className="text-xs text-white/20">{arcState.suggestedAction}</span>
        </div>
      )}
    </div>
  );
}
