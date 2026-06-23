import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { isValidEmail } from '../../utils/validators';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn }        = useAuth();
  const { openRegister }  = useUIStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) { setError('Enter a valid email address'); return; }
    if (!password)             { setError('Password is required'); return; }
    setError(''); setLoading(true);
    try {
      await signIn({ email, password });
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Sign in to JanSeva" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-[#DC2626] bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
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
            className="w-full rounded-xl border border-[#E5E5E0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6B3C] focus:border-transparent"
          />
        </div>
        <Button type="submit" fullWidth loading={loading}>Sign In</Button>
        <p className="text-center text-sm text-[#6F6F6F]">
          New to JanSeva?{' '}
          <button type="button" onClick={() => { onClose(); openRegister(); }} className="text-[#1A6B3C] font-medium hover:underline">
            Create an account
          </button>
        </p>
      </form>
    </Modal>
  );
}
