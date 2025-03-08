import { FunctionComponent } from 'react';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useFormContext } from 'react-hook-form';

import usePollStore, { PollAnime } from '@/stores/usePollStore';
import { H5, Icon, P } from '@/components';

import MalImg from '/mal.png';
import { usePermissions } from '@/hooks';
import { SUBJECTS } from '@/context/casl';
import { ChooseAnimeFormValues } from '../../types';
import { rolesForTitle } from '../../const';
import { LinkWrapper, Poster } from '../../styles';

interface ICardProps {
  card: PollAnime;
}

const PollCard: FunctionComponent<ICardProps> = ({ card }) => {
  const { isDecided, isPriority, isSponsored, link, name, posterUrl, note } = card;

  const deleteAnime = usePollStore((state) => state.deleteAnime);
  const { watch, setValue } = useFormContext<ChooseAnimeFormValues>();
  const { hasAccess } = usePermissions();

  const chosenAnimesWatch = watch('chosenAnimes');

  const currentAnime = chosenAnimesWatch.find((anime) => anime.animeId === card._id);

  const handleRoleChange = (role: string, checked: boolean) => {
    let updatedAnimes = [...chosenAnimesWatch];

    if (checked) {
      if (currentAnime) {
        currentAnime.roles.push(role);
      } else {
        updatedAnimes.push({ animeId: card._id, roles: [role] });
      }
    } else {
      if (!currentAnime) return;

      currentAnime.roles = currentAnime.roles.filter((r) => r !== role);

      if (currentAnime.roles.length === 0) {
        updatedAnimes = updatedAnimes.filter((anime) => anime.animeId !== card._id);
      }
    }

    setValue('chosenAnimes', [...updatedAnimes]);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnime(id);
      toast.success('Аніме видалено');
    } catch (error) {
      toast.error('Сталася помилка');
    }
  };

  return (
    <Card
      sx={{
        maxWidth: '100%',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            gap: '10px',
            position: 'absolute',
            top: 5,
            left: 5,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ fontWeight: '600' }}>
            {isPriority && <Chip label="+25% крихт" color="primary" />}
            {isSponsored && <Chip label="Від меценатів" color="success" />}
          </Stack>
        </Box>

        <Poster $url={posterUrl} />
      </Box>

      <CardContent>
        <LinkWrapper href={link} target="_blank">
          <Icon img={MalImg} />
          <P sx={(theme) => ({ color: theme.palette.info.light })}>MAL</P>
        </LinkWrapper>

        <H5>{name}</H5>

        {isDecided && (
          <P sx={(theme) => ({ color: theme.palette.info.main })}>(Тайтл точно робитиметься)</P>
        )}

        {note && <P sx={{ mt: 5 }}>{note}</P>}

        <Box sx={{ mt: 1 }}>
          {rolesForTitle.map((role) => (
            <FormControlLabel
              key={role.value}
              label={role.title}
              control={
                <Checkbox
                  checked={!!currentAnime?.roles.includes(role.value)}
                  onChange={(e) => handleRoleChange(role.value, e.target.checked)}
                />
              }
            />
          ))}
        </Box>
      </CardContent>

      <CardActions>
        {hasAccess(SUBJECTS.DELETE_POLL_ANIME) && (
          <IconButton
            onClick={() => handleDelete(card._id)}
            sx={{ cursor: 'pointer', paddingLeft: 0 }}
          >
            <DeleteIcon color="warning" />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
};

export default PollCard;
