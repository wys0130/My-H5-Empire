import { onRequest as __api_login_js_onRequest } from "D:\\MyProjects\\My-H5-Empire\\functions\\api\\login.js"

export const routes = [
    {
      routePath: "/api/login",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_login_js_onRequest],
    },
  ]