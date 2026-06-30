import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Role } from '../../types/user.types';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import Spinner from '../ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  role?: Role | Role[];
  redirectTo?: string;
}

export default function AuthGuard({ children, role, redirectTo = '/citizen' }: AuthGuardProps) {
  const { user }         = useAuthStore();
  const { openLogin }    = useUIStore();
  const navigate         = useNavigate();

  const isAuthenticated  = !!user;
  const hasRole = role
    ? (Array.isArray(role) ? role : [role]).includes(user?.role ?? 'Citizen')
    : true;

  useEffect(() => {
    if (!isAuthenticated) {
      openLogin();
      navigate(redirectTo, { replace: true });
    } else if (!hasRole) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, hasRole, navigate, openLogin, redirectTo]);

  if (!isAuthenticated || !hasRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} className="text-[#1A6B3C]" />
      </div>
    );
  }

  return <>{children}</>;
}
