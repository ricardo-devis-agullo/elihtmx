import { Html } from "@elysiajs/html";
import { Elysia, t } from "elysia";
import { api } from "./api";

export const routes = new Elysia()
  .post(
    "/increment/:count",
    ({ params }) => <Counter count={params.count + 1} />,
    { params: t.Object({ count: t.Number() }) }
  )
  .post(
    "/decrement/:count",
    ({ params }) => {
      return <Counter count={params.count - 1} />;
    },
    {
      params: t.Object({
        count: t.Number(),
      }),
    }
  );

export function Counter({ count }: { count: number }) {
  return (
    <div id="counter">
      <div id="counter-value">{count}</div>
      <div>
        <button
          type="button"
          hx-post={api.increment({ count }).post()}
          hx-target="#counter"
        >
          Increment
        </button>

        <button
          type="button"
          hx-post={api.decrement({ count }).post()}
          hx-target="#counter"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
