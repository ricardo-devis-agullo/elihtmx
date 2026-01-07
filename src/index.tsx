import { Elysia, file } from "elysia";
import { html } from "@elysiajs/html";
import type { ListenCallback } from "elysia/dist/universal/server";
import type { ElysiaWS } from "elysia/dist/ws";

import { mediaRoutes } from "./routes/media.tsx";
import { isDev, port } from "./server";

declare global {
  var ws: ElysiaWS;
}

const callback: ListenCallback = async () => {
  if (globalThis.ws) globalThis.ws.send("live-reload");
};

const app = new Elysia()
  .use(html())
  .use(mediaRoutes)
  .get("/styles.css", () => file("./tailwind-gen/styles.css"))
  .get("/htmx.js", () => file("./vendor/htmx@2.0.4.js"))
  .get("/hyperscript.js", () => file("./vendor/hyperscript@0.9.14.js"));

if (isDev) {
  app.ws("/live-reload", {
    open(ws) {
      globalThis.ws = ws;
    },
  });
}

app.listen(port, callback);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
