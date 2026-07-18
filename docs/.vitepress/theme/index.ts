import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import '@anil-labs/styles';
import '@anil-labs/web-component/auto-register';
import './custom.css';

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {}),
};

export default theme;
