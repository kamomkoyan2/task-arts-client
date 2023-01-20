import {
  createMemoryHistory,
  createRouter as _createRouter,
  createWebHistory,
} from "vue-router";
import Home from "../pages/index.vue";
import Login from "../pages/auth/login.vue";
import Auth from "../layouts/auth.vue";

export function createRouter() {
  return _createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [
      {
        path: "/",
        name: "home",
        component: Home,
      },

      {
        path: "/auth",
        name: "layout",
        component: Auth,
        children: [
          {
            path: "login",
            name: "login",
            component: Login,
          },
        ]
      },


    ],
  });
}
