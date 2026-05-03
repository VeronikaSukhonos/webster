import { Link, Navigate } from 'react-router-dom';

import authApi from '@api/authApi';

import { Feedback } from '@components/Feedback';
import { PasswordField, TextField } from '@components/InputFields';
import { MainButton } from '@components/MainButton';
import { GoogleLogin } from '@components/users/GoogleLogin';

import { useForm } from '@hooks/useForm';
import { useAuth } from '@hooks/utilHooks';

import { type RegisterParams, registerParams } from '@mytypes/formParams';

const RegistrationPage = () => {
  const auth = useAuth();

  const { setField, handleSubmit, isLoading, setIsLoading, feedback, setSuccess, setFailure } =
    useForm(
      registerParams,
      { username: '', email: '', password: '', passwordConfirmation: '' },
      true,
    );

  const submit = (params: RegisterParams) => {
    authApi
      .register(params)
      .then(({ data: res }) => {
        setSuccess(res);
      })
      .catch((err) => {
        setFailure(err);
      });
  };

  if (auth) return <Navigate to="/" />;

  return (
    <div className="col grow all-center f-container">
      <h1 className="f-title">Registration</h1>

      <form className="col box pd-box" onSubmit={handleSubmit(submit)}>
        <div className="f-group">
          <TextField label="Username" {...setField('username')} required autoComplete="username" />
          <TextField label="Email" {...setField('email')} required autoComplete="email" />
          <PasswordField
            label="Password"
            {...setField('password')}
            required
            autoComplete="new-password"
          />
          <PasswordField
            label="Password Confirmation"
            {...setField('passwordConfirmation')}
            required
          />
        </div>

        <Feedback feedback={feedback} />

        <MainButton content="Register" type="submit" upperText wide disabled={isLoading} />

        <div className="f-note">
          <span>Already creating with us? </span>
          <Link className="link" to="/login">
            Log in!
          </Link>
        </div>
      </form>

      <p className="f-title">or</p>
      <GoogleLogin isLoading={isLoading} setIsLoading={setIsLoading} />
    </div>
  );
};

export default RegistrationPage;
