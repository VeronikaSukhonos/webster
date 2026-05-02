import axios, { type AxiosResponse } from 'axios';

import { setAuthUser } from '@store/authSlice';
import store from '@store/store';

import type { AuthUser } from '@mytypes/responseTypes';

const API_URL = import.meta.env.VITE_API_URL;
const timeout = 7000;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout,
});

const setErrors = (err: any) => {
  err.message = err.response.data.message.replace('token', 'link');
  if (err.response.data.errors)
    err.errors = (err.response.data.errors as { param: string; error: string }[]).reduce(
      (prev, cur) => {
        prev[cur.param] = cur.error;
        return prev;
      },
      {} as { [param: string]: string },
    );
};

const SNR = 'Server is not responding. Please try again later';
const SWW = 'Something went wrong. Please try again later';

const refresh = () => {
  return axios.post(
    `${API_URL}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
      timeout,
    },
  );
};

let refreshPromise: Promise<AxiosResponse<any, any, {}>> | null = null;

api.interceptors.request.use(
  (config) => {
    const accessToken = store.getState().auth.accessToken;

    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (err) => {
    return Promise.reject(err);
  },
);

api.interceptors.response.use(
  async (res) => {
    return res;
  },
  async (err) => {
    if (err.response) {
      const originalReq = err.config;

      if (
        err.response.status === 401 &&
        originalReq &&
        originalReq.url !== '/auth/login' &&
        originalReq.url !== '/auth/login-google' &&
        originalReq.url !== '/auth/refresh'
      ) {
        if (!refreshPromise) {
          refreshPromise = refresh().then((res) => {
            refreshPromise = null;
            return res;
          });
        }

        return refreshPromise
          .then((res) => {
            const data: { user: AuthUser; accessToken: string } = res.data.data;

            store.dispatch(setAuthUser(data));
            return api.request(originalReq);
          })
          .catch((err) => {
            if (err.response && err.response.status === 401) {
              store.dispatch(setAuthUser(null));
              return Promise.reject({ message: 'Please log in again' });
            } else if (err.response) {
              setErrors(err);
            } else if (err.request) {
              err.message = SNR;
            } else {
              err.message = SWW;
            }
            return Promise.reject(err);
          });
      }
      setErrors(err);
    } else if (err.request) {
      err.message = SNR;
    } else {
      err.message = SWW;
    }
    return Promise.reject(err);
  },
);

export default api;
