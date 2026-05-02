import { Link, Navigate, useParams } from 'react-router-dom';

import authApi from '@api/authApi';

import { Feedback } from '@components/Feedback';
import { PasswordField, TextField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';

import { useForm } from '@hooks/useForm';
import { useAuth } from '@hooks/utilHooks';

import {
  type AuthRequestLinkParams,
  type PasswordParams,
  authRequestLinkParams,
  passwordParams,
} from '@mytypes/formParams';

const PasswordResetPage = () => {
  const { token } = useParams();

  const auth = useAuth();

  const reset = useForm(passwordParams, { password: '', passwordConfirmation: '' }, true);
  const request = useForm(authRequestLinkParams, { email: '' }, true);

  const submitReset = (params: PasswordParams) => {
    if (token)
      authApi
        .resetPassword(params, token)
        .then(({ data: res }) => {
          reset.setSuccess(res);
        })
        .catch((err) => {
          reset.setFailure(err);
        });
  };

  const submitRequest = (params: AuthRequestLinkParams) => {
    authApi
      .requestPasswordReset(params)
      .then(({ data: res }) => {
        request.setSuccess(res);
      })
      .catch((err) => {
        request.setFailure(err);
      });
  };

  if (auth) return <Navigate to="/" />;

  if (token) {
    return (
      <div className="col grow all-center f-container">
        <h1 className="f-title">Password Reset</h1>

        <form className="col box pd-box" onSubmit={reset.handleSubmit(submitReset)}>
          <div className="f-group">
            <PasswordField
              label="Password"
              {...reset.setField('password')}
              required
              autoComplete="new-password"
            />
            <PasswordField
              label="Password Confirmation"
              {...reset.setField('passwordConfirmation')}
              required
            />
          </div>

          <Feedback feedback={reset.feedback} />

          <MainButton
            content="Reset Password"
            type="submit"
            upperText
            wide
            disabled={reset.isLoading}
          />

          <div className="f-group">
            {reset.feedback.status === 'fail' && reset.feedback.message.includes('link') && (
              <div className="f-note">
                <Link className="link" to="/password-reset">
                  Request a new link?
                </Link>
              </div>
            )}
            <div className="f-note">
              <Link className="link" to="/login">
                Back to login
              </Link>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="col grow all-center f-container">
      <h1 className="f-title">Password Reset Request</h1>

      <form className="col box pd-box" onSubmit={request.handleSubmit(submitRequest)}>
        <div className="f-group">
          <TextField label="Email" {...request.setField('email')} required autoComplete="email" />
        </div>

        <Feedback feedback={request.feedback} />

        <MainButton content="Send Link" type="submit" upperText wide disabled={request.isLoading} />

        <div className="f-note">
          <Link className="link" to="/login">
            Remembered your password?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PasswordResetPage;
