/**
 * cocoro - PassphraseUI
 * Three-word passphrase entry for room creation/joining
 */

import { useState, useCallback } from 'react';
import { useAjitStore } from '@/store/useAjitStore';

interface PassphraseUIProps {
  onJoinRoom: (passphrase: string[]) => void;
}

export function PassphraseUI({ onJoinRoom }: PassphraseUIProps) {
  const generatePassphrase = useAjitStore(s => s.generatePassphrase);
  const setPassphrase = useAjitStore(s => s.setPassphrase);
  const setIsHost = useAjitStore(s => s.setIsHost);

  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [words, setWords] = useState<string[]>([]);
  const [joinWords, setJoinWords] = useState(['', '', '']);

  const handleCreate = useCallback(() => {
    const pw = generatePassphrase();
    setWords(pw);
    setMode('create');
  }, [generatePassphrase]);

  const handleConfirmCreate = useCallback(() => {
    setPassphrase(words);
    setIsHost(true);
    onJoinRoom(words);
  }, [words, setPassphrase, setIsHost, onJoinRoom]);

  const handleJoin = useCallback(() => {
    setPassphrase(joinWords);
    setIsHost(false);
    onJoinRoom(joinWords);
  }, [joinWords, setPassphrase, setIsHost, onJoinRoom]);

  if (mode === 'create') {
    return (
      <div className="passphrase-screen">
        <div className="passphrase-card">
          <h2>{'\u{1F510} あなたの隠れ家'}</h2>
          <p className="passphrase-hint">{'\u3053\u306E\u5408\u8A00\u8449\u3067\u53CB\u9054\u3092\u62DB\u5F85\u3067\u304D\u307E\u3059'}</p>
          <div className="passphrase-words">
            {words.map((w, i) => (
              <span key={i} className="passphrase-word">{w}</span>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleConfirmCreate} style={{ width: '100%', maxWidth: 280 }}>
            {'\u{1F3E0} 隠れ家をつくる'}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('select')} style={{ width: '100%', maxWidth: 280 }}>
            {'\u2190 \u623B\u308B'}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="passphrase-screen">
        <div className="passphrase-card">
          <h2>{'\u{1F511} \u5408\u8A00\u8449\u3092\u5165\u529B'}</h2>
          <p className="passphrase-hint">{'\u53CB\u9054\u304B\u3089\u3082\u3089\u3063\u305F3\u3064\u306E\u30B3\u30C8\u30D0'}</p>
          <div className="passphrase-input-row">
            {joinWords.map((w, i) => (
              <input
                key={i}
                type="text"
                className="passphrase-input"
                value={w}
                placeholder={`${i + 1}`}
                onChange={e => {
                  const next = [...joinWords];
                  next[i] = e.target.value;
                  setJoinWords(next);
                }}
              />
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleJoin} style={{ width: '100%', maxWidth: 280 }}>
            {'\u{1F680} \u5165\u5BA4\u3059\u308B'}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('select')} style={{ width: '100%', maxWidth: 280 }}>
            {'\u2190 \u623B\u308B'}
          </button>
        </div>
      </div>
    );
  }

  // Select mode
  return (
    <div className="passphrase-screen">
      <div className="passphrase-card">
        <h2>{'\u{1F3E0} 隠れ家'}</h2>
        <p className="passphrase-hint">{'隠れ家をつくるか、友達の隠れ家に入る'}</p>
        <button className="btn btn-primary" onClick={handleCreate} style={{ width: '100%', maxWidth: 280 }}>
          {'\u{1F3D7}\uFE0F 新しい隠れ家をつくる'}
        </button>
        <button className="btn btn-ghost" onClick={() => setMode('join')} style={{ width: '100%', maxWidth: 280 }}>
          {'\u{1F511} \u5408\u8A00\u8449\u3067\u5165\u308B'}
        </button>
      </div>
    </div>
  );
}
