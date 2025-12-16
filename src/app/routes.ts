import { RouteDefinition } from '@solidjs/router';
import { lazy } from 'solid-js';

export const routes: RouteDefinition[] = [
  {
    path: '/',
  },
  {
    path: '**',
    component: lazy(() => import('./pages/not-found')),
  },
];
