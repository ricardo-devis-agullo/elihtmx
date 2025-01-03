import { Elysia, file, t } from "elysia";
import { Html, html } from "@elysiajs/html";
import { Home } from "./Home";
import { BaseHtml } from "./BaseHtml";
import { ListenCallback } from "elysia/dist/universal/server";
import { ElysiaWS } from "elysia/dist/ws";

import { routes as counterRoutes } from "./Counter";

declare global {
  var ws: ElysiaWS;
}

const callback: ListenCallback = async ({ hostname, port }) => {
  if (globalThis.ws) globalThis.ws.send("live-reload");
};
const isDev = process.env.NODE_ENV !== "production";

const app = new Elysia()
  .use(html())
  .get("/", async (req) => {
    return (
      <BaseHtml>
        <Home />
      </BaseHtml>
    );
  })
  .use(counterRoutes)
  .get("/styles.css", () => file("./tailwind-gen/styles.css"));

if (isDev) {
  app.ws("/live-reload", {
    open(ws) {
      globalThis.ws = ws;
    },
  });
}

app.listen(3000, callback);

export type App = typeof app;

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
