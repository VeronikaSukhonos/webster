import { toast } from 'react-toastify';

import type { AxiosResponse } from 'axios';

import usersApi from '@api/usersApi';

import { updateAuthUser } from '@store/authSlice';
import { setIsAvatarLoading } from '@store/uiSlice';

import { Menu, MenuItem } from '@components/Menu';

import { DeleteIcon, UploadIcon } from '@assets/index';

import { useAppDispatch, useAuth } from '@hooks/utilHooks';

interface AvatarFormProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AvatarForm = ({ setIsOpen }: AvatarFormProps) => {
  const dispatch = useAppDispatch();

  const auth = useAuth();

  const handlePromise = (promise: Promise<AxiosResponse<any, any, {}>>) => {
    promise
      .then(({ data: res }) => {
        dispatch(updateAuthUser({ avatar: res.data.avatar }));
        dispatch(setIsAvatarLoading(false));
        toast(res.message);
      })
      .catch((err) => {
        dispatch(setIsAvatarLoading(false));
        toast(err.message);
      });
  };

  const uploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(false);
    if (e.target.files?.[0]) {
      const fd = new FormData();

      fd.append('avatar', e.target.files?.[0]);
      e.target.value = '';
      dispatch(setIsAvatarLoading(true));
      handlePromise(usersApi.updateUserAvatar(fd));
    }
  };

  const deleteAvatar = () => {
    setIsOpen(false);
    dispatch(setIsAvatarLoading(true));
    handlePromise(usersApi.deleteUserAvatar());
  };

  if (!auth) return;

  return (
    <Menu aria-label="Avatar Menu">
      <MenuItem>
        <label className="m-row all-center" htmlFor="upload">
          <UploadIcon />
          <span>Upload New</span>
        </label>
        <input
          type="file"
          id="upload"
          name="avatar"
          accept="image/png, image/jpeg"
          onChange={uploadAvatar}
          style={{ display: 'none' }}
        />
      </MenuItem>
      {!auth.avatar.includes('default') && (
        <MenuItem className="all-center" onAction={() => deleteAvatar()}>
          <DeleteIcon />
          <span>Delete Current</span>
        </MenuItem>
      )}
      <MenuItem className="all-center" onAction={() => setIsOpen(false)}>
        <span>Cancel</span>
      </MenuItem>
    </Menu>
  );
};
