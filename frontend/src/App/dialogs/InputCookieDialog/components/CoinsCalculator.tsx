import { useEffect, useState } from 'react';
import { Box, Collapse, TextField, useMediaQuery } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import theme from '@theme';
import P from '@/components/Typography/P';

export const CoinsCalculator = ({ coinsForDubs }: { coinsForDubs: number }) => {
  const isTablet = useMediaQuery(theme.screens.tablet);

  const [total, setTotal] = useState<string>('');
  const [dubRows, setDubRows] = useState<string>('');
  const [resultCoins, setResultCoins] = useState<string>('');
  const [isShowCalculator, setIsShowCalculator] = useState(false);

  const calculateCoinsForDubber = () => {
    const convertedTotal = Number(total);
    const convertedDubRows = Number(dubRows);

    if (!convertedTotal || !convertedDubRows || convertedTotal <= 0 || convertedDubRows <= 0)
      return setResultCoins('');
    const result = (convertedDubRows / convertedTotal) * Number(coinsForDubs);

    setResultCoins(result % 1 === 0 ? result.toString() : result.toFixed(3).toString());
  };

  const handleInputChange = (value: string, currentField: 'total' | 'dub') => {
    if (value.match(/[^0-9]/)) return;

    if (currentField === 'total') {
      setTotal(value);
    } else if (currentField === 'dub') {
      setDubRows(value);
    }
  };

  useEffect(() => {
    calculateCoinsForDubber();
  }, [total, dubRows]);

  return (
    <>
      <Collapse
        in={isShowCalculator}
        onClick={() => setIsShowCalculator(!isShowCalculator)}
        collapsedSize={30}
        sx={{ width: isTablet ? '25%' : '50%' }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            cursor: 'pointer',
          }}
        >
          <P>Калькулятор</P>

          <KeyboardArrowDownIcon
            sx={{
              transform: isShowCalculator ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out',
            }}
          />
        </Box>
      </Collapse>

      {isShowCalculator && (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: isTablet ? 'row' : 'column' }}>
          <TextField
            label="Реплік в тайтлі"
            type="number"
            value={total}
            onChange={(e) => handleInputChange(e.target.value, 'total')}
            sx={{ width: isTablet ? '40%' : 'auto' }}
          />
          <TextField
            label="Репліки дабера"
            type="number"
            value={dubRows}
            onChange={(e) => handleInputChange(e.target.value, 'dub')}
            sx={{ width: isTablet ? '40%' : 'auto' }}
          />
          <TextField
            placeholder="0"
            value={resultCoins}
            disabled
            sx={{ width: isTablet ? '16%' : 'auto' }}
          />
        </Box>
      )}
    </>
  );
};
