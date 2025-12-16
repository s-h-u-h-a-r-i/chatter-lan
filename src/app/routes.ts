import { RouteDefinition } from '@solidjs/router';
import { lazy } from 'solid-js';

import Rooms from './pages/rooms';
import Room from './pages/rooms/room';

export const routes: RouteDefinition[] = [
  {
    path: '/rooms',
    component: Rooms,
    children: [
      {
        path: '/',
        component: Room,
      },
      {
        path: '/:id',
        component: Room,
      },
    ],
  },
  {
    path: '**',
    component: lazy(() => import('./pages/not-found')),
  },
];
