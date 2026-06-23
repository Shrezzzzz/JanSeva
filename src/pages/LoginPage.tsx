import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/uiStore';
import { isValidEmail } from '../utils/validators';
import Button from '../components/ui/Button';
import { ROUTES } from '../config/routes';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn, signUp } = useAuth();
  const { addToast } = useUIStore();

  const [mode,     setMode]     = useState<Mode>('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [ward,     setWard]     = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.PROFILE, { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return; }
    if (!password)             { setError('Password is required'); return; }
    if (mode === 'register' && !name.trim()) { setError('Name is required'); return; }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn({ email, password });
      } else {
        await signUp({ name: name.trim(), email, password, ward: ward.trim() || undefined });
      }
      navigate(ROUTES.PROFILE, { replace: true });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (mode === 'login' ? 'Invalid credentials' : 'Registration failed'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-[#0D0D0B]">
            JanSeva<sup className="text-sm">®</sup>
          </h1>
          <p className="text-sm text-[#6F6F6F] mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E5E0] shadow-sm p-8">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[#E5E5E0] mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                  mode === m
                    ? 'bg-[#1A6B3C] text-white'
                    : 'text-[#6F6F6F] hover:bg-[#F7F7F5]'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-[#DC2626] bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Priya Sharma"
                    required
                    className="w-full rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">
                    Ward <span className="text-[#6F6F6F] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g. Ward 5, Kolkata"
                    className="w-full rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0D0D0B] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
              />
            </div>

            <Button type="submit" fullWidth loading={loading}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#6F6F6F] mt-6">
          <button
            type="button"
            onClick={() => navigate(ROUTES.HOME)}
            className="hover:text-[#0D0D0B] underline underline-offset-2"
          >
            Back to home
          </button>
        </p>
      </div>
    </div>
  );
}
