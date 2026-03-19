/**
 * cocoro - CallControls (Enhanced)
 * Full voice call UI: join, leave, mute, PTT, participant panel
 */

import { useCallback, useEffect, useRef } from 'react';
import { useCallStore } from '@/store/useCallStore';
import { useRoomStore } from '@/store/useRoomStore';
import { useUserStore } from '@/store/useUserStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallControls() {
  const isInCall = useCallStore(s => s.isInCall);
  const isMuted = useCallStore(s => s.isMuted);
  const isConnecting = useCallStore(s => s.isConnecting);
  const participants = useCallStore(s => s.participants);
  const localIsSpeaking = useCallStore(s => s.localIsSpeaking);
  const localVolume = useCallStore(s => s.localVolume);
  const talkMode = useCallStore(s => s.talkMode);
  const isPTTActive = useCallStore(s => s.isPTTActive);
  const error = useCallStore(s => s.error);
  const callDuration = useCallStore(s => s.callDuration);
  const showPanel = useCallStore(s => s.showParticipantPanel);
  const joinCall = useCallStore(s => s.joinCall);
  const leaveCall = useCallStore(s => s.leaveCall);
  const toggleMute = useCallStore(s => s.toggleMute);
  const setTalkMode = useCallStore(s => s.setTalkMode);
  const setPTTActive = useCallStore(s => s.setPTTActive);
  const setPeerVolume = useCallStore(s => s.setPeerVolume);
  const setShowPanel = useCallStore(s => s.setShowParticipantPanel);
  const setCallDuration = useCallStore(s => s.setCallDuration);

  const currentRoom = useRoomStore(s => s.currentRoom);
  const user = useUserStore(s => s.user);
  const durationRef = useRef<number>(0);

  // Call duration timer
  useEffect(() => {
    if (!isInCall) return;
    const iv = window.setInterval(() => {
      durationRef.current += 1;
      setCallDuration(durationRef.current);
    }, 1000);
    return () => {
      clearInterval(iv);
      durationRef.current = 0;
    };
  }, [isInCall, setCallDuration]);

  // Push-to-talk: Space key
  useEffect(() => {
    if (!isInCall || talkMode !== 'ptt') return;
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setPTTActive(true);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setPTTActive(false);
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [isInCall, talkMode, setPTTActive]);

  const handleJoin = useCallback(() => {
    if (!currentRoom || !user) return;
    joinCall(currentRoom.id, user.name);
  }, [currentRoom, user, joinCall]);

  // No room — hide
  if (!currentRoom) return null;

  // Not in call — show join button
  if (!isInCall && !isConnecting) {
    return (
      <div className="call-controls">
        <button className="call-join-btn" onClick={handleJoin}>
          {'\u{1F3A4} \u901A\u8A71\u306B\u53C2\u52A0'}
        </button>
        {error && <p className="call-error">{error}</p>}
      </div>
    );
  }

  // Connecting
  if (isConnecting) {
    return (
      <div className="call-controls">
        <div className="call-connecting">
          <span className="call-spinner" />
          {'\u63A5\u7D9A\u4E2D...'}
        </div>
      </div>
    );
  }

  // In call
  return (
    <>
      <div className="call-controls call-active">
        {/* Duration */}
        <span className="call-duration">{formatDuration(callDuration)}</span>

        {/* Participant avatars */}
        <div className="call-participants">
          <div
            className={`call-avatar-dot local ${localIsSpeaking ? 'speaking' : ''} ${isMuted ? 'muted' : ''}`}
            style={{ '--speak-level': localVolume } as React.CSSProperties}
          >
            {'\u{1F464}'}
          </div>
          {participants.map(p => (
            <div
              key={p.id}
              className={`call-avatar-dot ${p.isSpeaking ? 'speaking' : ''}`}
              title={p.displayName}
              style={{ '--speak-level': p.volume } as React.CSSProperties}
            >
              {'\u{1F464}'}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="call-actions">
          {/* PTT button (in PTT mode) */}
          {talkMode === 'ptt' && (
            <button
              className={`call-btn call-ptt ${isPTTActive ? 'active' : ''}`}
              onPointerDown={() => setPTTActive(true)}
              onPointerUp={() => setPTTActive(false)}
              onPointerLeave={() => setPTTActive(false)}
              title={'\u9577\u62BC\u3057\u3067\u8A71\u3059 (Space)'}
            >
              {isPTTActive ? '\u{1F4E2}' : '\u{1F3A4}'}
            </button>
          )}

          {/* Mute (open mic mode) */}
          {talkMode === 'open' && (
            <button
              className={`call-btn ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
              title={isMuted ? '\u30DF\u30E5\u30FC\u30C8\u89E3\u9664' : '\u30DF\u30E5\u30FC\u30C8'}
            >
              {isMuted ? '\u{1F507}' : '\u{1F3A4}'}
            </button>
          )}

          {/* Talk mode toggle */}
          <button
            className="call-btn call-mode-toggle"
            onClick={() => setTalkMode(talkMode === 'open' ? 'ptt' : 'open')}
            title={talkMode === 'open' ? 'PTT\u30E2\u30FC\u30C9\u3078' : '\u30AA\u30FC\u30D7\u30F3\u30DE\u30A4\u30AF\u3078'}
          >
            {talkMode === 'open' ? '\u{1F399}\uFE0F' : '\u{1F446}'}
          </button>

          {/* Participants */}
          <button
            className="call-btn"
            onClick={() => setShowPanel(!showPanel)}
            title={'\u53C2\u52A0\u8005'}
          >
            {'\u{1F465}'}
          </button>

          {/* Leave */}
          <button
            className="call-btn call-leave"
            onClick={leaveCall}
            title={'\u901A\u8A71\u3092\u7D42\u4E86'}
          >
            {'\u{1F4F5}'}
          </button>
        </div>

        {/* Count */}
        <span className="call-count">
          {participants.length + 1}{'\u4EBA'}
        </span>
      </div>

      {/* PTT hint */}
      {talkMode === 'ptt' && !isPTTActive && (
        <div className="call-ptt-hint">
          {'\u{1F446} \u30DC\u30BF\u30F3\u9577\u62BC\u3057 or Space\u30AD\u30FC\u3067\u8A71\u3059'}
        </div>
      )}

      {/* Participant panel */}
      {showPanel && (
        <div className="call-panel" onClick={() => setShowPanel(false)}>
          <div className="call-panel-card" onClick={e => e.stopPropagation()}>
            <h3>{'\u{1F465} \u53C2\u52A0\u8005'}</h3>

            {/* Self */}
            <div className="call-panel-row">
              <div className={`call-panel-avatar ${localIsSpeaking ? 'speaking' : ''}`}>
                {'\u{1F464}'}
              </div>
              <span className="call-panel-name">{user?.name ?? 'You'} {'\u{1F4CD}'}</span>
              <div className="call-panel-volume-bar">
                <div
                  className="call-panel-volume-fill"
                  style={{ width: `${localVolume * 100}%` }}
                />
              </div>
            </div>

            {/* Peers */}
            {participants.map(p => (
              <div key={p.id} className="call-panel-row">
                <div className={`call-panel-avatar ${p.isSpeaking ? 'speaking' : ''}`}>
                  {'\u{1F464}'}
                </div>
                <span className="call-panel-name">{p.displayName}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={p.userVolume}
                  onChange={e => setPeerVolume(p.id, parseFloat(e.target.value))}
                  className="call-panel-slider"
                  title={`\u97F3\u91CF: ${Math.round(p.userVolume * 100)}%`}
                />
                <div className="call-panel-volume-bar">
                  <div
                    className="call-panel-volume-fill"
                    style={{ width: `${p.volume * 100}%` }}
                  />
                </div>
              </div>
            ))}

            {participants.length === 0 && (
              <p className="call-panel-empty">{'\u307E\u3060\u8AB0\u3082\u3044\u306A\u3044\u3088\u2026\u53CB\u9054\u3092\u62DB\u5F85\u3057\u3088\u3046\uFF01'}</p>
            )}

            <button className="btn btn-ghost" onClick={() => setShowPanel(false)} style={{ width: '100%' }}>
              {'\u2716 \u9589\u3058\u308B'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
