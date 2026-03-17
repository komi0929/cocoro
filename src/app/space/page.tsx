/**
 * cocoro — Space Page (スリム版)
 * 小学生向け: 3Dアバター空間 + マイク + リアクション + SafetyGuard
 */
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCocoroStore } from '@/store/useCocoroStore';
import { SpaceHUD } from '@/components/ui/SpaceHUD';
import { SafetyGuard } from '@/components/ui/SafetyGuard';
import { DemoOrchestrator } from '@/engine/demo/DemoOrchestrator';
import { useSpaceEngines } from '@/hooks/useSpaceEngines';
import { v4 as uuidv4 } from 'uuid';

const CocoroCanvas = dynamic(
  () =>
    import('@/components/three/CocoroCanvas').then((m) => ({
      default: m.CocoroCanvas,
    })),
  { ssr: false }
);

export default function SpacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useCocoroStore;
  const engines = useSpaceEngines();
  const demoRef = useRef<DemoOrchestrator | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // URLパラメータ
  const roomId = searchParams.get('room') ?? `room-${Math.floor(1000 + Math.random() * 9000)}`;
  const displayName = searchParams.get('name') ?? 'ゲスト';
  const avatarId = searchParams.get('avatar') ?? 'seed-san';
  const roomCode = searchParams.get('code') ?? '';

  // ローカルユーザー登録 + デモ開始
  useEffect(() => {
    const localId = uuidv4();
    store.getState().setLocalParticipantId(localId);
    store.getState().setRoomId(roomId);

    // ローカル参加者を追加
    store.getState().addParticipant({
      id: localId,
      displayName: decodeURIComponent(displayName),
      vrmUrl: null,
      avatarId,
      isGuest: false,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        lookAtTarget: null,
      },
      speakingState: {
        isSpeaking: false,
        volume: 0,
        pitch: 0,
        currentViseme: 'sil',
        visemeWeight: 0,
      },
      emotion: {
        joy: 0,
        anger: 0,
        sorrow: 0,
        surprise: 0,
        neutral: 1,
      },
    });

    // デモNPC追加
    const demo = new DemoOrchestrator(store);
    demoRef.current = demo;
    demo.start(3);

    // ローディング完了
    setTimeout(() => setIsLoaded(true), 1500);

    return () => {
      demo.stop();
      store.getState().removeParticipant(localId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 退出ハンドラ
  const handleLeave = useCallback(() => {
    router.push('/lobby');
  }, [router]);

  // ローディング画面
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#e8f4fd] via-[#f0f7ff] to-[#fef3f2] flex flex-col items-center justify-center">
        <div className="text-5xl mb-6 animate-bounce-in">🫧</div>
        <div className="text-gray-400 text-sm font-medium mb-4">
          おへやに はいっているよ...
        </div>
        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-shimmer" 
            style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <SafetyGuard timeLimitMinutes={30} onEscape={handleLeave}>
      {/* 3D Canvas */}
      <CocoroCanvas className="fixed inset-0 z-0" />

      {/* HUD (マイク + リアクション + ルーム情報) */}
      <SpaceHUD
        roomId={roomId}
        roomCode={roomCode}
        onLeave={handleLeave}
      />
    </SafetyGuard>
  );
}
