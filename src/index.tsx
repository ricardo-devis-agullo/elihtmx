import { Elysia, file } from "elysia";
import { Html, html } from "@elysiajs/html";
import { Home } from "./Home";
import { BaseHtml } from "./BaseHtml";
import { ListenCallback } from "elysia/dist/universal/server";
import { ElysiaWS } from "elysia/dist/ws";

import { routes as counterRoutes } from "./Counter";
import { isDev, port } from "./server";

declare global {
  var ws: ElysiaWS;
}

const callback: ListenCallback = async ({ hostname, port }) => {
  if (globalThis.ws) globalThis.ws.send("live-reload");
};

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
  .get("/styles.css", () => file("./tailwind-gen/styles.css"))
  .get("/htmx.js", () => file("./vendor/htmx@2.0.4.js"));

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
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
