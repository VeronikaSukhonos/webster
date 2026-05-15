import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { RouterProvider } from 'react-aria-components';
import {
  Outlet,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
  useRouteError,
} from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';

import authApi from '@api/authApi';

import { setAuthUser } from '@store/authSlice';
import { clearEditor } from '@store/editorSlice';

import ErrorPage from '@pages/ErrorPage';

import { Footer } from '@components/Footer';
import { ErrorHeader, Header } from '@components/Header';
import { Load } from '@components/Load';
import { ModalWrapper } from '@components/Modal';

import { useImages } from '@hooks/useImages';
import { useAppDispatch, useFeedback } from '@hooks/utilHooks';

import { ERROR_TYPES } from '@utils/constants';

const HomePage = lazy(() => import('./pages/HomePage'));
const EditorPage = lazy(() => import('./pages/EditorPage'));

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const EmailConfirmationPage = lazy(() => import('./pages/EmailConfirmationPage'));
const PasswordResetPage = lazy(() => import('./pages/PasswordResetPage'));

const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const UserSettingsPage = lazy(() => import('./pages/UserSettingsPage'));
const UserAccountDeletionPage = lazy(() => import('./pages/UserAccountDeletionPage'));

const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));

interface AppLayoutProps {
  fullScreen?: boolean;
}

const AppLayout = ({ fullScreen = false }: AppLayoutProps) => {
  return fullScreen ? (
    <Outlet />
  ) : (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

interface ErrorLayoutProps {
  reason?: string;
}

const ErrorLayout = ({ reason }: ErrorLayoutProps) => {
  const error = useRouteError();

  if (!navigator.onLine && (reason || (error as any)?.message?.includes('fetch')))
    reason = ERROR_TYPES.OFL;

  return (
    <>
      <ErrorHeader />
      <main>
        <ErrorPage reason={reason || ERROR_TYPES.SWW} />
      </main>
      <Footer />
    </>
  );
};

const App = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const hasRefreshed = useRef(false);
  const prevPath = useRef(location.pathname);

  const imagesCtx = useImages();

  useEffect(() => {
    if (hasRefreshed.current) return;
    hasRefreshed.current = true;

    authApi
      .refresh()
      .then(({ data: res }) => {
        dispatch(setAuthUser(res.data));
        setIsLoading(false);
        setFeedback(res.message, 'ok');
      })
      .catch((err) => {
        dispatch(setAuthUser(null));
        setIsLoading(false);
        setFeedback(err.message, 'fail');
      });
  }, []);

  useEffect(() => {
    if (prevPath.current === '/editor' && location.pathname !== '/editor') {
      dispatch(clearEditor());
      imagesCtx.clearFiles();
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);

  if (isLoading) return <Load />;
  if (feedback.status === 'fail' && !feedback.message.toLowerCase().includes('log in'))
    return <ErrorLayout reason={feedback.message} />;

  return (
    <RouterProvider navigate={navigate}>
      <Suspense fallback={<Load />}>
        <Outlet />
      </Suspense>
    </RouterProvider>
  );
};

export const router = () =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route
        element={
          <>
            <App />
            <ModalWrapper />
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              closeOnClick={true}
              hideProgressBar={true}
              pauseOnFocusLoss={false}
              pauseOnHover={false}
              draggable={false}
              limit={1}
              transition={Slide}
            />
          </>
        }
        errorElement={<ErrorLayout />}
      >
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
          <Route path="/email-confirmation/:token" element={<EmailConfirmationPage />} />
          <Route path="/password-reset" element={<PasswordResetPage />} />
          <Route path="/password-reset/:token" element={<PasswordResetPage />} />

          <Route path="/users/:userId" element={<UserProfilePage />} />
          <Route path="/settings" element={<UserSettingsPage />} />
          <Route path="/account-deletion" element={<UserAccountDeletionPage />} />
          <Route path="/account-deletion/:token" element={<UserAccountDeletionPage />} />

          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />

          <Route path="*" element={<ErrorPage />} />
        </Route>
        <Route element={<AppLayout fullScreen />}>
          <Route path="/editor" element={<EditorPage />} />
        </Route>
      </Route>,
    ),
  );
