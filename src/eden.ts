import type { Elysia } from "elysia";

type IsNever<T> = [T] extends [never] ? true : false;
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

namespace Treaty {
  export type Create<App extends Elysia<any, any, any, any, any, any, any>> =
    App extends {
      "~Routes": infer Schema extends Record<string, any>;
    }
      ? Prettify<Sign<Schema>>
      : "Please install Elysia before using Eden";

  export type Sign<in out Route extends Record<string, any>> = {
    [K in keyof Route as K extends `:${string}` ? never : K]: Route[K] extends {
      params: any;
      query: infer Query;
    }
      ? (
          undefined extends Query
            ? { query?: Record<string, unknown> }
            : { query: Query }
        ) extends infer Param
        ? (options?: Prettify<Param>) => string
        : never
      : CreateParams<Route[K]>;
  };

  type CreateParams<Route extends Record<string, any>> = Extract<
    keyof Route,
    `:${string}`
  > extends infer Path extends string
    ? IsNever<Path> extends true
      ? Prettify<Sign<Route>>
      : // ! DO NOT USE PRETTIFY ON THIS LINE, OTHERWISE FUNCTION CALLING WILL BE OMITTED
        (((params: {
          [param in Path extends `:${infer Param}`
            ? Param extends `${infer Param}?`
              ? Param
              : Param
            : never]: string | number;
        }) => Prettify<Sign<Route[Path]>> & CreateParams<Route[Path]>) &
          Prettify<Sign<Route>>) &
          (Path extends `:${string}?` ? CreateParams<Route[Path]> : {})
    : never;

  export type TreatyResponse = string;
}

const method = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
  "connect",
  "subscribe",
] as const;

const createProxy = (paths: string[] = []): any =>
  new Proxy(() => {}, {
    get(_, param: string): any {
      return createProxy(param === "index" ? paths : [...paths, param]);
    },
    apply(_, __, [body, options]) {
      if (
        !body ||
        options ||
        (typeof body === "object" && Object.keys(body).length !== 1) ||
        method.includes(paths.at(-1) as any)
      ) {
        const methodPaths = [...paths];
        const method = methodPaths.pop();
        const path = `/${methodPaths.join("/")}`;

        const isGetOrHead = method === "get" || method === "head";
        const query = isGetOrHead ? body?.query : options?.query;

        let q = "";
        if (query) {
          const append = (key: string, value: string) => {
            q += `${q ? "&" : "?"}${encodeURIComponent(
              key
            )}=${encodeURIComponent(value)}`;
          };

          for (const [key, value] of Object.entries(query)) {
            if (Array.isArray(value)) {
              for (const v of value) append(key, v);
              continue;
            }

            if (typeof value === "object") {
              append(key, JSON.stringify(value));
              continue;
            }

            append(key, `${value}`);
          }
        }

        const url = path + q;
        return url;
      }

      if (typeof body === "object") {
        return createProxy([...paths, Object.values(body)[0] as string]);
      }

      return createProxy(paths);
    },
  });

export const treaty = <
  const App extends Elysia<any, any, any, any, any, any, any>
>(): Treaty.Create<App> => {
  return createProxy();
};

export type { Treaty };
