import type {
  AuthRequestLinkParams,
  LoginParams,
  PasswordParams,
  RegisterParams,
} from '@mytypes/formParams';

import api from './api';

class AuthApi {
  async register(params: Omit<RegisterParams, 'passwordConfirmation'>) {
    return await api.post(`/auth/register`, params);
  }

  async login(params: LoginParams) {
    return await api.post(`/auth/login`, params);
  }

  async loginGoogle(params: { code: string }) {
    return await api.post(`/auth/login-google`, params);
  }

  async logout() {
    return await api.post(`/auth/logout`);
  }

  async refresh() {
    return await api.post('/auth/refresh');
  }

  async requestEmailConfirmation(params: AuthRequestLinkParams) {
    return await api.post(`/auth/email-confirmation`, params);
  }

  async confirmEmail(token: string) {
    return await api.post(`/auth/email-confirmation/${token}`);
  }

  async requestPasswordReset(params: AuthRequestLinkParams) {
    return await api.post(`/auth/password-reset`, params);
  }

  async resetPassword(params: Omit<PasswordParams, 'passwordConfirmation'>, token: string) {
    return await api.post(`/auth/password-reset/${token}`, params);
  }
}

export default new AuthApi();
