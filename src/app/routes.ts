import { RouteDefinition } from "@solidjs/router";
import { lazy } from "solid-js";

import Home from "./pages/home";
import NotFound from "./pages/not-found";

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/rooms/:id",
    component: lazy(() => import("./pages/room")),
  },
  {
    path: "/login",
    component: lazy(() => import("./pages/login")),
  },
  {
    path: "**",
    component: NotFound,
  },
];
