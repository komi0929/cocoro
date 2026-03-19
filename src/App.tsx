/**
 * cocoro - App Phase 6
 * New screen flow:
 *   register -> lobby (avatar) -> create-room (theme) -> room (3D + UI)
 *                                                     -> join (via invite URL)
 * Demo mode preserved
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
import { useUserStore } from './store/useUserStore';
import { useRoomStore } from './store/useRoomStore';
import { startAmbience, stopAmbience } from './engine/voice/AmbientSounds';
import type { RoomTheme } from './types/cocoro';

type AppScreen = 'register' | 'lobby' | 'theme-select' | 'room';

export default function App() {
  const user = useUserStore(s => s.user);
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const createRoom = useRoomStore(s => s.createRoom);
  const joinByInviteCode = useRoomStore(s => s.joinByInviteCode);
  const currentRoom = useRoomStore(s => s.currentRoom);

  const [screen, setScreen] = useState<AppScreen>('register');
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
      // If not logged in, they'll register first then we check again
    }
  }, [isLoggedIn, joinByInviteCode]);

  // Auto-advance if already logged in
  useEffect(() => {
    if (isLoggedIn && screen === 'register') {
      // Check if there's an invite code in URL
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
    if (!user) return;
    createRoom(user.id, user.name, theme);
    setScreen('room');
  }, [user, createRoom]);

  const handleSkipRoom = useCallback(() => {
    // Skip room creation — go to room screen (demo mode or friend's room)
    setScreen('room');
  }, []);

  // Register
  if (screen === 'register' || !isLoggedIn) {
    return <RegisterScreen onComplete={handleRegisterComplete} />;
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

  // Start/stop ambient sounds based on room theme
  useEffect(() => {
    if (screen === 'room' && currentRoom) {
      startAmbience(currentRoom.theme);
    }
    return () => { stopAmbience(); };
  }, [screen, currentRoom]);

  // Room (3D + UI)
  return (
    <>
      <AjitCanvas />
      <CapacityBar />
      <HUD />
      <CallControls />
      <CraftDrawer />
      <FurnitureEditToolbar />

      {/* Fun features */}
      <ReactionBar />
      <TextChat />
      <EmoteBar />

      {/* Room action buttons */}
      <div className="room-action-bar">
        {currentRoom && (
          <>
            <button
              className="room-action-btn"
              onClick={() => setShowInvite(true)}
              title={'\u62DB\u5F85'}
            >
              {'\u{1F4E8}'}
            </button>
            <button
              className="room-action-btn"
              onClick={() => setShowSettings(true)}
              title={'\u8A2D\u5B9A'}
            >
              {'\u2699\uFE0F'}
            </button>
          </>
        )}
      </div>

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
