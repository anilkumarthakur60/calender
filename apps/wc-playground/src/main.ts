import '@calender/styles';
import '@calender/web-component/auto-register';

const setStatus = (id: string, value: string | null): void => {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? '(none)';
};

document.getElementById('range-picker')?.addEventListener('cal-change', e => {
  setStatus('range-out', (e as CustomEvent<{ value: string | null }>).detail.value);
});

document.getElementById('multi-picker')?.addEventListener('cal-change', e => {
  setStatus('multi-out', (e as CustomEvent<{ value: string | null }>).detail.value);
});

document.getElementById('single-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(e.target as HTMLFormElement);
  setStatus('single-out', `dob = ${data.get('dob') ?? '(empty)'}`);
});
