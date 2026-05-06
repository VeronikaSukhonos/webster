import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import usersApi from '@api/usersApi';

import { setAuthUser } from '@store/authSlice';

import { Load } from '@components/Load';

import { useAppDispatch } from '@hooks/utilHooks';

const UserAccountDeletionPage = () => {
  const dispatch = useAppDispatch();

  const { token } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const hasDeleted = useRef(false);

  useEffect(() => {
    if (!token || hasDeleted.current) return;
    hasDeleted.current = true;

    usersApi
      .deleteUserProfile(token)
      .then(({ data: res }) => {
        dispatch(setAuthUser(null));
        setIsLoading(false);
        toast(res.message);
      })
      .catch((err) => {
        setIsLoading(false);
        toast(err.message);
      });
  }, []);

  if (!token) return <Navigate to="/" />;
  if (isLoading) return <Load />;
  return <Navigate to="/" />;
};

export default UserAccountDeletionPage;
