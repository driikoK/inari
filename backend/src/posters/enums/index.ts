export const MAX_POSTER_BYTES = 5 * 1024 * 1024;
export const MAX_POSTER_SIDE = 800;
export const MAX_POSTER_PIXELS = 40_000_000;
export const POSTER_QUALITY = 82;
export const POSTER_FORMATS = ['jpeg', 'png', 'webp'];
export const POSTER_FILE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export const POSTER_NOT_AN_IMAGE = 'Завантажте зображення JPEG, PNG або WebP';
export const POSTER_TOO_LARGE = 'Файл завеликий, максимум 5 МБ';
export const POSTER_MISSING = 'Додайте файл постера';
export const POSTER_UNREADABLE = 'Не вдалося прочитати файл, спробуйте ще раз';
