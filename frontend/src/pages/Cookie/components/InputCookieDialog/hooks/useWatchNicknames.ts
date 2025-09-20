import { useEffect } from 'react';

export const useWatchNicknames = (watch: any, setValue: any) => {
  const watchEditor = watch('membersInfo.editor.nickname');
  const watchTypesetter = watch('membersInfo.typesetter.nickname');

  useEffect(() => {
    if (watchEditor) setValue('isGiveEditorCoins', false);
  }, [watchEditor]);
  useEffect(() => {
    if (watchTypesetter) setValue('isGiveTypesetterCoins', false);
  }, [watchTypesetter]);
};
