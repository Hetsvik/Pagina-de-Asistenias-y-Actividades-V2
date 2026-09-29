import { onRequest as __api_auth_login_js_onRequest } from "C:\\Users\\usuario\\Desktop\\proyecto-cloudflare\\Pagina-de-Asistenias-y-Actividades-V2\\functions\\api\\auth\\login.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "",
      middlewares: [],
      modules: [__api_auth_login_js_onRequest],
    },
  ]