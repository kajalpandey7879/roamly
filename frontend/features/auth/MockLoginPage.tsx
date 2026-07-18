'use client';

import { KeyRound, LockKeyhole, Mail, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from '@/features/auth/AuthProvider';
import { authApi } from '@/features/auth/api';
import Logo from '@/shared/ui/Logo';

export default function MockLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithEmail } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [deliveryHint, setDeliveryHint] = useState('');
  const returnTo = useMemo(() => {
    const requestedPath = searchParams.get('return_to') ?? '/';
    return requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';
  }, [searchParams]);

  async function logIn(method: 'google' | 'demo') {
    setIsSubmitting(true);
    try {
      const user = await login();
      const methodLabel = method === 'google' ? 'Google sign-in' : 'Demo login';
      toast.success(`${methodLabel} complete. Welcome, ${user.name.split(' ')[0]}`);
      router.replace(returnTo);
    } catch (error) {
      toast.error((error as Error).message);
      setIsSubmitting(false);
    }
  }

  async function requestCode() {
    setIsSubmitting(true);
    try {
      const challenge = await authApi.requestEmailCode(email.trim());
      setChallengeId(challenge.challenge_id);
      setDeliveryHint(challenge.delivery_hint);
      setCode('');
      toast.success('Verification code sent');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!challengeId) return;
    setIsSubmitting(true);
    try {
      const user = await loginWithEmail(email.trim(), challengeId, code);
      toast.success(`Email verified. Welcome, ${user.name.split(' ')[0]}`);
      router.replace(returnTo);
    } catch (error) {
      toast.error((error as Error).message);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mock-login-page">
      <section aria-labelledby="mock-login-heading">
        <button className="mock-login-back" onClick={() => router.back()} aria-label="Close login">
          <X size={21} />
        </button>
        <div className="login-dialog-logo"><Logo /></div>
        <p>ROAMLY ACCOUNT</p>
        <h1 id="mock-login-heading">Log in or sign up</h1>
        <span>Email sign-in uses a secure one-time code. Google and the demo account remain mocked.</span>
        {challengeId ? (
          <form
            className="mock-email-login verification-code-form"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyCode();
            }}
          >
            <label htmlFor="login-code">Enter the 6-digit code sent to {deliveryHint}</label>
            <div>
              <KeyRound size={19} />
              <input
                id="login-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <button className="mock-login-submit" disabled={isSubmitting || code.length !== 6}>
              {isSubmitting ? 'Verifying...' : 'Verify and continue'}
            </button>
            <div className="verification-actions">
              <button type="button" onClick={() => setChallengeId('')}>Change email</button>
              <button type="button" onClick={() => void requestCode()} disabled={isSubmitting}>Resend code</button>
            </div>
          </form>
        ) : (
          <form
            className="mock-email-login"
            onSubmit={(event) => {
              event.preventDefault();
              void requestCode();
            }}
          >
            <label htmlFor="login-email">Email address</label>
            <div>
              <Mail size={19} />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <button className="mock-login-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending code...' : 'Continue with email'}
            </button>
          </form>
        )}
        {!challengeId && (
          <>
            <div className="login-divider"><span>or</span></div>
            <button className="social-login-button" onClick={() => void logIn('google')} disabled={isSubmitting}>
              <b aria-hidden="true">G</b>
              Continue with Google
            </button>
            <button className="demo-login-button" onClick={() => void logIn('demo')} disabled={isSubmitting}>
              <img src="https://i.pravatar.cc/80?img=12" alt="" />
              <span>
                <b>Continue as Alex Morgan</b>
                <small>Use the default demo guest account</small>
              </span>
            </button>
          </>
        )}
        <small>
          <LockKeyhole size={15} /> Your booking details will be waiting when you return.
        </small>
      </section>
    </main>
  );
}
