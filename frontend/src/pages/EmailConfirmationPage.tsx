import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import authApi from '@api/authApi';

import { Feedback } from '@components/Feedback';
import { TextField } from '@components/InputFields';
import { Load } from '@components/Load';
import { MainButton } from '@components/MainButton';

import { useForm } from '@hooks/useForm';
import { useAuth, useFeedback } from '@hooks/utilHooks';

import { type AuthRequestLinkParams, authRequestLinkParams } from '@mytypes/formParams';

const EmailConfirmationPage = () => {
  const { token } = useParams();

  const auth = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useFeedback();
  const hasChecked = useRef(false);

  const request = useForm(authRequestLinkParams, { email: '' }, true);

  useEffect(() => {
    if (hasChecked.current || !token) return;
    hasChecked.current = true;

    authApi
      .confirmEmail(token)
      .then(({ data: res }) => {
        setIsLoading(false);
        setFeedback(res.message, 'ok');
      })
      .catch((err) => {
        setIsLoading(false);
        setFeedback(err.message, 'fail');
      });
  }, []);

  const submit = (params: AuthRequestLinkParams) => {
    authApi
      .requestEmailConfirmation(params)
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
        <h1 className="f-title">Email Confirmation</h1>

        <div className="col box pd-box">
          <div className="col all-center">
            {isLoading ? <Load spinner /> : <Feedback feedback={feedback} showIcon />}
          </div>

          <div className="f-group">
            {feedback.status === 'fail' && feedback.message.includes('link') && (
              <div className="f-note">
                <Link className="link" to="/email-confirmation">
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
        </div>
      </div>
    );
  }

  return (
    <div className="col grow all-center f-container">
      <h1 className="f-title">Email Confirmation Request</h1>

      <form className="col box pd-box" onSubmit={request.handleSubmit(submit)}>
        <div className="f-group">
          <TextField label="Email" {...request.setField('email')} required autoComplete="email" />
        </div>

        <Feedback feedback={request.feedback} />

        <MainButton content="Send Link" type="submit" upperText wide disabled={request.isLoading} />

        <div className="f-note">
          <Link className="link" to="/login">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EmailConfirmationPage;
