import { Html } from "@elysiajs/html";
import { Elysia, t } from "elysia";
import { api } from "./server";

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
    <div class="space-y-4" id="counter">
      <div
        id="counter-value"
        class="text-center text-5xl font-bold text-gray-800"
      >
        {count}
      </div>

      <div class="flex justify-center space-x-4">
        <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          hx-post={api.increment({ count }).post()}
          hx-target="#counter"
          hx-swap="outerHTML"
        >
          Increment
        </button>

        <button
          class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
          hx-post={api.decrement({ count }).post()}
          hx-target="#counter"
          hx-swap="outerHTML"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
