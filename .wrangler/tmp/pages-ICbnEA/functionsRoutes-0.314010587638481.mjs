import { onRequest as __api_login_js_onRequest } from "D:\\MyProjects\\My-H5-Empire\\functions\\api\\login.js"
import { onRequest as __api___path___js_onRequest } from "D:\\MyProjects\\My-H5-Empire\\functions\\api\\[[path]].js"

export const routes = [
    {
      routePath: "/api/login",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_login_js_onRequest],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  ]