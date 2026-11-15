import { FC, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { Autocomplete, createFilterOptions, TextField } from '@mui/material';

import { useAuthStore, useMembersStore } from '@/stores';
import { MemberType } from '@/types';
import { notifyFailure } from '@/utils/request';

interface NicknameOption {
  nickname: string;
  isNew?: boolean;
  isTaken?: boolean;
}

interface TeamNicknameCellProps {
  userId: string;
  nickname?: string;
  members: MemberType[];
  linkedNicknames: Set<string>;
}

const filterOptions = createFilterOptions<NicknameOption>();

const sameNickname = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

const optionLabel = ({ nickname, isNew, isTaken }: NicknameOption) => {
  if (isNew) return `Створити «${nickname}»`;

  return isTaken ? `${nickname} — зайнято` : nickname;
};

export const TeamNicknameCell: FC<TeamNicknameCellProps> = ({
  userId,
  nickname,
  members,
  linkedNicknames,
}) => {
  const setUserNickname = useAuthStore((state) => state.setUserNickname);
  const getMembers = useMembersStore((state) => state.getMembers);
  const [isSaving, setIsSaving] = useState(false);

  const options = useMemo<NicknameOption[]>(() => {
    const list = members.map((member) => ({
      nickname: member.nickname,
      isTaken: member.nickname !== nickname && linkedNicknames.has(member.nickname),
    }));
    const isLinkedHidden = nickname && !members.some((member) => member.nickname === nickname);

    return isLinkedHidden ? [{ nickname }, ...list] : list;
  }, [members, linkedNicknames, nickname]);

  const value = options.find((option) => option.nickname === nickname) ?? null;

  const handleChange = async (option: NicknameOption | null) => {
    setIsSaving(true);

    try {
      await setUserNickname(userId, option?.nickname ?? null, !!option?.isNew);

      if (option?.isNew) await getMembers();

      toast.success(
        option
          ? option.isNew
            ? 'Нікнейм створено і прив’язано'
            : 'Нікнейм прив’язано'
          : 'Прив’язку знято',
      );
    } catch (error) {
      notifyFailure(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Autocomplete<NicknameOption>
      size="small"
      fullWidth
      value={value}
      options={options}
      disabled={isSaving}
      clearText="Зняти прив’язку"
      noOptionsText="Нікнеймів не знайдено"
      getOptionLabel={(option) => option.nickname}
      getOptionDisabled={(option) => !!option.isTaken}
      isOptionEqualToValue={(option, selected) => option.nickname === selected.nickname}
      filterOptions={(all, state) => {
        const matched = filterOptions(all, state);
        const input = state.inputValue.trim();
        const exists = all.some((option) => sameNickname(option.nickname, input));

        return input && !exists ? [...matched, { nickname: input, isNew: true }] : matched;
      }}
      renderOption={({ key, ...props }, option) => (
        <li key={key} {...props}>
          {optionLabel(option)}
        </li>
      )}
      onKeyDown={(event) => event.stopPropagation()}
      onChange={(_, option) => handleChange(option)}
      renderInput={(params) => <TextField {...params} placeholder="Не призначено" />}
      sx={{ fontSize: 13, minWidth: 240 }}
    />
  );
};
