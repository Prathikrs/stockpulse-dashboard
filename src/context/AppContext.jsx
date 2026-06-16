import { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
  isLoggedIn: false,
  email: '',
  connected: false,
  subscriptions: [],
  supportedStocks: [],
  prices: {},
  portfolio: { cash: 0, holdings: {}, totalValue: 0, totalPnl: 0, totalPnlPct: 0, netWorth: 0, totalInvested: 0 },
  orders: [],
  toasts: [],
  activeView: 'market', // 'market' | 'portfolio' | 'orders'
  tradeModal: null, // null | { ticker, side: 'buy'|'sell' }
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoggedIn: true,
        email: action.payload.email,
        subscriptions: action.payload.subscriptions,
        supportedStocks: action.payload.supportedStocks,
        portfolio: action.payload.portfolio,
        orders: action.payload.orders || [],
      };

    case 'LOGOUT':
      return { ...initialState };

    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };

    case 'PRICE_UPDATE':
      return {
        ...state,
        prices: action.payload.data,
        portfolio: action.payload.portfolio || state.portfolio,
      };

    case 'ORDER_EXECUTED':
      return {
        ...state,
        portfolio: action.payload.portfolio,
        orders: [...state.orders, action.payload.order],
        subscriptions: action.payload.subscriptions || state.subscriptions,
      };

    case 'ADD_TOAST': {
      const toast = { id: Date.now() + Math.random(), ...action.payload };
      return { ...state, toasts: [...state.toasts, toast] };
    }

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    case 'SET_VIEW':
      return { ...state, activeView: action.payload };

    case 'OPEN_TRADE':
      return { ...state, tradeModal: action.payload };

    case 'CLOSE_TRADE':
      return { ...state, tradeModal: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    dispatch({ type: 'ADD_TOAST', payload: { message, toastType: type } });
  }, []);

  const connectWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    // In dev connect to Vite proxy, in prod connect directly
    const wsUrl = import.meta.env.DEV
      ? `${protocol}//${location.hostname}:3001`
      : `${protocol}//${location.host}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onclose = () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
      reconnectRef.current = setTimeout(connectWS, 2500);
    };

    ws.onerror = () => ws.close();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'login_success':
          dispatch({ type: 'LOGIN_SUCCESS', payload: msg });
          break;
        case 'subscribed':
          dispatch({ type: 'SET_SUBSCRIPTIONS', payload: msg.subscriptions });
          showToast(`Subscribed to ${msg.ticker}`, 'success');
          break;
        case 'unsubscribed':
          dispatch({ type: 'SET_SUBSCRIPTIONS', payload: msg.subscriptions });
          showToast(`Unsubscribed from ${msg.ticker}`, 'info');
          break;
        case 'price_update':
          dispatch({ type: 'PRICE_UPDATE', payload: msg });
          break;
        case 'order_executed':
          dispatch({ type: 'ORDER_EXECUTED', payload: msg });
          showToast(`${msg.order.type} ${msg.order.qty} ${msg.order.ticker} @ $${msg.order.price.toFixed(2)}`, msg.order.type === 'BUY' ? 'success' : 'info');
          break;
        case 'error':
          showToast(msg.message, 'error');
          break;
      }
    };
  }, [showToast]);

  useEffect(() => {
    connectWS();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWS]);

  const actions = {
    login: (email) => send({ type: 'login', email }),
    logout: () => {
      dispatch({ type: 'LOGOUT' });
      if (wsRef.current) wsRef.current.close();
      setTimeout(connectWS, 100);
    },
    subscribe: (ticker) => send({ type: 'subscribe', ticker }),
    unsubscribe: (ticker) => send({ type: 'unsubscribe', ticker }),
    buy: (ticker, qty) => send({ type: 'buy', ticker, qty }),
    sell: (ticker, qty) => send({ type: 'sell', ticker, qty }),
    setView: (view) => dispatch({ type: 'SET_VIEW', payload: view }),
    openTrade: (ticker, side) => dispatch({ type: 'OPEN_TRADE', payload: { ticker, side } }),
    closeTrade: () => dispatch({ type: 'CLOSE_TRADE' }),
    showToast,
    removeToast: (id) => dispatch({ type: 'REMOVE_TOAST', payload: id }),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
