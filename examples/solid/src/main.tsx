import { render } from 'solid-js/web';
import '@anil-labs/calendar-styles';
import './styles.css';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');
render(() => <App />, root);
