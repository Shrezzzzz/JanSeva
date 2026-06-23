import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import Spinner from './components/ui/Spinner';
import { ROUTES } from './config/routes';

// Lazy-load pages for code splitting
const LandingPage      = lazy(() => import('./pages/LandingPage'));
const ReportPage       = lazy(() => import('./pages/ReportPage'));
const MapPage          = lazy(() => import('./pages/MapPage'));
const TrackPage        = lazy(() => import('./pages/TrackPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const GamificationPage = lazy(() => import('./pages/GamificationPage'));
const AdminPage        = lazy(() => import('./pages/AdminPage'));
const ProfilePage      = lazy(() => import('./pages/ProfilePage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const EditReportPage   = lazy(() => import('./pages/EditReportPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size={32} className="text-[#1A6B3C]" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path={ROUTES.HOME}         element={<LandingPage />}      />
            <Route path={ROUTES.REPORT}       element={<ReportPage />}       />
            <Route path={ROUTES.MAP}          element={<MapPage />}          />
            <Route path={ROUTES.TRACK}        element={<TrackPage />}        />
            <Route path={ROUTES.TRACK_ISSUE}  element={<TrackPage />}        />
            <Route path={ROUTES.DASHBOARD}    element={<DashboardPage />}    />
            <Route path={ROUTES.GAMIFICATION} element={<GamificationPage />} />
            <Route path={ROUTES.ADMIN}        element={<AdminPage />}        />
            <Route path={ROUTES.PROFILE}      element={<ProfilePage />}      />
            <Route path={ROUTES.PROFILE_USER} element={<ProfilePage />}      />
            <Route path="/login"              element={<LoginPage />}        />
            <Route path={ROUTES.REPORT_EDIT}  element={<EditReportPage />}  />
            {/* 404 fallback */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="font-display text-6xl text-[#0D0D0B]">404</h1>
                <p className="text-[#6F6F6F]">Page not found.</p>
                <a href="/" className="text-[#1A6B3C] underline">Go home</a>
              </div>
            } />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
