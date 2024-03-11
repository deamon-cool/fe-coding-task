import { useMemo, useState } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import Slider from '@mui/material/Slider';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import { Button, FormLabel } from '@mui/material';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';
import { BarChart } from '@mui/x-charts';

type Form = {
  range: number[];
  type: string;
};

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

function App() {
  const [range, setRange] = useState<number[]>([56, 59]);
  const [type, setType] = useState('00');
  const [showModal, setShowModal] = useState(false);
  const [xAxis, setXAxis] = useState<string[]>([]);
  const [series, setSeries] = useState<number[]>([]);
  const { register, handleSubmit } = useForm();

  const quarters = useMemo(() => {
    const l_quarters = [];
    for (let year = 2009; year <= 2023; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        l_quarters.push(`${year}K${quarter}`);
      }
    }
    return l_quarters;
  }, []);

  const selectItems = {
    '00': 'Boliger i alt',
    '02': 'Småhus',
    '03': 'Blokkleiligheter',
  };

  const handleSlider = (event: Event, newValue: number | number[]) => {
    setRange(newValue as number[]);
  };

  const handleSelect = (event: SelectChangeEvent) => {
    setType(event.target.value);
  };

  const searchHandler = (data: Form) => {
    console.log(data);
    setShowModal(true);
    const quartersRange = quarters.slice(range[0], range[1] + 1);

    const url = new URL(window.location.href);
    url.searchParams.set('range', `${quarters[range[0]]}-${quarters[range[1]]}`);
    url.searchParams.set('type', encodeURIComponent(selectItems[type as keyof typeof selectItems]));
    window.history.pushState({}, '', url.toString());

    fetch('https://data.ssb.no/api/v0/no/table/07241', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: [
          {
            code: 'Boligtype',
            selection: {
              filter: 'item',
              values: [type],
            },
          },
          {
            code: 'ContentsCode',
            selection: {
              filter: 'item',
              values: ['KvPris'],
            },
          },
          {
            code: 'Tid',
            selection: {
              filter: 'item',
              values: quartersRange,
            },
          },
        ],
        response: {
          format: 'json-stat2',
        },
      }),
    })
      .then((response) => response.json())
      .then((data: { value?: number[] }) => {
        setXAxis(quartersRange);
        setSeries(data?.value ?? []);
      })
      .catch((error) => console.error('Error:', error));
  };

  const saveHistoryHandler = () => {
    let history: Form[] = JSON.parse(localStorage.getItem('history') ?? '[]');
    history.push({ range: range, type: type });
    localStorage.setItem('history', JSON.stringify(history));

    setShowModal(false);
  };

  return (
    <Container maxWidth='sm'>
      <FormControl>
        <FormLabel style={{ marginBottom: '10px' }}>Quarters range</FormLabel>
        <Box style={{ marginBottom: '20px' }} sx={{ width: 600 }}>
          <Grid container spacing={2}>
            <Grid item xs={2}>
              <TextField
                value={quarters[range[0]]}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={8}>
              <Slider value={range} onChange={handleSlider} step={1} marks min={0} max={quarters.length - 1} />
            </Grid>
            <Grid item xs={2}>
              <TextField
                value={quarters[range[1]]}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          </Grid>
        </Box>
        <FormLabel>Building type</FormLabel>
        <Box sx={{ width: 300 }}>
          <Select {...register('type')} value={type} label='Type' onChange={handleSelect}>
            {Object.keys(selectItems).map((key) => (
              <MenuItem key={key} value={key} {...(key === '00' ? { selected: true } : '')}>
                {selectItems[key as keyof typeof selectItems]}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Button onClick={() => handleSubmit(searchHandler)()}>Search</Button>

        <Modal open={showModal} onClose={() => setShowModal(false)}>
          <Box sx={{ ...style, width: 200 }}>
            <p>Do you want to save search entry in the history?</p>
            <Button onClick={saveHistoryHandler}>Yes</Button>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
          </Box>
        </Modal>
      </FormControl>
      {series.length > 0 && (
        <BarChart xAxis={[{ scaleType: 'band', data: xAxis }]} series={[{ data: series, label: 'NOK' }]} width={500} height={300} />
      )}
    </Container>
  );
}

export default App;
