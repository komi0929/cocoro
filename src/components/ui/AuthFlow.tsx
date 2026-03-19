/**
 * cocoro - AuthFlow
 * Role selection + PIN management
 */

import { useState, useCallback } from 'react';

type AuthStep = 'role-select' | 'parent-pin' | 'child-pin';

interface AuthFlowProps {
  onAuthComplete: (role: 'parent' | 'child') => void;
}

export function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [step, setStep] = useState<AuthStep>('role-select');
  const [pin, setPin] = useState(['', '', '', '']);
  const [savedPin, setSavedPin] = useState<string | null>(
    localStorage.getItem('cocoro-parent-pin')
  );

  const handlePinChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
  }, [pin]);

  const handleParentStart = useCallback(() => {
    if (savedPin) {
      setStep('parent-pin');
    } else {
      setStep('parent-pin');
    }
  }, [savedPin]);

  const handleParentPinSubmit = useCallback(() => {
    const code = pin.join('');
    if (code.length < 4) return;

    if (savedPin) {
      if (code === savedPin) {
        onAuthComplete('parent');
      } else {
        alert('PIN\u304C\u9055\u3044\u307E\u3059');
      }
    } else {
      localStorage.setItem('cocoro-parent-pin', code);
      setSavedPin(code);
      onAuthComplete('parent');
    }
  }, [pin, savedPin, onAuthComplete]);

  const handleChildPinSubmit = useCallback(() => {
    const code = pin.join('');
    if (code.length < 4) return;

    if (savedPin && code === savedPin) {
      onAuthComplete('child');
    } else if (!savedPin) {
      onAuthComplete('child');
    } else {
      alert('PIN\u304C\u9055\u3044\u307E\u3059');
    }
  }, [pin, savedPin, onAuthComplete]);

  const PinInput = () => (
    <div className="pin-input-row">
      {pin.map((digit, i) => (
        <input
          key={i}
          type="number"
          inputMode="numeric"
          maxLength={1}
          className="pin-digit"
          value={digit}
          onChange={e => handlePinChange(i, e.target.value)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );

  if (step === 'parent-pin') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h2>{savedPin ? '\u{1F512} PIN\u3092\u5165\u529B' : '\u{1F511} PIN\u3092\u8A2D\u5B9A'}</h2>
          <p className="auth-hint">
            {savedPin
              ? '\u4FDD\u8B77\u8005\u7528PIN\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044'
              : '4\u6841\u306EPIN\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044'}
          </p>
          <PinInput />
          <button className="btn btn-primary" onClick={handleParentPinSubmit} style={{ width: '100%', maxWidth: 280 }}>
            {savedPin ? '\u{1F513} \u89E3\u9664' : '\u2705 \u8A2D\u5B9A\u5B8C\u4E86'}
          </button>
          <button className="btn btn-ghost" onClick={() => setStep('role-select')} style={{ width: '100%', maxWidth: 280 }}>
            {'← 戻る'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'child-pin') {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h2>{'🧁 PINで入る'}</h2>
          <p className="auth-hint">{'保護者が設定したPINを入力してね'}</p>
          <PinInput />
          <button className="btn btn-primary" onClick={handleChildPinSubmit} style={{ width: '100%', maxWidth: 280 }}>
            {'🚀 入る！'}
          </button>
          <button className="btn btn-ghost" onClick={() => setStep('role-select')} style={{ width: '100%', maxWidth: 280 }}>
            {'← 戻る'}
          </button>
        </div>
      </div>
    );
  }

  // Role Select
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-logo">cocoro</h1>
        <p className="auth-subtitle">
          {'ひみつの隠れ家で'}<br />
          {'友達と通話しよう'}
        </p>

        <button className="btn btn-primary" onClick={handleParentStart} style={{ width: '100%', maxWidth: 280 }}>
          {'\u{1F468}\u200D\u{1F469}\u200D\u{1F467} \u4FDD\u8B77\u8005\u3068\u3057\u3066\u306F\u3058\u3081\u308B'}
        </button>
        <button className="btn btn-ghost" onClick={() => setStep('child-pin')} style={{ width: '100%', maxWidth: 280 }}>
          {'\u{1F9C1} PIN\u3067\u5165\u308B\uFF08\u5B50\u3069\u3082\uFF09'}
        </button>
      </div>
    </div>
  );
}
