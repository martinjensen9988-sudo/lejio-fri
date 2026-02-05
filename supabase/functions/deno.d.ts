// Deno global declarations
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare const Request: any;
declare const Response: any;
