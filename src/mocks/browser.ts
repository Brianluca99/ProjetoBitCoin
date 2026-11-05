import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { socketHandlers } from "./realtime";
import { readScenarioFromUrl } from "./scenarios";

export async function startMocks() {
  readScenarioFromUrl();
  const worker = setupWorker(...handlers, ...socketHandlers);
  await worker.start({ onUnhandledRequest: "bypass", quiet: true, serviceWorker: { url: "/mockServiceWorker.js" } });
  return worker;
}
