import { Link, Navigate, useNavigate } from 'react-router-dom';

import authApi from '@api/authApi';

import { setAuthUser } from '@store/authSlice';

import { Feedback } from '@components/Feedback';
import { PasswordField, TextField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { GoogleLogin } from '@components/users/GoogleLogin';

import { useForm } from '@hooks/useForm';
import { useAppDispatch, useAuth } from '@hooks/utilHooks';

import { type LoginParams, loginParams } from '@mytypes/formParams';

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const auth = useAuth();

  const { setField, handleSubmit, isLoading, setIsLoading, feedback, setSuccess, setFailure } =
    useForm(loginParams, { username: '', password: '' }, true);

  const submit = (params: LoginParams) => {
    authApi
      .login(params)
      .then(({ data: res }) => {
        dispatch(setAuthUser(res.data));
        setSuccess(res);
        navigate('/');
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  if (auth) return <Navigate to="/" />;

  return (
    <div className="col grow all-center f-container">
      <h1 className="f-title">Login</h1>

      <form className="col box pd-box" onSubmit={handleSubmit(submit)}>
        <div className="f-group">
          <TextField
            label="Username or Email"
            {...setField('username')}
            required
            autoComplete="username"
          />
          <PasswordField
            label="Password"
            {...setField('password')}
            required
            autoComplete="current-password"
          />
        </div>

        {feedback.message && (
          <div className="f-group">
            <Feedback feedback={feedback} />
            {feedback.message.includes('not confirmed') && (
              <div className="f-note">
                <Link className="link" to="/email-confirmation">
                  Resend confirmation email?
                </Link>
              </div>
            )}
          </div>
        )}

        <MainButton content="Log in" type="submit" upperText wide disabled={isLoading} />

        <div className="f-group">
          <div className="f-note">
            <Link className="link" to="/password-reset">
              Forgot your password?
            </Link>
          </div>
          <div className="f-note">
            <span>New here? </span>
            <Link className="link" to="/register">
              Start your creative journey!
            </Link>
          </div>
        </div>
      </form>

      <p className="f-title">or</p>
      <GoogleLogin isLoading={isLoading} setIsLoading={setIsLoading} />
    </div>
  );
};

export default LoginPage;
