import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ToastContainer from '../ui/Toast';
import { LoginModal } from '../auth/LoginModal';
import { RegisterModal } from '../auth/RegisterModal';
import { useUIStore } from '../../store/uiStore';

const FULL_SCREEN_PAGES = ['/map'];
const NO_FOOTER_PAGES   = ['/map', '/missions', '/report', '/track'];

export default function Layout() {
  const { isLoginOpen, isRegisterOpen, closeLogin, closeRegister } = useUIStore();
  const { pathname } = useLocation();
  const isFullScreen = FULL_SCREEN_PAGES.some((p) => pathname.startsWith(p));
  const showFooter   = !NO_FOOTER_PAGES.some((p) => pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={isFullScreen ? 'flex-1 flex flex-col' : 'flex-1'}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
      <ToastContainer />
      <LoginModal    open={isLoginOpen}    onClose={closeLogin} />
      <RegisterModal open={isRegisterOpen} onClose={closeRegister} />
    </div>
  );
}
