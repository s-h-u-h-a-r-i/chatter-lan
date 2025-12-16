/* @refresh reload */
import { Router } from '@solidjs/router';
import 'solid-devtools';
import { render } from 'solid-js/web';

import App from './app/App';
import { routes } from './app/routes';
import './styles/index.css';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?'
  );
}

render(
  () => <Router root={(props) => <App>{props.children}</App>}>{routes}</Router>,
  root!
);
