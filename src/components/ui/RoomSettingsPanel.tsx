/**
 * cocoro - RoomSettingsPanel
 * Access mode settings (open / permission / key)
 * Slide-in panel from the right
 */

import { useState, useCallback } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { ACCESS_MODE_LABELS } from '@/types/cocoro';
import type { AccessMode } from '@/types/cocoro';

interface RoomSettingsPanelProps {
  roomId: string;
  onClose: () => void;
  onInvite: () => void;
}

const ACCESS_MODES: AccessMode[] = ['open', 'permission', 'key'];

export function RoomSettingsPanel({ roomId, onClose, onInvite }: RoomSettingsPanelProps) {
  const rooms = useRoomStore(s => s.rooms);
  const setAccessMode = useRoomStore(s => s.setAccessMode);
  const room = rooms.find(r => r.id === roomId);

  const [newKeyUser, setNewKeyUser] = useState('');
  const addAllowedUser = useRoomStore(s => s.addAllowedUser);
  const removeAllowedUser = useRoomStore(s => s.removeAllowedUser);

  const handleModeChange = useCallback((mode: AccessMode) => {
    setAccessMode(roomId, mode);
  }, [roomId, setAccessMode]);

  const handleAddKey = useCallback(() => {
    if (!newKeyUser.trim()) return;
    addAllowedUser(roomId, newKeyUser.trim());
    setNewKeyUser('');
  }, [roomId, newKeyUser, addAllowedUser]);

  if (!room) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <h3>{'\u2699\uFE0F \u90E8\u5C4B\u306E\u8A2D\u5B9A'}</h3>

        <div className="settings-section">
          <h4>{'\u{1F6AA} \u5165\u5BA4\u30E2\u30FC\u30C9'}</h4>
          <div className="access-mode-group">
            {ACCESS_MODES.map(mode => (
              <button
                key={mode}
                className={`access-mode-btn ${room.accessMode === mode ? 'active' : ''}`}
                onClick={() => handleModeChange(mode)}
              >
                {ACCESS_MODE_LABELS[mode]}
              </button>
            ))}
          </div>

          {room.accessMode === 'open' && (
            <p className="settings-desc">{'\u8AB0\u3067\u3082\u81EA\u7531\u306B\u5165\u5BA4\u3067\u304D\u307E\u3059'}</p>
          )}
          {room.accessMode === 'permission' && (
            <p className="settings-desc">{'\u5165\u5BA4\u306B\u306F\u3042\u306A\u305F\u306E\u8A31\u53EF\u304C\u5FC5\u8981\u3067\u3059'}</p>
          )}
          {room.accessMode === 'key' && (
            <div className="key-section">
              <p className="settings-desc">{'\u5408\u9375\u3092\u6301\u3063\u3066\u3044\u308B\u53CB\u9054\u3060\u3051\u304C\u5165\u5BA4\u3067\u304D\u307E\u3059'}</p>
              <div className="key-add-row">
                <input
                  type="text"
                  className="key-input"
                  value={newKeyUser}
                  onChange={e => setNewKeyUser(e.target.value)}
                  placeholder={'\u30E6\u30FC\u30B6\u30FCID'}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddKey}>
                  {'\u{1F511} \u5408\u9375\u3092\u6E21\u3059'}
                </button>
              </div>
              {room.allowedUsers.length > 0 && (
                <ul className="key-list">
                  {room.allowedUsers.map(uid => (
                    <li key={uid} className="key-item">
                      <span>{uid.substring(0, 8)}...</span>
                      <button className="key-remove" onClick={() => removeAllowedUser(roomId, uid)}>
                        {'\u2716'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="settings-section">
          <button className="btn btn-primary" onClick={onInvite} style={{ width: '100%' }}>
            {'\u{1F4E8} \u53CB\u9054\u3092\u62DB\u5F85\u3059\u308B'}
          </button>
        </div>

        <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%' }}>
          {'\u2716 \u9589\u3058\u308B'}
        </button>
      </div>
    </div>
  );
}
