/**
 * cocoro - App Phase 8
 * Screen flow:
 *   register -> lobby (avatar) -> create-room (theme) -> room (3D + UI)
 *                                                     -> join (via invite URL)
 * Demo mode: welcome -> lobby -> theme-select -> room (no call)
 * 
 * Phase 8: Engine integration, social features, activities
 */

import { useState, useCallback, useEffect } from 'react';
import { AjitCanvas } from './components/three/AjitCanvas';
import { CapacityBar } from './components/ui/CapacityBar';
import { CallControls } from './components/ui/CallControls';
import { CraftDrawer } from './components/ui/CraftDrawer';
import { HUD } from './components/ui/HUD';
import { FurnitureEditToolbar } from './components/ui/FurnitureEditToolbar';
import { LobbyScreen } from './components/ui/LobbyScreen';
import { RegisterScreen } from './components/ui/RegisterScreen';
import { RoomThemeSelector } from './components/ui/RoomThemeSelector';
import { InviteScreen } from './components/ui/InviteScreen';
import { RoomSettingsPanel } from './components/ui/RoomSettingsPanel';
import { ReactionBar } from './components/three/EmojiReactions';
import { TextChat } from './components/ui/TextChat';
import { EmoteBar } from './components/ui/EmoteBar';
import { StatusOverlay } from './components/ui/StatusOverlay';
import { NotificationToast } from './components/ui/NotificationToast';
import { ActivityPanel } from './components/ui/ActivityPanel';
import { SocialPanel } from './components/ui/SocialPanel';
import { SilenceOverlay } from './components/ui/SilenceOverlay';
import { useUserStore } from './store/useUserStore';
import { useRoomStore } from './store/useRoomStore';
import { useAjitStore } from './store/useAjitStore';
import { useEngineStore } from './store/useEngineStore';
import { startAmbience, stopAmbience } from './engine/voice/AmbientSounds';
import type { RoomTheme } from './types/cocoro';
import { VoxelAuditPage } from './components/three/voxel/VoxelAudit';

type AppScreen = 'register' | 'lobby' | 'theme-select' | 'room';

export default function App() {
  // 監査モード: ?audit=voxel でアクセス
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('audit') === 'voxel') {
    return <VoxelAuditPage />;
  }

  const user = useUserStore(s => s.user);
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const isDemo = useUserStore(s => s.isDemo);
  const createRoom = useRoomStore(s => s.createRoom);
  const joinByInviteCode = useRoomStore(s => s.joinByInviteCode);
  const currentRoom = useRoomStore(s => s.currentRoom);
  const initEngine = useEngineStore(s => s.initForUser);
  const recordAction = useEngineStore(s => s.recordAction);
  const playSFX = useEngineStore(s => s.playSFX);
  const startRoomAmbience = useEngineStore(s => s.startRoomAmbience);
  const stopRoomAmbience = useEngineStore(s => s.stopRoomAmbience);
  const startVoiceFFTDemo = useEngineStore(s => s.startVoiceFFTDemo);

  const [screen, setScreen] = useState<AppScreen>('register');
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showSocial, setShowSocial] = useState(false);

  // Initialize engine when user is available
  useEffect(() => {
    if (user?.id) {
      initEngine(user.id);
    }
  }, [user?.id, initEngine]);

  // Check for invite URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    if (inviteCode) {
      if (isLoggedIn) {
        const room = joinByInviteCode(inviteCode);
        if (room) {
          setScreen('room');
        }
      }
    }
  }, [isLoggedIn, joinByInviteCode]);

  // Auto-advance if already logged in
  useEffect(() => {
    if (isLoggedIn && screen === 'register') {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('invite');
      if (inviteCode) {
        const room = joinByInviteCode(inviteCode);
        if (room) {
          setScreen('room');
          return;
        }
      }
      setScreen('lobby');
    }
  }, [isLoggedIn, screen, joinByInviteCode]);

  const handleRegisterComplete = useCallback(() => {
    setScreen('lobby');
  }, []);

  const handleEnterRoom = useCallback(() => {
    setScreen('theme-select');
  }, []);

  const handleThemeSelect = useCallback((theme: RoomTheme) => {
    const u = useUserStore.getState().user;
    if (!u) return;
    createRoom(u.id, u.name, theme);
    setScreen('room');
    recordAction('joinSession');
  }, [createRoom, recordAction]);

  const handleSkipRoom = useCallback(() => {
    setScreen('room');
    recordAction('joinSession');
  }, [recordAction]);

  // Start/stop ambient sounds based on room theme
  useEffect(() => {
    if (screen === 'room' && currentRoom) {
      startAmbience(currentRoom.theme);
      startRoomAmbience();
      startVoiceFFTDemo();
      playSFX('join');
    }
    return () => { stopAmbience(); stopRoomAmbience(); };
  }, [screen, currentRoom, startRoomAmbience, stopRoomAmbience, startVoiceFFTDemo, playSFX]);

  // Register
  if (screen === 'register' || !isLoggedIn) {
    return (
      <RegisterScreen
        onComplete={handleRegisterComplete}
      />
    );
  }

  // Lobby (avatar creation)
  if (screen === 'lobby') {
    return <LobbyScreen onEnterRoom={handleEnterRoom} />;
  }

  // Theme selection
  if (screen === 'theme-select') {
    return (
      <RoomThemeSelector
        onSelect={handleThemeSelect}
        onSkip={handleSkipRoom}
      />
    );
  }

  // Room (3D + UI)
  return (
    <>
      <AjitCanvas />
      <CapacityBar />
      <HUD />

      {/* Status Overlay — Level, Trust Badge */}
      <StatusOverlay />

      {/* Notification Toasts */}
      <NotificationToast />

      {/* 通話コントロール — デモモードでは非表示 */}
      {!isDemo && <CallControls />}

      <CraftDrawer />
      <FurnitureEditToolbar />

      {/* Fun features */}
      <ReactionBar />
      <TextChat />
      <EmoteBar />

      {/* Silence Director — 沈黙演出 */}
      <SilenceOverlay />

      {/* デモモードバナー */}
      {isDemo && (
        <div style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '6px 16px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.9), rgba(168,85,247,0.9))',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
        }}>
          🎮 デモモード
          <span style={{ opacity: 0.7, fontSize: 10 }}>通話以外の全機能をお試しできます</span>
        </div>
      )}

      {/* Room action buttons */}
      <div className="room-action-bar">
        <button
          className="room-action-btn"
          onClick={() => useAjitStore.getState().setDrawerOpen(true)}
          title={'模様替え'}
        >
          {'🔨'}
        </button>
        <button
          className="room-action-btn"
          onClick={() => setShowActivity(true)}
          title={'アクティビティ'}
        >
          {'🎮'}
        </button>
        <button
          className="room-action-btn"
          onClick={() => setShowSocial(true)}
          title={'ソーシャル'}
        >
          {'👥'}
        </button>
        {currentRoom && !isDemo && (
          <>
            <button
              className="room-action-btn"
              onClick={() => setShowInvite(true)}
              title={'招待'}
            >
              {'📨'}
            </button>
            <button
              className="room-action-btn"
              onClick={() => setShowSettings(true)}
              title={'設定'}
            >
              {'⚙️'}
            </button>
          </>
        )}
      </div>

      {/* Activity overlay */}
      {showActivity && <ActivityPanel onClose={() => setShowActivity(false)} />}

      {/* Social overlay */}
      {showSocial && <SocialPanel onClose={() => setShowSocial(false)} />}

      {/* Invite overlay */}
      {showInvite && currentRoom && (
        <InviteScreen roomId={currentRoom.id} onClose={() => setShowInvite(false)} />
      )}

      {/* Settings overlay */}
      {showSettings && currentRoom && (
        <RoomSettingsPanel
          roomId={currentRoom.id}
          onClose={() => setShowSettings(false)}
          onInvite={() => { setShowSettings(false); setShowInvite(true); }}
        />
      )}
    </>
  );
}
