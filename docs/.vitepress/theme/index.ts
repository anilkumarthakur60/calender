import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import '@anil-labs/calendar-styles';
import '@anil-labs/calendar-web-component/auto-register';
import './custom.css';

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {}),
};

export default theme;
