import { Html } from "@elysiajs/html";
import type { PropsWithChildren } from "@kitajs/html";

const isDev = process.env.NODE_ENV !== "production";

export function BaseHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        {isDev && (
          <script type="text/javascript">
            {`(function() {
            const socket = new WebSocket("ws://localhost:3000/live-reload");
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
        <script
          src="https://unpkg.com/htmx.org@2.0.4"
          integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+"
          crossorigin="anonymous"
        />
        <link href="/styles.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
