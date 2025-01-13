import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("register", "routes/register.tsx"),
  route("login", "routes/login.tsx"),
  layout("context/ws.tsx", [
    route("matching", "routes/matching.tsx"),
    route("room/:roomId", "routes/room.tsx"),
  ])
] satisfies RouteConfig;
