/**
 * kokoro — Live Caption (STT)
 * リアルタイム字幕 — アクセシビリティの核
 *
 * サイクル62: 声が聞こえない/聞きにくい人のための字幕
 * - Web Speech API (SpeechRecognition)
 * - リアルタイムで画面下部に字幕表示
 * - 話者名付き
 * - ON/OFF設定
 * = 聴覚障害者/騒がしい環境でも使える
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface CaptionEntry {
  id: string;
  speakerName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface LiveCaptionProps {
  enabled: boolean;
  onToggle: () => void;
}

export function LiveCaption({ enabled, onToggle }: LiveCaptionProps) {
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const recognitionRef = useRef<ReturnType<typeof Object.create> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognitionAPI = typeof window !== 'undefined'
      ? ((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as { new(): { continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: unknown) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void } } | null
      : null;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onresult = (event: unknown) => {
      const e = event as { resultIndex: number; results: Array<{ isFinal: boolean; 0: { transcript: string } }> };
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        const isFinal = result.isFinal;

        setCaptions(prev => {
          const newCaptions = [...prev];
          const existingIdx = newCaptions.findIndex(c => c.id === `cap_${i}`);
          const entry: CaptionEntry = {
            id: `cap_${i}`, speakerName: '自分',
            text, timestamp: Date.now(), isFinal,
          };

          if (existingIdx >= 0) {
            newCaptions[existingIdx] = entry;
          } else {
            newCaptions.push(entry);
          }

          // Keep last 5 captions
          return newCaptions.slice(-5);
        });
      }
    };

    recognition.onerror = () => { /* silently handle */ };
    recognition.onend = () => {
      // Auto-restart
      if (enabled && recognitionRef.current) {
        try { recognition.start(); } catch { /* already started */ }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch { /* not available */ }

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [enabled]);

  // Auto-clean old captions
  useEffect(() => {
    if (captions.length === 0) return;
    const timer = setInterval(() => {
      setCaptions(prev => prev.filter(c => Date.now() - c.timestamp < 10000));
    }, 2000);
    return () => clearInterval(timer);
  }, [captions.length]);

  return (
    <>
      {/* Toggle button */}
      <button onClick={onToggle}
        className={`fixed bottom-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center
          transition-all active:scale-95
          ${enabled
            ? 'bg-violet-500/20 border border-violet-400/30 text-violet-200'
            : 'bg-white/5 border border-white/8 text-white/30'
          }`}>
        <span className="text-sm">字</span>
      </button>

      {/* Caption display */}
      {enabled && captions.length > 0 && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20 w-[90vw] max-w-md
          pointer-events-none">
          <div className="bg-black/70 backdrop-blur-xl rounded-xl px-4 py-2">
            {captions.map(cap => (
              <p key={cap.id} className={`text-sm leading-relaxed transition-opacity
                ${cap.isFinal ? 'text-white/90' : 'text-white/50'}`}>
                <span className="text-[9px] text-white/30 mr-1">{cap.speakerName}</span>
                {cap.text}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
