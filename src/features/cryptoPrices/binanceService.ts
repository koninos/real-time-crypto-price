import type { WebSocketClient } from "../../websocket/webSocketClient";
import type { Symbol } from "./types";

export function subscribe(
  client: WebSocketClient,
  symbols: Symbol[],
  requestId: number
): void {
  if (symbols.length === 0) {
    return;
  }

  client.send(
    JSON.stringify({
      method: "SUBSCRIBE",
      params: symbols.map(
        (symbol) => `${symbol.toLowerCase()}@trade`
      ),
      id: requestId,
    })
  );
}

export function unsubscribe(
  client: WebSocketClient,
  symbols: Symbol[],
  requestId: number
): void {
  if (symbols.length === 0) {
    return;
  }

  client.send(
    JSON.stringify({
      method: "UNSUBSCRIBE",
      params: symbols.map(
        (symbol) => `${symbol.toLowerCase()}@trade`
      ),
      id: requestId,
    })
  );
}