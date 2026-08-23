import '@anil-labs/calendar-styles';
import '@anil-labs/calendar-web-component/auto-register';

const setStatus = (id: string, value: string | null): void => {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '(none)';
};

const wire = (id: string, outId: string): void => {
  document.getElementById(id)?.addEventListener('cal-change', e => {
    setStatus(outId, (e as CustomEvent<{ value: string | null }>).detail.value);
  });
};

wire('multi-basic', 'multi-basic-out');
wire('format-input', 'format-input-out');
wire('eu-input', 'eu-input-out');
wire('datetime-input', 'datetime-input-out');
wire('month-only', 'month-only-out');
wire('year-only', 'year-only-out');

document.getElementById('input-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(e.target as HTMLFormElement);
  setStatus('input-form-out', `bookingDate = ${data.get('bookingDate') ?? '(empty)'}`);
});

document.getElementById('picker-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(e.target as HTMLFormElement);
  setStatus('picker-form-out', `dob = ${data.get('dob') ?? '(empty)'}`);
});
