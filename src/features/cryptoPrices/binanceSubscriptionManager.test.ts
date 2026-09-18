import type { WebSocketClient } from "../../websocket/webSocketClient";
import { BinanceSubscriptionManager } from "./binanceSubscriptionManager";

describe("BinanceSubscriptionManager", () => {
  let client: WebSocketClient;
  let send: jest.Mock;
  let manager: BinanceSubscriptionManager;

  beforeEach(() => {
    send = jest.fn();

    client = {
      isConnected: true,
      send,
    } as unknown as WebSocketClient;

    manager = new BinanceSubscriptionManager(client);
  });

  it("sends a subscribe request for desired symbols", () => {
    manager.synchronize(["BTCUSDT"]);

    expect(client.send).toHaveBeenCalledWith(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: ["btcusdt@trade"],
        id: 1,
      }),
    );
  });

  it("does not send a duplicate subscription while the request is pending", () => {
    manager.synchronize(["BTCUSDT"]);
    manager.synchronize(["BTCUSDT"]);

    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it("marks a subscription as active after confirmation", () => {
    manager.synchronize(["BTCUSDT"]);

    manager.handleResponse(1, ["BTCUSDT"]);

    manager.synchronize(["BTCUSDT"]);

    expect(client.send).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes from symbols that are no longer desired", () => {
    manager.synchronize(["BTCUSDT"]);

    manager.handleResponse(1, ["BTCUSDT"]);

    manager.synchronize([]);

    expect(client.send).toHaveBeenCalledTimes(2);

    expect(client.send).toHaveBeenLastCalledWith(
      JSON.stringify({
        method: "UNSUBSCRIBE",
        params: ["btcusdt@trade"],
        id: 2,
      }),
    );
  });

  it("removes a subscription after unsubscribe confirmation", () => {
    const subscribeId = 1;
    const unsubscribeId = 2;

    // Subscribe
    manager.synchronize(["BTCUSDT"]);

    manager.handleResponse(subscribeId, ["BTCUSDT"]);

    // Unsubscribe
    manager.synchronize([]);

    // Still pending — should not send another unsubscribe
    manager.synchronize([]);

    expect(client.send).toHaveBeenCalledTimes(2);

    // Binance confirms unsubscribe
    manager.handleResponse(unsubscribeId, []);

    // Now there is no active subscription
    manager.synchronize([]);

    expect(client.send).toHaveBeenCalledTimes(2);
  });

  it("resubscribes after a pending unsubscribe is confirmed", () => {
    const subscribeId = 1;
    const unsubscribeId = 2;

    // Subscribe
    manager.synchronize(["BTCUSDT"]);

    manager.handleResponse(subscribeId, ["BTCUSDT"]);

    // Unsubscribe
    manager.synchronize([]);

    // User immediately adds it back
    manager.synchronize(["BTCUSDT"]);

    // Still waiting for unsubscribe confirmation
    expect(client.send).toHaveBeenCalledTimes(2);

    // Unsubscribe is confirmed
    manager.handleResponse(unsubscribeId, ["BTCUSDT"]);

    // Manager should now subscribe again
    expect(client.send).toHaveBeenCalledTimes(3);

    expect(client.send).toHaveBeenLastCalledWith(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: ["btcusdt@trade"],
        id: 3,
      }),
    );
  });

  it("allows a subscription to be retried after an error", () => {
    const requestId = 1;

    manager.synchronize(["BTCUSDT"]);

    // Binance rejects the request
    manager.handleError(requestId);

    // The request is no longer pending, so this should retry it
    manager.synchronize(["BTCUSDT"]);

    expect(client.send).toHaveBeenCalledTimes(2);
  });

  it("resubscribes to desired symbols after reconnect", () => {
    const firstSubscribeId = 1;

    // Initial connection
    manager.synchronize(["BTCUSDT"]);

    manager.handleResponse(firstSubscribeId, ["BTCUSDT"]);

    // New WebSocket connection
    manager.onConnected(["BTCUSDT"]);

    expect(client.send).toHaveBeenCalledTimes(2);

    expect(client.send).toHaveBeenLastCalledWith(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: ["btcusdt@trade"],
        id: 2,
      }),
    );
  });
});
