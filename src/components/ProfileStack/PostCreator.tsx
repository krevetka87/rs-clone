import React, { useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  IconButton,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import useSWRMutation from 'swr/mutation';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL, ApiPath } from '../../constants';
import { addPost } from '../../api/postsApi';
import { TAddPostArg } from '../../types/postsApi';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateUser } from '../../api/usersApi';
import { TUpdateUserArg } from '../../types/usersApi';
import ClickableAvatar from '../ClickableAvatar';
import { addPostInState } from '../../store/reducers/postsState';
import { updateUserInState } from '../../store/reducers/usersState';
import ImageAlert from '../ImageAlert/ImageAlert';
import { sendPostImage } from '../../api/imagesApi';
import { getHexStr } from '../../utils/common';

export default function PostCreator() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [isLoading, setLoading] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [postPhotos, setPostPhotos] = useState<File[]>([]);
  const [valueCreatePost, setValueCreatePost] = useState<string>('');

  const { idCurrentProfile, currentProfile, authorizedUser, idAuthorizedUser } = useAppSelector((state) => state.users);

  const { trigger: triggerAddPost } = useSWRMutation(`${API_BASE_URL}${ApiPath.posts}`, addPost, { revalidate: false });
  const { trigger: triggerUpdateUser } = useSWRMutation(
    `${API_BASE_URL}${ApiPath.users}/${idCurrentProfile}`,
    updateUser
  );

  const photoPicker = useRef<HTMLInputElement | null>(null);

  const handleClickCreatePost = async (): Promise<void> => {
    setLoading(true);

    const argAddPost: TAddPostArg = {
      description: valueCreatePost,
      userId: idAuthorizedUser,
    };

    const responseDataAppPost = await triggerAddPost(argAddPost);

    if (currentProfile && responseDataAppPost) {
      const { id: newPostId } = responseDataAppPost;

      const formData: FormData = new FormData();

      postPhotos.forEach((ph) => formData.append('post-img', ph));

      const resImage = await sendPostImage(`${API_BASE_URL}${ApiPath.images}/post/${newPostId}`, formData);

      if (resImage.ok) {
        const newImages = (await resImage.json()) as string[];
        responseDataAppPost.images = newImages;
      }

      const argUpdateUser: TUpdateUserArg = {
        postsIds: currentProfile.postsIds ? [...currentProfile.postsIds, newPostId] : [newPostId],
      };

      const responseDataUpdateUser = await triggerUpdateUser(argUpdateUser);

      if (responseDataUpdateUser) {
        dispatch(addPostInState(responseDataAppPost));
        dispatch(updateUserInState(responseDataUpdateUser));
      }
    }

    setPostPhotos([]);
    setValueCreatePost('');
    setLoading(false);
  };

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
    setValueCreatePost(e.target.value);

  const handleChangePhoto = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { files } = e.target;

    if (files?.length) {
      const incorrectFileSize = [...files].some((f) => f.size / 1024 / 1024 > 5);

      if (incorrectFileSize) {
        return setPhotoError(true);
      }

      setPostPhotos([...postPhotos, ...files]);
    }

    return undefined;
  };

  const removePhoto = (e: React.MouseEvent): void => {
    const { name } = e.currentTarget as HTMLInputElement;
    setPostPhotos((prev) => prev.filter((file) => file.name !== name));
  };

  const handlePhotoPicker = (): void => {
    if (photoPicker.current) {
      photoPicker.current.click();
    }
  };

  const handleCloseError = (): void => setPhotoError(false);

  return (
    <>
      <Card sx={{ borderRadius: 4, boxShadow: { xs: 4, md: 0 } }}>
        <Box>
          <CardContent sx={{ display: 'flex', gap: 2 }}>
            {authorizedUser ? (
              <Box sx={{ mt: '8px' }}>
                <ClickableAvatar user={authorizedUser} />
              </Box>
            ) : (
              <Skeleton variant="circular">
                <Avatar />
              </Skeleton>
            )}
            <TextField
              multiline
              onChange={handleChangeInput}
              label={t('profile.addPost.label')}
              value={valueCreatePost}
              sx={{
                flexGrow: '1',
              }}
            />
          </CardContent>
          {postPhotos.map((postPhoto) => (
            <Box key={getHexStr()} sx={{ maxWidth: '150px', p: '16px', position: 'relative' }}>
              <IconButton
                name={postPhoto.name}
                size="small"
                sx={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-10px',
                  '&.MuiButtonBase-root:hover': {
                    bgcolor: 'transparent',
                  },
                }}
                onClick={removePhoto}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <Box
                component="img"
                src={URL.createObjectURL(postPhoto)}
                alt="Post photo"
                sx={{ width: '118px', height: '118px' }}
              />
            </Box>
          ))}
        </Box>
        <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <input
            hidden
            multiple
            accept=".jpg, .jpeg, .png, .webp"
            type="file"
            ref={photoPicker}
            onChange={handleChangePhoto}
          />
          <Button aria-label="Upload photo" sx={{ gap: 1 }} onClick={handlePhotoPicker}>
            <AddPhotoAlternateOutlinedIcon />
            <Typography sx={{ display: { xs: 'none', md: 'block' } }}>{t('profile.addPost.photo')}</Typography>
          </Button>
          {isLoading ? (
            <CircularProgress size={20} sx={{ mr: 3 }} />
          ) : (
            <Button
              variant="contained"
              aria-label="Create post"
              onClick={handleClickCreatePost}
              disabled={[!valueCreatePost && !postPhotos.length, isLoading].some(Boolean)}
              sx={{ gap: 1 }}
            >
              <Typography>{t('profile.addPost.button')}</Typography>
            </Button>
          )}
        </CardActions>
      </Card>
      <ImageAlert open={photoError} handleCloseError={handleCloseError} />
    </>
  );
}
