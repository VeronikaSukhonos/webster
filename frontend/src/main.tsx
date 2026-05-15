import { GoogleOAuthProvider } from '@react-oauth/google';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';

import store from '@store/store';

import { ImagesContextProvider } from '@contexts/ImagesContext';

import { router } from './App';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ImagesContextProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <RouterProvider router={router()} />
        </GoogleOAuthProvider>
      </ImagesContextProvider>
    </Provider>
  </StrictMode>,
);
