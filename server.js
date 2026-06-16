import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// ═══════════════════════════════════════════════════════════════════════════
//  SUPPORTED STOCKS
// ═══════════════════════════════════════════════════════════════════════════
const SUPPORTED_STOCKS = ['GOOG', 'TSLA', 'AMZN', 'META', 'NVDA'];

const STOCK_META = {
  GOOG: { name: 'Alphabet Inc.', basePrice: 178.25, color: '#4285F4', sector: 'Technology' },
  TSLA: { name: 'Tesla Inc.', basePrice: 248.50, color: '#E31937', sector: 'Automotive' },
  AMZN: { name: 'Amazon.com Inc.', basePrice: 186.75, color: '#FF9900', sector: 'E-Commerce' },
  META: { name: 'Meta Platforms Inc.', basePrice: 505.30, color: '#0668E1', sector: 'Social Media' },
  NVDA: { name: 'NVIDIA Corporation', basePrice: 135.40, color: '#76B900', sector: 'Semiconductors' },
};

// ═══════════════════════════════════════════════════════════════════════════
//  IN-MEMORY STATE
// ═══════════════════════════════════════════════════════════════════════════
// users: Map<email, { subscriptions: Set, portfolio: { cash, holdings: { ticker: { qty, avgPrice } } }, orders: [] }>
const users = new Map();

const INITIAL_CASH = 100000; // $100,000 starting balance

function getOrCreateUser(email) {
  if (!users.has(email)) {
    users.set(email, {
      subscriptions: new Set(),
      portfolio: {
        cash: INITIAL_CASH,
        holdings: {},
      },
      orders: [],
    });
  }
  return users.get(email);
}

// Current simulated prices & history
const currentPrices = {};
const priceHistory = {};

SUPPORTED_STOCKS.forEach((ticker) => {
  currentPrices[ticker] = STOCK_META[ticker].basePrice;
  priceHistory[ticker] = [STOCK_META[ticker].basePrice];
});

// ═══════════════════════════════════════════════════════════════════════════
//  PRICE SIMULATION
// ═══════════════════════════════════════════════════════════════════════════
function simulatePriceChange(ticker) {
  const current = currentPrices[ticker];
  const changePct = (Math.random() - 0.48) * 0.03;
  currentPrices[ticker] = Math.round(Math.max(1, current * (1 + changePct)) * 100) / 100;

  if (priceHistory[ticker].length >= 60) {
    priceHistory[ticker].shift();
  }
  priceHistory[ticker].push(currentPrices[ticker]);
}

setInterval(() => {
  SUPPORTED_STOCKS.forEach(simulatePriceChange);
  broadcastPrices();
}, 1000);

// ═══════════════════════════════════════════════════════════════════════════
//  WEBSOCKET HANDLING
// ═══════════════════════════════════════════════════════════════════════════
const wsClients = new Map();

function buildPricePayload(subscriptions) {
  const payload = {};
  subscriptions.forEach((ticker) => {
    const hist = priceHistory[ticker];
    const prevPrice = hist.length >= 2 ? hist[hist.length - 2] : currentPrices[ticker];
    const change = currentPrices[ticker] - prevPrice;
    const changePct = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
    const dayChange = currentPrices[ticker] - STOCK_META[ticker].basePrice;
    const dayChangePct = STOCK_META[ticker].basePrice !== 0 ? (dayChange / STOCK_META[ticker].basePrice) * 100 : 0;

    payload[ticker] = {
      price: currentPrices[ticker],
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      dayChange: Math.round(dayChange * 100) / 100,
      dayChangePct: Math.round(dayChangePct * 100) / 100,
      history: [...priceHistory[ticker]],
      meta: STOCK_META[ticker],
      high: Math.max(...priceHistory[ticker]),
      low: Math.min(...priceHistory[ticker]),
      volume: Math.floor(Math.random() * 5000000) + 1000000,
    };
  });
  return payload;
}

function buildPortfolioPayload(user) {
  const holdings = {};
  let totalValue = 0;
  let totalInvested = 0;

  Object.entries(user.portfolio.holdings).forEach(([ticker, h]) => {
    if (h.qty > 0) {
      const currentPrice = currentPrices[ticker];
      const marketValue = currentPrice * h.qty;
      const invested = h.avgPrice * h.qty;
      const pnl = marketValue - invested;
      const pnlPct = invested !== 0 ? (pnl / invested) * 100 : 0;

      holdings[ticker] = {
        qty: h.qty,
        avgPrice: h.avgPrice,
        currentPrice,
        marketValue: Math.round(marketValue * 100) / 100,
        pnl: Math.round(pnl * 100) / 100,
        pnlPct: Math.round(pnlPct * 100) / 100,
        meta: STOCK_META[ticker],
      };

      totalValue += marketValue;
      totalInvested += invested;
    }
  });

  return {
    cash: Math.round(user.portfolio.cash * 100) / 100,
    holdings,
    totalValue: Math.round(totalValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalPnl: Math.round((totalValue - totalInvested) * 100) / 100,
    totalPnlPct: totalInvested !== 0 ? Math.round(((totalValue - totalInvested) / totalInvested) * 10000) / 100 : 0,
    netWorth: Math.round((user.portfolio.cash + totalValue) * 100) / 100,
  };
}

function broadcastPrices() {
  wsClients.forEach((clientData, ws) => {
    if (ws.readyState !== ws.OPEN || !clientData.email) return;

    const user = users.get(clientData.email);
    if (!user) return;

    if (user.subscriptions.size > 0) {
      ws.send(JSON.stringify({
        type: 'price_update',
        data: buildPricePayload(user.subscriptions),
        portfolio: buildPortfolioPayload(user),
      }));
    }
  });
}

wss.on('connection', (ws) => {
  console.log('WebSocket connected');
  wsClients.set(ws, { email: null });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    const clientData = wsClients.get(ws);

    switch (msg.type) {
      // ─── LOGIN ─────────────────────────────────────────────────────────
      case 'login': {
        const email = (msg.email || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid email address.' }));
          return;
        }
        const user = getOrCreateUser(email);
        clientData.email = email;

        ws.send(JSON.stringify({
          type: 'login_success',
          email,
          subscriptions: [...user.subscriptions],
          supportedStocks: SUPPORTED_STOCKS.map((t) => ({ ticker: t, ...STOCK_META[t] })),
          portfolio: buildPortfolioPayload(user),
          orders: user.orders.slice(-50),
        }));

        // Send initial prices
        if (user.subscriptions.size > 0) {
          ws.send(JSON.stringify({
            type: 'price_update',
            data: buildPricePayload(user.subscriptions),
            portfolio: buildPortfolioPayload(user),
          }));
        }
        break;
      }

      // ─── SUBSCRIBE ─────────────────────────────────────────────────────
      case 'subscribe': {
        if (!clientData.email) {
          ws.send(JSON.stringify({ type: 'error', message: 'Please login first.' }));
          return;
        }
        const ticker = (msg.ticker || '').toUpperCase();
        if (!SUPPORTED_STOCKS.includes(ticker)) {
          ws.send(JSON.stringify({ type: 'error', message: `Unsupported stock: ${ticker}` }));
          return;
        }
        const user = users.get(clientData.email);
        user.subscriptions.add(ticker);

        ws.send(JSON.stringify({
          type: 'subscribed',
          ticker,
          subscriptions: [...user.subscriptions],
        }));
        break;
      }

      // ─── UNSUBSCRIBE ───────────────────────────────────────────────────
      case 'unsubscribe': {
        if (!clientData.email) {
          ws.send(JSON.stringify({ type: 'error', message: 'Please login first.' }));
          return;
        }
        const ticker = (msg.ticker || '').toUpperCase();
        const user = users.get(clientData.email);
        user.subscriptions.delete(ticker);

        ws.send(JSON.stringify({
          type: 'unsubscribed',
          ticker,
          subscriptions: [...user.subscriptions],
        }));
        break;
      }

      // ─── BUY ───────────────────────────────────────────────────────────
      case 'buy': {
        if (!clientData.email) {
          ws.send(JSON.stringify({ type: 'error', message: 'Please login first.' }));
          return;
        }
        const ticker = (msg.ticker || '').toUpperCase();
        const qty = parseInt(msg.qty, 10);

        if (!SUPPORTED_STOCKS.includes(ticker) || !qty || qty <= 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid ticker or quantity.' }));
          return;
        }

        const price = currentPrices[ticker];
        const totalCost = price * qty;
        const user = users.get(clientData.email);

        if (totalCost > user.portfolio.cash) {
          ws.send(JSON.stringify({ type: 'error', message: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${user.portfolio.cash.toFixed(2)}.` }));
          return;
        }

        // Execute buy
        user.portfolio.cash -= totalCost;
        if (!user.portfolio.holdings[ticker]) {
          user.portfolio.holdings[ticker] = { qty: 0, avgPrice: 0 };
        }
        const h = user.portfolio.holdings[ticker];
        const totalShares = h.qty + qty;
        h.avgPrice = (h.avgPrice * h.qty + price * qty) / totalShares;
        h.qty = totalShares;

        const order = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          type: 'BUY',
          ticker,
          qty,
          price,
          total: Math.round(totalCost * 100) / 100,
          timestamp: new Date().toISOString(),
        };
        user.orders.push(order);

        // Auto-subscribe when buying
        user.subscriptions.add(ticker);

        ws.send(JSON.stringify({
          type: 'order_executed',
          order,
          portfolio: buildPortfolioPayload(user),
          subscriptions: [...user.subscriptions],
        }));
        break;
      }

      // ─── SELL ──────────────────────────────────────────────────────────
      case 'sell': {
        if (!clientData.email) {
          ws.send(JSON.stringify({ type: 'error', message: 'Please login first.' }));
          return;
        }
        const ticker = (msg.ticker || '').toUpperCase();
        const qty = parseInt(msg.qty, 10);

        if (!SUPPORTED_STOCKS.includes(ticker) || !qty || qty <= 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid ticker or quantity.' }));
          return;
        }

        const user = users.get(clientData.email);
        const holding = user.portfolio.holdings[ticker];

        if (!holding || holding.qty < qty) {
          ws.send(JSON.stringify({ type: 'error', message: `Insufficient shares. You hold ${holding ? holding.qty : 0} shares of ${ticker}.` }));
          return;
        }

        const price = currentPrices[ticker];
        const totalRevenue = price * qty;

        // Execute sell
        user.portfolio.cash += totalRevenue;
        holding.qty -= qty;
        if (holding.qty === 0) {
          holding.avgPrice = 0;
        }

        const order = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          type: 'SELL',
          ticker,
          qty,
          price,
          total: Math.round(totalRevenue * 100) / 100,
          timestamp: new Date().toISOString(),
        };
        user.orders.push(order);

        ws.send(JSON.stringify({
          type: 'order_executed',
          order,
          portfolio: buildPortfolioPayload(user),
          subscriptions: [...user.subscriptions],
        }));
        break;
      }
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    wsClients.delete(ws);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  SERVE STATIC (production)
// ═══════════════════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  🚀 StockPulse backend running on http://localhost:${PORT}\n`);
});
