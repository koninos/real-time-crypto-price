import { WebSocketClient } from "./webSocketClient";

describe("WebSocketClient", () => {
  it("creates a WebSocket connection", () => {
    const WebSocketMock = jest.fn();

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();

    expect(WebSocketMock).toHaveBeenCalledWith("wss://example.com");
  });

  it("calls the onOpen handler when the WebSocket opens", () => {
    let onOpen: ((event: Event) => void) | undefined;

    const WebSocketMock = jest.fn(() => ({
      set onopen(handler: (event: Event) => void) {
        onOpen = handler;
      },
    }));

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    const handleOpen = jest.fn();

    client.onOpen(handleOpen);
    client.connect();

    const event = new Event("open");
    onOpen?.(event);

    expect(handleOpen).toHaveBeenCalledWith(event);
  });

  it("calls the onMessage handler when a message is received", () => {
    let onMessage: ((event: MessageEvent) => void) | undefined;

    const WebSocketMock = jest.fn(() => ({
      set onmessage(handler: (event: MessageEvent) => void) {
        onMessage = handler;
      },
    }));

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");
    const handleMessage = jest.fn();

    client.onMessage(handleMessage);
    client.connect();

    const event = new MessageEvent("message", {
      data: '{"price":"100"}',
    });

    onMessage?.(event);

    expect(handleMessage).toHaveBeenCalledWith(event);
  });

  it("calls the onError handler when a WebSocket error occurs", () => {
    let onError: ((event: Event) => void) | undefined;

    const WebSocketMock = jest.fn(() => ({
      set onerror(handler: (event: Event) => void) {
        onError = handler;
      },
    }));

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");
    const handleError = jest.fn();

    client.onError(handleError);
    client.connect();

    const event = new Event("error");
    onError?.(event);

    expect(handleError).toHaveBeenCalledWith(event);
  });

  it("calls the onClose handler when the WebSocket closes", () => {
    let onClose: ((event: CloseEvent) => void) | undefined;

    const WebSocketMock = jest.fn(() => ({
      set onclose(handler: (event: CloseEvent) => void) {
        onClose = handler;
      },
    }));

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");
    const handleClose = jest.fn();

    client.onClose(handleClose);
    client.connect();

    const event = new CloseEvent("close", {
      code: 1000,
      reason: "Normal closure",
    });

    onClose?.(event);

    expect(handleClose).toHaveBeenCalledWith(event);
  });

  it("sends a message when the WebSocket is connected", () => {
    const send = jest.fn();

    const WebSocketMock = jest.fn(() => ({
      readyState: WebSocket.OPEN,
      send,
    }));

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();
    client.send("hello");

    expect(send).toHaveBeenCalledWith("hello");
  });

  it("throws when sending while the WebSocket is not connected", () => {
    const WebSocketMock = jest.fn(() => ({
      readyState: 3,
      send: jest.fn(),
    }));

    Object.assign(WebSocketMock, {
      OPEN: 1,
      CLOSED: 3,
    });

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();

    expect(() => client.send("hello")).toThrow("WebSocket is not connected");
  });

  it("reconnects after an unexpected close", () => {
    jest.useFakeTimers();

    const WebSocketMock = jest.fn(() => ({
      readyState: 1,
      close: jest.fn(),
    }));

    Object.assign(WebSocketMock, {
      OPEN: 1,
    });

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();

    expect(WebSocketMock).toHaveBeenCalledTimes(1);

    // Get the onclose handler assigned by WebSocketClient
    const firstWebSocket = WebSocketMock.mock.results[0].value;

    firstWebSocket.onclose(new CloseEvent("close"));

    // Reconnection should not happen immediately
    expect(WebSocketMock).toHaveBeenCalledTimes(1);

    // Advance the reconnect timer by 1 second
    jest.advanceTimersByTime(1000);

    expect(WebSocketMock).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it("reconnects after an unexpected close", () => {
    jest.useFakeTimers();

    const WebSocketMock = jest.fn(() => ({
      readyState: 1,
      close: jest.fn(),
    }));

    Object.assign(WebSocketMock, {
      OPEN: 1,
    });

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();

    expect(WebSocketMock).toHaveBeenCalledTimes(1);

    const firstWebSocket = WebSocketMock.mock.results[0].value;

    firstWebSocket.onclose(new CloseEvent("close"));

    expect(WebSocketMock).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);

    expect(WebSocketMock).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it("closes the WebSocket when disconnected", () => {
    const close = jest.fn();

    const WebSocketMock = jest.fn(() => ({
      readyState: 1,
      close,
    }));

    Object.assign(WebSocketMock, {
      OPEN: 1,
    });

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();
    client.disconnect();

    expect(close).toHaveBeenCalled();
  });

  it("does not reconnect after a manual disconnect", () => {
    jest.useFakeTimers();

    const close = jest.fn();

    const WebSocketMock = jest.fn(() => ({
      readyState: 1,
      close,
    }));

    Object.assign(WebSocketMock, {
      OPEN: 1,
    });

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();

    const webSocket = WebSocketMock.mock.results[0].value;

    client.disconnect();

    webSocket.onclose(new CloseEvent("close"));

    jest.advanceTimersByTime(1000);

    expect(WebSocketMock).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("returns true when the WebSocket is connected", () => {
    const WebSocketMock = jest.fn(() => ({
      readyState: 1,
    }));

    Object.assign(WebSocketMock, {
      OPEN: 1,
    });

    Object.assign(globalThis, {
      WebSocket: WebSocketMock,
    });

    const client = new WebSocketClient("wss://example.com");

    client.connect();

    expect(client.isConnected).toBe(true);
  });
});
