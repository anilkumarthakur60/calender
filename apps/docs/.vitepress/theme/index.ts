import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import '@calender/styles';
import '@calender/web-component/auto-register';
import './custom.css';

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {}),
};

export default theme;
