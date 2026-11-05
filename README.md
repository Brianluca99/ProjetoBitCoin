# Kurio — NFT Marketplace

Frontend for the NFT marketplace challenge, built with React, TypeScript, TanStack Router, TanStack Query, Axios, Tailwind CSS, shadcn/ui, MSW and Socket.IO.

## Setup and commands

```sh
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm test
npx tsc --noEmit
```

`npm run build` gera a saída do TanStack Start em `.output/` e a copia para `dist/` no build local. No Netlify, o build usa o preset `netlify` e preserva os assets e funções preparados pelo Nitro em `dist/` e `.netlify/`.

Para deploy conectado ao repositório, use o comando `npm run build` e diretório de publicação `dist`. Não adicione um redirect SPA para `index.html`: a aplicação usa renderização no servidor e o preset Netlify encaminha as rotas pelas funções.

The app runs with the MSW demo backend enabled by default. `VITE_ENABLE_MOCKS=false` disables it. Optional connection settings are `VITE_API_URL` (defaults to `/api`) and `VITE_SOCKET_URL` (defaults to the current origin).

## Demo accounts

Both fictitious users use the password `kurio123`:

- `ana@kurio.art`
- `bruno@kurio.art`

## Mock scenarios

Choose a scenario by opening the app with `?scenario=<name>`. Available names include `default`, `empty`, `slow`, `variable-latency`, `offline`, `server-error`, `session-expired`, `favorites-fail`, `price-change`, `sold-out`, `order-timeout`, `payment-declined`, `wallet-reject` and `duplicate-events`.

The scenario is saved in local storage. To restore the database and deterministic random seed, call:

```js
fetch("/api/__mock/reset", { method: "POST" });
```

For example, `http://localhost:5173/?scenario=order-timeout` exercises the order-timeout scenario. Use a fresh browser session or reset the mock database between isolated manual runs.

## Code layout

- `src/routes` — TanStack Router route definitions
- `src/pages` and `src/components` — screens and UI
- `src/services/client-api.ts` — typed API calls, query keys and TanStack Query hooks
- `src/services/http.ts` — Axios client and API error handling
- `src/services/contracts.ts` — REST and event contracts
- `src/services/realtime.ts` — Socket.IO client and cache reconciliation
- `src/mocks` — MSW handlers, fixtures, persistent mock state and scenario controls
- `src/lib/decimal.ts` — exact decimal arithmetic and ETH formatting

The Socket.IO mock uses the WebSocket protocol intercepted by MSW and `@mswjs/socket.io-binding`; it is a deterministic frontend mock, not a production Socket.IO server or a substitute for validating a real deployment transport.

## Challenge checklist status

The application includes the main catalog, NFT detail, cart, checkout, account and wallet screens, REST mocks, and simulated real-time events. The challenge's full delivery checklist is not yet complete: Playwright E2E and visual regression suites/baselines, Lighthouse configuration and reports, `ARCHITECTURE.md`, and a public deployment URL are not included. Profile avatar and password editing also remain outstanding.
