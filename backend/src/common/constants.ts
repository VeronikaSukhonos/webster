export const FILEPATH_PREFIX = `${process.env.EMAIL_API_AND_CLOUD_FILE_STORAGE === 'true' ? process.env.CLOUDFLARE_R2_BUCKET_URL : process.env.VITE_API_URL?.replace(/\/api$/, '')}/files`;
export const DEFAULT_USER_AVATAR = `${FILEPATH_PREFIX}/avatars/default-avatar.png`;
export const DEFAULT_PROJECT_PREVIEW = `${FILEPATH_PREFIX}/projects/default-preview.jpg`;
