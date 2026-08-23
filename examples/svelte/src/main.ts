import { mount } from 'svelte';
import '@anil-labs/calendar-styles';
import App from './App.svelte';

const target = document.getElementById('app');
if (!target) throw new Error('#app missing');
mount(App, { target });
