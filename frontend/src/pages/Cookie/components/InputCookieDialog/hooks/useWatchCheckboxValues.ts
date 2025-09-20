import { useEffect } from 'react';

export const useWatchCheckboxValues = (watch: any, setValue: any) => {
  const watchIsGiveEditorCoins = watch('isGiveEditorCoins');
  const watchIsGiveTypesetterCoins = watch('isGiveTypesetterCoins');

  useEffect(() => {
    if (watchIsGiveEditorCoins) setValue('membersInfo.editor.nickname', '');
  }, [watchIsGiveEditorCoins]);
  useEffect(() => {
    if (watchIsGiveTypesetterCoins) setValue('membersInfo.typesetter.nickname', '');
  }, [watchIsGiveTypesetterCoins]);
};
