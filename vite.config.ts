import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  ...(process.env["NETLIFY"] === "true" ? { nitro: { preset: "netlify" } } : {}),
  tanstackStart: {
    server: { entry: "server" },
  },
});
