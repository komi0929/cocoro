/**
 * cocoro - RegisterScreen (Supabase Auth)
 * Email + password authentication
 */

import { useState, useCallback, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';

interface RegisterScreenProps {
  onComplete: () => void;
  onDemo?: () => void;
}

export function RegisterScreen({ onComplete, onDemo }: RegisterScreenProps) {
  const { isLoggedIn, isLoading, error, clearError, initialize } = useUserStore();
  const register = useUserStore(s => s.register);
  const login = useUserStore(s => s.login);
  const enterDemoMode = useUserStore(s => s.enterDemoMode);

  const [mode, setMode] = useState<'welcome' | 'register' | 'login'>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-advance if already logged in
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      onComplete();
    }
  }, [isLoggedIn, isLoading, onComplete]);

  const handleRegister = useCallback(async () => {
    if (!name.trim()) return;
    if (!email.trim()) return;
    if (password.length < 6) return;
    clearError();
    const ok = await register(name.trim(), email.trim(), password);
    if (ok) onComplete();
  }, [name, email, password, register, onComplete, clearError]);

  const handleLogin = useCallback(async () => {
    if (!email.trim()) return;
    if (!password) return;
    clearError();
    const ok = await login(email.trim(), password);
    if (ok) onComplete();
  }, [email, password, login, onComplete, clearError]);

  const handleDemo = useCallback(() => {
    enterDemoMode();
    if (onDemo) onDemo();
    onComplete();
  }, [enterDemoMode, onDemo, onComplete]);

  if (isLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h1 className="auth-logo">cocoro</h1>
          <div className="auth-loading">
            <div className="auth-spinner" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 12 }}>読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

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

          <button
            className="btn btn-ghost"
            onClick={handleDemo}
            style={{
              width: '100%',
              maxWidth: 280,
              marginTop: 8,
              background: 'linear-gradient(135deg, rgba(80, 40, 120, 0.6), rgba(60, 30, 80, 0.8))',
              border: '2px solid rgba(139, 92, 246, 0.35)',
              color: '#C4A8E0',
            }}
          >
            🎮 デモを試す（登録不要）
          </button>
        </div>
      </div>
    );
  }

  // Register
  if (mode === 'register') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h2>✨ アカウントをつくる</h2>

          <div className="auth-field">
            <label>👤 名前</label>
            <input
              type="text"
              className="auth-text-input"
              value={name}
              onChange={e => { setName(e.target.value); clearError(); }}
              placeholder="なまえを入力"
              maxLength={20}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label>📧 メール</label>
            <input
              type="email"
              className="auth-text-input"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }}
              placeholder="example@mail.com"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>

          <div className="auth-field">
            <label>🔒 パスワード</label>
            <input
              type="password"
              className="auth-text-input"
              value={password}
              onChange={e => { setPassword(e.target.value); clearError(); }}
              placeholder="6文字以上"
              minLength={6}
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button
            className="btn btn-primary"
            onClick={handleRegister}
            disabled={!name.trim() || !email.trim() || password.length < 6}
            style={{ width: '100%', maxWidth: 280 }}
          >
            🚀 登録する
          </button>
          <button className="btn btn-ghost" onClick={() => { setMode('welcome'); clearError(); }} style={{ width: '100%', maxWidth: 280 }}>
            ← 戻る
          </button>
        </div>
      </div>
    );
  }

  // Login
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2>🔑 おかえり</h2>

        <div className="auth-field">
          <label>📧 メール</label>
          <input
            type="email"
            className="auth-text-input"
            value={email}
            onChange={e => { setEmail(e.target.value); clearError(); }}
            placeholder="example@mail.com"
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
          />
        </div>

        <div className="auth-field">
          <label>🔒 パスワード</label>
          <input
            type="password"
            className="auth-text-input"
            value={password}
            onChange={e => { setPassword(e.target.value); clearError(); }}
            placeholder="パスワード"
          />
        </div>

        {error && <p className="auth-error">{error}</p>}

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={!email.trim() || !password}
          style={{ width: '100%', maxWidth: 280 }}
        >
          🔓 ログイン
        </button>
        <button className="btn btn-ghost" onClick={() => { setMode('register'); clearError(); }} style={{ width: '100%', maxWidth: 280 }}>
          ✨ 新規登録
        </button>
        <button className="btn btn-ghost" onClick={() => { setMode('welcome'); clearError(); }} style={{ width: '100%', maxWidth: 280 }}>
          ← 戻る
        </button>
      </div>
    </div>
  );
}
