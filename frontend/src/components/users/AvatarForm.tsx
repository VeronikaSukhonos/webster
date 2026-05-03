import { toast } from 'react-toastify';

import usersApi from '@api/usersApi';

import { updateAuthUser } from '@store/authSlice';
import { setIsAvatarLoading } from '@store/uiSlice';

import { DeleteIcon, UploadIcon } from '@assets/index';

import { useAppDispatch, useAuth } from '@hooks/utilHooks';

interface AvatarFormProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AvatarForm = ({ setIsOpen }: AvatarFormProps) => {
  const dispatch = useAppDispatch();

  const auth = useAuth();

  const uploadPicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(false);
    if (e.target.files?.[0]) {
      const fd = new FormData();

      fd.append('avatar', e.target.files?.[0]);
      e.target.value = '';
      dispatch(setIsAvatarLoading(true));
      usersApi
        .updateUserAvatar(fd)
        .then(({ data: res }) => {
          dispatch(updateAuthUser({ avatar: res.data.avatar }));
          dispatch(setIsAvatarLoading(false));
          toast(res.message);
        })
        .catch((err) => {
          dispatch(setIsAvatarLoading(false));
          toast(err.message);
        });
    }
  };

  const deletePicture = () => {
    setIsOpen(false);
    dispatch(setIsAvatarLoading(true));
    usersApi
      .deleteUserAvatar()
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

  if (!auth) return;

  return (
    <div className="col mini-gap">
      <label className="list-item all-center" htmlFor="upload">
        <UploadIcon />
        <span>Upload New</span>
      </label>
      <input
        type="file"
        id="upload"
        name="avatar"
        accept="image/png, image/jpeg"
        onChange={uploadPicture}
        style={{ display: 'none' }}
      />
      {!auth.avatar.includes('default') && (
        <span className="list-item all-center" onClick={() => deletePicture()}>
          <DeleteIcon />
          <span>Delete Current</span>
        </span>
      )}
      <span className="list-item all-center" onClick={() => setIsOpen(false)}>
        <span>Cancel</span>
      </span>
    </div>
  );
};
