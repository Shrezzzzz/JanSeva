import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { isValidEmail } from '../../utils/validators';

interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
}

interface PasswordRule {
  label: string;
  met: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', met: (pw) => pw.length >= 8 },
  { label: '1 uppercase letter',    met: (pw) => /[A-Z]/.test(pw) },
  { label: '1 number',              met: (pw) => /[0-9]/.test(pw) },
];

export function RegisterModal({ open, onClose }: RegisterModalProps) {
  const { signUp }    = useAuth();
  const { openLogin } = useUIStore();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [ward,     setWard]     = useState('');

  // Per-field errors
  const [nameError,     setNameError]     = useState('');
  const [emailError,    setEmailError]    = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Top-level API error
  const [apiError,  setApiError]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [wardError, setWardError] = useState('');

  const passwordRulesMet = PASSWORD_RULES.every((r) => r.met(password));

  // ── Ward auto-detect via Nominatim ───────────────────────────────────────
  async function detectWard() {
    if (!navigator.geolocation) {
      setWardError('Geolocation not supported by your browser.');
      return;
    }
    setDetecting(true);
    setWardError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } },
          );
          const data = await res.json();
          const detected =
            data.address?.quarter        ||
            data.address?.suburb         ||
            data.address?.neighbourhood  ||
            data.address?.city_district  ||
            data.address?.county         ||
            '';
          if (detected) {
            setWard(detected);
          } else {
            setWardError('Could not detect ward — please enter manually.');
          }
        } catch {
          setWardError('Detection failed — please enter your ward manually.');
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setWardError('Location access denied — please enter your ward manually.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  // ── Inline validators ────────────────────────────────────────────────────
  function validateName(v: string) {
    const err = v.trim() ? '' : 'Name is required';
    setNameError(err);
    return !err;
  }

  function validateEmail(v: string) {
    const err = isValidEmail(v) ? '' : 'Enter a valid email address';
    setEmailError(err);
    return !err;
  }

  function validatePassword(v: string) {
    const failed = PASSWORD_RULES.find((r) => !r.met(v));
    const err = failed ? failed.label + ' required' : '';
    setPasswordError(err);
    return !err;
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');

    // Run all validators so all fields show errors simultaneously
    const nameOk     = validateName(name);
    const emailOk    = validateEmail(email);
    const passwordOk = validatePassword(password);
    if (!nameOk || !emailOk || !passwordOk) return;

    setLoading(true);
    try {
      await signUp({ name: name.trim(), email, password, ward: ward.trim() || undefined });
      onClose();
    } catch (err: unknown) {
      // Surface the exact error string from the backend response
      const apiMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ??
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.message ??
        (err as { message?: string })?.message ??
        'Registration failed. Please try again.';
      setApiError(apiMsg);
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal open={open} onClose={onClose} title="Join JanSeva" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* API-level error banner */}
        {apiError && (
          <p className="text-sm text-[#DC2626] bg-red-50 px-3 py-2 rounded-xl">{apiError}</p>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (nameError) validateName(e.target.value); }}
            onBlur={(e) => validateName(e.target.value)}
            placeholder="Rohan Singh"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
              nameError
                ? 'border-[#DC2626] focus:ring-[#DC2626]'
                : 'border-[#E5E5E0] focus:ring-[#1A6B3C]'
            }`}
          />
          {nameError && <p className="text-xs text-[#DC2626] mt-1">{nameError}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailError) validateEmail(e.target.value); }}
            onBlur={(e) => validateEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
              emailError
                ? 'border-[#DC2626] focus:ring-[#DC2626]'
                : 'border-[#E5E5E0] focus:ring-[#1A6B3C]'
            }`}
          />
          {emailError && <p className="text-xs text-[#DC2626] mt-1">{emailError}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (passwordError) validatePassword(e.target.value); }}
            onBlur={(e) => validatePassword(e.target.value)}
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
              passwordError
                ? 'border-[#DC2626] focus:ring-[#DC2626]'
                : 'border-[#E5E5E0] focus:ring-[#1A6B3C]'
            }`}
          />
          {/* Live password rule checklist — shown while typing */}
          {password.length > 0 && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map((r) => {
                const met = r.met(password);
                return (
                  <li key={r.label} className={`flex items-center gap-1.5 text-xs ${met ? 'text-[#1A6B3C]' : 'text-[#6F6F6F]'}`}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full flex-shrink-0 text-center leading-none text-[10px] font-bold ${
                      met ? 'bg-[#1A6B3C] text-white' : 'bg-[#E5E5E0] text-[#6F6F6F]'
                    }`}>
                      {met ? '✓' : '·'}
                    </span>
                    {r.label}
                  </li>
                );
              })}
            </ul>
          )}
          {passwordError && !password.length && (
            <p className="text-xs text-[#DC2626] mt-1">{passwordError}</p>
          )}
        </div>

        {/* Ward (optional) */}
        <div>
          <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">
            Ward <span className="text-[#6F6F6F] font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              placeholder="e.g. Ward 7, Kolkata North"
              className="flex-1 rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
            />
            <button
              type="button"
              onClick={detectWard}
              disabled={detecting}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E5E0] text-sm text-[#6F6F6F] hover:border-[#1A6B3C] hover:text-[#1A6B3C] disabled:opacity-50 transition-colors"
              title="Detect my ward automatically"
            >
              {detecting ? '⏳' : '📍'} Detect
            </button>
          </div>
          {wardError && <p className="text-xs text-amber-600 mt-1">{wardError}</p>}
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Create Account
        </Button>

        <p className="text-center text-sm text-[#6F6F6F]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => { onClose(); openLogin(); }}
            className="text-[#1A6B3C] font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </form>
    </Modal>
  );
}
