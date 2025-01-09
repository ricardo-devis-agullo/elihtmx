import { treaty } from "./eden.js";
import type { App } from "./index.js";

export const isDev = process.env.NODE_ENV !== "production";
export const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000;

export const api = treaty<App>();
