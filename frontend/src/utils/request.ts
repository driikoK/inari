import toast from 'react-hot-toast';

export const ensure = <T>(response: T): NonNullable<T> => {
  if (!response) throw new Error('Немає відповіді від сервера');

  return response;
};

export const notifyFailure = (error: unknown) => {
  if (error instanceof Error) toast.error(error.message);
};
