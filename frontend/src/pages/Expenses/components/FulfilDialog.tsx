import { FC, useState } from 'react';
import toast from 'react-hot-toast';

import { Box, Button, InputAdornment, TextField } from '@mui/material';

import { CustomDialog, ErrorText, H6 } from '@/components';
import { Parts } from '@/pages/Budget/components/RequestParts';
import {
  expenseKindLabel,
  formatCrumbs,
  formatKop,
  isAuditNotSaved,
  kopToUah,
  MAX_KOP,
  parseUah,
} from '@/pages/Budget/const/options';
import useBudgetStore, { type RequestView } from '@/stores/useBudgetStore';
import { notifyFailure } from '@/utils/request';
import styles from '@/pages/Budget/components/Requests.module.scss';

interface FulfilDialogProps {
  request: RequestView;
  onClose: () => void;
}

export const FulfilDialog: FC<FulfilDialogProps> = ({ request, onClose }) => {
  const fulfilRequest = useBudgetStore((state) => state.fulfilRequest);

  const [amount, setAmount] = useState(kopToUah(request.amountKop ?? 0));
  const [isSaving, setIsSaving] = useState(false);

  const { isOrder, estimate } = request;
  const kop = parseUah(amount);
  const amountError =
    isOrder && (kop === null || kop > MAX_KOP) ? 'Введіть суму, наприклад 1500 або 1500,50' : null;

  const handleConfirm = async () => {
    if (isSaving || amountError) return;

    setIsSaving(true);

    try {
      await fulfilRequest(request._id, isOrder ? kop : null);
      toast.success('Запит виконано');
      onClose();
    } catch (error) {
      if (isAuditNotSaved(error)) onClose();

      notifyFailure(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CustomDialog open onClose={onClose}>
      <H6>Виконати запит</H6>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div>
          <b>{request.nickname}</b> · {expenseKindLabel(request.kind)}
          {isOrder && <> · замовлення «{request.title}»</>}
        </div>

        {request.requisite && <div className={styles.requisite}>{request.requisite}</div>}

        {isOrder ? (
          <>
            <TextField
              label="Сума виплати"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              slotProps={{
                htmlInput: { inputMode: 'decimal' },
                input: { endAdornment: <InputAdornment position="end">грн</InputAdornment> },
              }}
              helperText={`Учасник попросив ${formatKop(request.amountKop ?? 0)}, суму можна виправити`}
            />
            {amountError && <ErrorText>{amountError}</ErrorText>}
            <div className={styles.note}>
              Гроші буде взято з бюджету тайтла, крихти учасника не змінюються.
            </div>
          </>
        ) : (
          <>
            <div>
              З крихт буде знято <b>{formatCrumbs(request.crumbs ?? 0)}</b>
              {estimate && (
                <>
                  , виплата <b>{formatKop(estimate.amountKop)}</b>
                </>
              )}
              .
            </div>
            {estimate && <Parts parts={estimate.parts} />}
            {request.problem && <ErrorText>{request.problem}</ErrorText>}
            <div className={styles.note}>
              Суми й коефіцієнти фіксуються зараз і далі не перераховуються.
            </div>
          </>
        )}

        {request.comment && <div className={styles.note}>Коментар: «{request.comment}»</div>}

        <Button
          variant="contained"
          disabled={isSaving || !!amountError || (!isOrder && !!request.problem)}
          onClick={handleConfirm}
          fullWidth
        >
          Виконано
        </Button>
      </Box>
    </CustomDialog>
  );
};
