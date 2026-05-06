import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import authApi from '@api/authApi';

import { setAuthUser } from '@store/authSlice';

import { MainButton } from '@components/MainButton';

import { GoogleIcon } from '@assets/index';

import { useAppDispatch } from '@hooks/utilHooks';

interface GoogleLoginProps {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GoogleLogin = ({ isLoading, setIsLoading }: GoogleLoginProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      authApi
        .loginGoogle(codeResponse)
        .then(({ data: res }) => {
          setIsLoading(false);
          dispatch(setAuthUser(res.data));
          navigate('/');
        })
        .catch((err) => {
          setIsLoading(false);
          toast(err.message);
        });
    },
    flow: 'auth-code',
  });

  return (
    <MainButton
      onClick={() => login()}
      disabled={isLoading}
      color="white"
      wide
      style={{ fontSize: '1.05rem', fontWeight: 700 }}
    >
      Continue with Google <GoogleIcon className="own-color" />
    </MainButton>
  );
};
