import { Html } from "@elysiajs/html";
import { Counter } from "./Counter";

export function Home() {
  return (
    <div class="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Elysia + HTMX + Hyperscript + Tailwind CSS
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            A beautiful counter example
          </p>
        </div>

        <Counter count={0} />

        <div class="flex justify-center">
          <button
            class="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            _="on click set my textContent to 'Clicked!'"
          >
            Click me!
          </button>
        </div>

        <div class="text-center mt-6 text-gray-500 text-sm">
          Built with ❤️ using Elysia, HTMX, Hyperscript and Tailwind CSS.
        </div>
      </div>
    </div>
  );
}
