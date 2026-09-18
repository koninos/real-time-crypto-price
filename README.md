# Real-Time Crypto Prices

A small React and TypeScript application that displays real-time cryptocurrency prices using the Binance WebSocket API.

[Live Demo](https://real-time-crypto-price-eight.vercel.app/)

## Features

- Real-time cryptocurrency trade prices
- Dynamic subscription and unsubscription to trading pairs
- WebSocket connection status
- Automatic reconnection with exponential backoff
- Automatic restoration of subscriptions after reconnecting
- Handling of Binance subscription confirmations and errors
- Price direction indicators

## Tech Stack

- React
- TypeScript
- Native WebSocket API
- Vite
- CSS
- Vercel

No Binance API key is required. The application uses Binance's public market-data WebSocket streams.

## Architecture

The application separates the WebSocket infrastructure from Binance-specific subscription logic and the React UI.

```text
React UI
   ↓
BinanceSubscriptionManager
   ↓
Binance Service
   ↓
WebSocketClient
   ↓
Binance WebSocket API
```

### WebSocketClient

`WebSocketClient` is responsible for the generic WebSocket lifecycle:

- Opening and closing connections
- Sending messages
- Handling WebSocket events
- Detecting unexpected disconnections
- Reconnecting automatically
- Applying exponential backoff between failed connection attempts

It contains no Binance-specific logic.

### Binance Service

The Binance service contains the protocol-specific operations for subscribing and unsubscribing to Binance streams.

This keeps Binance message construction outside the generic WebSocket client.

### BinanceSubscriptionManager

The subscription manager keeps track of the application's desired and confirmed subscriptions.

It maintains:

- Active subscriptions
- Pending subscription/unsubscription requests
- Binance request IDs

A subscription isn't considered active until Binance confirms the request.

This also allows rapid subscription changes to be handled without relying on optimistic state updates.

## Getting Started

### Requirements

- Node.js
- npm

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

### Build

Create a production build:

```bash
npm run build
```
### Test

Run tests:

```bash
npm run test
```

### Lint

Run ESLint:

```bash
npm run lint
```

### Preview

Preview the production build locally:

```bash
npm run preview
```
