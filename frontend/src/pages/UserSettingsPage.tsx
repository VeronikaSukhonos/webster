import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { clsx } from 'clsx';

import usersApi from '@api/usersApi';

import { updateAuthUser } from '@store/authSlice';
import { selectUi, setModal } from '@store/uiSlice';

import ErrorPage from '@pages/ErrorPage';

import Accordion from '@components/Accordion';
import { Feedback } from '@components/Feedback';
import { PasswordField, TextField } from '@components/InputFields';
import { Load } from '@components/Load';
import { MainButton } from '@components/MainButton';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@components/Tabs';

import { useForm } from '@hooks/useForm';
import { useAppDispatch, useAppSelector, useAuth, useFeedback } from '@hooks/utilHooks';

import {
  type UpdatePasswordParams,
  type UpdateProfileParams,
  updatePasswordParams,
  updateProfileParams,
} from '@mytypes/formParams';

import './UserPage.css';

const UserSettingsPage = () => {
  const dispatch = useAppDispatch();

  const auth = useAuth();
  const isAvatarLoading = useAppSelector(selectUi.isAvatarLoading);

  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userFeedback, setUserFeedback] = useFeedback();

  const updateProfile = useForm(updateProfileParams, { username: '', about: '' });
  const updatePassword = useForm(
    updatePasswordParams,
    {
      ...(auth && !auth.googleId && { currentPassword: '' }),
      password: '',
      passwordConfirmation: '',
    },
    true,
  );

  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const [deleteAccountFeedback, setDeleteAccountFeedback] = useFeedback();

  useEffect(() => {
    if (!auth) return;

    usersApi
      .getUserProfile(auth.id)
      .then(({ data: res }) => {
        setIsUserLoading(false);
        setUserFeedback(res.message, 'ok');
        updateProfile.setParams(res.data.user);
        dispatch(updateAuthUser(res.data.user));
      })
      .catch((err) => {
        setIsUserLoading(false);
        setUserFeedback(err.message, 'fail');
      });
  }, []);

  const submitUpdateProfile = (params: UpdateProfileParams) => {
    usersApi
      .updateUserProfile(params)
      .then(({ data: res }) => {
        updateProfile.setSuccess(res);
        updateProfile.setParams(res.data.user);
        dispatch(updateAuthUser(res.data.user));
      })
      .catch((err) => {
        updateProfile.setFailure(err);
      });
  };

  const submitUpdatePassword = (params: UpdatePasswordParams) => {
    usersApi
      .updateUserPassword(params)
      .then(({ data: res }) => {
        updatePassword.setSuccess(res);
        dispatch(updateAuthUser({ hasPassword: true }));
      })
      .catch((err) => {
        updatePassword.setFailure(err);
      });
  };

  const submitDeleteAccount = () => {
    setIsDeleteAccountLoading(true);
    usersApi
      .requestUserProfileDeletion()
      .then(({ data: res }) => {
        setIsDeleteAccountLoading(false);
        setDeleteAccountFeedback(res.message, 'ok');
      })
      .catch((err) => {
        setIsDeleteAccountLoading(false);
        setDeleteAccountFeedback(err.message, 'fail');
      });
  };

  if (!auth) return <Navigate to="/login" />;
  if (isUserLoading) return <Load spinner />;
  if (userFeedback.status === 'fail')
    return <ErrorPage reason={userFeedback.message} entity="user" />;

  return (
    <div className="col grow all-center f-container">
      <h1 className="f-title">Settings</h1>

      <div className="col box pd-box">
        <div
          className="box t-center"
          style={{
            alignSelf: 'center',
            color: 'var(--dark-blue)',
            fontWeight: 'bold',
            padding: '2px 10px',
            width: 'max-content',
          }}
        >
          {auth.email}
        </div>
        <Tabs
          onSelectionChange={() => {
            updateProfile.clearForm(auth);
            updatePassword.clearForm();
            setDeleteAccountFeedback();
          }}
        >
          <TabList>
            <Tab id="profile-tab">Profile</Tab>
            <Tab id="account-tab">Account</Tab>
          </TabList>
          <TabPanels>
            <TabPanel id="profile-tab">
              <form className="col" onSubmit={updateProfile.handleSubmit(submitUpdateProfile)}>
                <div className="row all-center">
                  <div className="col profile-avatar-container">
                    <img
                      className={clsx('profile-avatar self', isAvatarLoading && 'img-load')}
                      onClick={() => {
                        if (!isAvatarLoading) dispatch(setModal({ type: 'updateAvatar' }));
                      }}
                      src={auth.avatar}
                      alt="My avatar"
                    />
                  </div>
                  <MainButton
                    onClick={() => dispatch(setModal({ type: 'updateAvatar' }))}
                    disabled={isAvatarLoading}
                    upperText
                  >
                    Update
                  </MainButton>
                </div>

                <div className="f-group">
                  <TextField
                    label="Username"
                    {...updateProfile.setField('username')}
                    required
                    autoComplete="username"
                  />
                  <TextField label="About" {...updateProfile.setField('about')} area />
                </div>

                <Feedback feedback={updateProfile.feedback} />

                <MainButton type="submit" disabled={updateProfile.isLoading} upperText wide>
                  Save
                </MainButton>
              </form>
            </TabPanel>
            <TabPanel id="account-tab">
              <Accordion
                items={[
                  {
                    title: <h2 className="f-title mini">Password Update</h2>,
                    content: (
                      <form
                        className="col"
                        onSubmit={updatePassword.handleSubmit(submitUpdatePassword)}
                      >
                        {!auth.hasPassword && (
                          <div className="f-note faded">No password is set for your account</div>
                        )}
                        <div className="f-group">
                          {!auth.googleId && (
                            <PasswordField
                              label="Current Password"
                              {...updatePassword.setField('currentPassword')}
                              required
                              autoComplete="current-password"
                            />
                          )}
                          <PasswordField
                            label="New Password"
                            {...updatePassword.setField('password')}
                            required
                            autoComplete="new-password"
                          />
                          <PasswordField
                            label="Password Confirmation"
                            {...updatePassword.setField('passwordConfirmation')}
                            required
                            autoComplete="new-password"
                          />
                        </div>

                        <Feedback feedback={updatePassword.feedback} />

                        <MainButton
                          type="submit"
                          disabled={updatePassword.isLoading}
                          upperText
                          wide
                        >
                          Update Password
                        </MainButton>
                      </form>
                    ),
                  },
                  {
                    title: <h2 className="f-title mini">Account Deletion</h2>,
                    content: (
                      <div className="col">
                        <p className="warning">
                          We are sad to see you go. If you are sure about deleting your account, all
                          data associated with it will be deleted permanently. You cannot undo this
                          action.
                        </p>

                        <Feedback feedback={deleteAccountFeedback} />

                        <MainButton
                          onClick={submitDeleteAccount}
                          disabled={isDeleteAccountLoading}
                          color="white"
                          upperText
                          wide
                        >
                          Delete Account
                        </MainButton>
                      </div>
                    ),
                  },
                ]}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  );
};

export default UserSettingsPage;
