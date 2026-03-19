/**
 * cocoro - RegisterScreen
 * Name + 4-digit PIN registration/login
 * Browser-locked via localStorage token
 */

import { useState, useCallback } from 'react';
import { useUserStore } from '@/store/useUserStore';

interface RegisterScreenProps {
  onComplete: () => void;
  onDemo?: () => void;
}

export function RegisterScreen({ onComplete, onDemo }: RegisterScreenProps) {
  const { user, register, login } = useUserStore();
  const [mode, setMode] = useState<'welcome' | 'register' | 'login'>(user ? 'login' : 'welcome');
  const [name, setName] = useState(user?.name ?? '');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');

  const pinStr = pin.join('');

  const handlePinChange = useCallback((i: number, val: string) => {
    if (val.length > 1) return;
    const next = [...pin];
    next[i] = val;
    setPin(next);
    if (val && i < 3) {
      const el = document.getElementById(`pin-${i + 1}`);
      el?.focus();
    }
  }, [pin]);

  const handleRegister = useCallback(() => {
    if (!name.trim()) { setError('名前を入力してね'); return; }
    if (pinStr.length < 4) { setError('4桁のPINを入力してね'); return; }
    register(name.trim(), pinStr);
    onComplete();
  }, [name, pinStr, register, onComplete]);

  const handleLogin = useCallback(() => {
    if (!name.trim()) { setError('名前を入力してね'); return; }
    if (pinStr.length < 4) { setError('4桁のPINを入力してね'); return; }
    const ok = login(name.trim(), pinStr);
    if (ok) {
      onComplete();
    } else {
      setError('名前かPINが違うよ');
    }
  }, [name, pinStr, login, onComplete]);

  const PinInputs = () => (
    <div className="pin-input-row">
      {pin.map((d, i) => (
        <input
          key={i}
          id={`pin-${i}`}
          type="number"
          inputMode="numeric"
          maxLength={1}
          className="pin-digit"
          value={d}
          onChange={e => handlePinChange(i, e.target.value)}
        />
      ))}
    </div>
  );

  // Welcome
  if (mode === 'welcome') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-logo">cocoro</h1>
          <p className="auth-subtitle">
            ひみつの隠れ家で<br />
            友達と過ごそう
          </p>

          <button className="btn btn-primary" onClick={() => setMode('register')} style={{ width: '100%', maxWidth: 280 }}>
            ✨ はじめての人
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('login')} style={{ width: '100%', maxWidth: 280 }}>
            🔑 ログイン
          </button>

          {onDemo && (
            <button
              className="btn btn-ghost"
              onClick={onDemo}
              style={{
                width: '100%',
                maxWidth: 280,
                marginTop: 8,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa',
              }}
            >
              🎮 デモを試す（登録不要）
            </button>
          )}
        </div>
      </div>
    );
  }

  // Register
  if (mode === 'register') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h2>{'\u2728 \u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u3064\u304F\u308B'}</h2>

          <div className="auth-field">
            <label>{'\u{1F464} \u540D\u524D'}</label>
            <input
              type="text"
              className="auth-text-input"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder={'\u306A\u307E\u3048\u3092\u5165\u529B'}
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>{'\u{1F512} 4\u6841PIN'}</label>
            <PinInputs />
            <p className="auth-hint">{'\u3053\u306EPIN\u3067\u3053\u306E\u30D6\u30E9\u30A6\u30B6\u304B\u3089\u30ED\u30B0\u30A4\u30F3\u3067\u304D\u307E\u3059'}</p>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary" onClick={handleRegister} style={{ width: '100%', maxWidth: 280 }}>
            {'\u{1F680} \u767B\u9332\u3059\u308B'}
          </button>
          <button className="btn btn-ghost" onClick={() => setMode('welcome')} style={{ width: '100%', maxWidth: 280 }}>
            {'\u2190 \u623B\u308B'}
          </button>
        </div>
      </div>
    );
  }

  // Login
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2>{'\u{1F511} \u304A\u304B\u3048\u308A'}</h2>

        <div className="auth-field">
          <label>{'\u{1F464} \u540D\u524D'}</label>
          <input
            type="text"
            className="auth-text-input"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder={'\u540D\u524D\u3092\u5165\u529B'}
            autoFocus
          />
        </div>

        <div className="auth-field">
          <label>{'\u{1F512} PIN'}</label>
          <PinInputs />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', maxWidth: 280 }}>
          {'\u{1F513} \u30ED\u30B0\u30A4\u30F3'}
        </button>
        <button className="btn btn-ghost" onClick={() => setMode('register')} style={{ width: '100%', maxWidth: 280 }}>
          {'\u2728 \u65B0\u898F\u767B\u9332'}
        </button>
        <button className="btn btn-ghost" onClick={() => setMode('welcome')} style={{ width: '100%', maxWidth: 280 }}>
          {'\u2190 \u623B\u308B'}
        </button>
      </div>
    </div>
  );
}
