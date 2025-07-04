import { Html } from "@elysiajs/html";
import type { PropsWithChildren } from "@kitajs/html";
import { isDev, port } from "./server";

export function BaseHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        {isDev && (
          <script type="text/javascript">
            {`(function() {
            const socket = new WebSocket("ws://localhost:${port}/live-reload");
            socket.onmessage = function(msg) {
              if (msg.data === 'live-reload') {
                location.reload();
              }
            };
            console.log('Live reload enabled.');
          })();`}
          </script>
        )}
        <meta charset="UTF-8 " />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HTMX Example</title>
        <script src="/htmx.js" />
        <script src="/hyperscript.js" />
        <link href="/styles.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
