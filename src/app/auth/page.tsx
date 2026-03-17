/**
 * kokoro — 認証ページ
 * Supabase Auth: 匿名(ゲスト) + Magic Link + Google OAuth
 */
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowser();

  // ゲストモード（匿名ログイン）
  const handleGuestLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      router.push('/lobby?guest=true');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '認証エラー');
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  // Magic Link ログイン
  const handleMagicLink = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/lobby` },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '送信エラー');
    } finally {
      setLoading(false);
    }
  }, [supabase, email]);

  // Google OAuth ログイン
  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/lobby` },
      });
      if (error) throw error;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '認証エラー');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return (
    <div className="min-h-dvh bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🫧</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">kokoro</h1>
          <p className="text-gray-400 mt-2 text-sm">アバターで繋がる、緩い空間SNS</p>
        </div>

        {sent ? (
          /* Magic Link送信完了 */
          <div className="bg-gray-900/60 rounded-2xl p-6 border border-gray-800 text-center">
            <div className="text-4xl mb-3">📧</div>
            <h2 className="text-white font-semibold mb-2">メールを確認してください</h2>
            <p className="text-gray-400 text-sm">{email} にログインリンクを送信しました</p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-indigo-400 hover:text-indigo-300"
            >
              別のメールアドレスを使う
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ゲストモード */}
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 
                         text-white font-semibold text-lg transition-all hover:scale-[1.02] 
                         active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {loading ? '接続中...' : '🫧 ゲストで始める'}
            </button>

            <div className="flex items-center gap-3 text-gray-500 text-xs">
              <div className="flex-1 h-px bg-gray-800" />
              <span>またはアカウントで</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-white text-gray-900 font-medium 
                         flex items-center justify-center gap-2 hover:bg-gray-100 
                         transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleで続ける
            </button>

            {/* Magic Link */}
            <div className="bg-gray-900/60 rounded-2xl p-4 border border-gray-800">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full bg-transparent text-white placeholder-gray-500 
                           outline-none text-sm mb-3"
                onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
              />
              <button
                onClick={handleMagicLink}
                disabled={loading || !email.trim()}
                className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-300 text-sm 
                           font-medium hover:bg-gray-700 transition-all 
                           disabled:opacity-40"
              >
                ログインリンクを送信
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <p className="text-gray-600 text-xs text-center mt-4">
              ゲストモードはデータが端末に保存されます。
              <br />
              アカウント作成で複数端末やフレンド機能が使えます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
