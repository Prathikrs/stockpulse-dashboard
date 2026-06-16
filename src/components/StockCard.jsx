import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function StockCard({ ticker }) {
  const { state, actions } = useApp();
  const canvasRef = useRef(null);

  const stockInfo = state.prices[ticker];
  const stockMeta = state.supportedStocks.find((s) => s.ticker === ticker);

  useEffect(() => {
    if (!canvasRef.current || !stockInfo || !stockInfo.history || stockInfo.history.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 4;
    const history = stockInfo.history;

    const min = Math.min(...history) * 0.999;
    const max = Math.max(...history) * 1.001;
    const range = max - min || 1;

    ctx.clearRect(0, 0, w, h);

    const isUp = stockInfo.dayChange >= 0;
    const color = isUp ? '#10b981' : '#ef4444';

    // Draw area gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    history.forEach((val, i) => {
      const x = padding + (i / (history.length - 1)) * (w - padding * 2);
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    history.forEach((val, i) => {
      const x = padding + (i / (history.length - 1)) * (w - padding * 2);
      const y = h - padding - ((val - min) / range) * (h - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw end dot
    const lastX = padding + (w - padding * 2);
    const lastY = h - padding - ((history[history.length - 1] - min) / range) * (h - padding * 2);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [stockInfo]);

  if (!stockInfo || !stockMeta) {
    return (
      <div className="stock-card" style={{ '--card-color': stockMeta?.color || '#ccc' }}>
        <div className="stock-card__header">
          <div className="stock-card__info">
            <span className="stock-card__ticker">{ticker}</span>
          </div>
        </div>
        <div>Loading real-time data...</div>
      </div>
    );
  }

  const isUp = stockInfo.dayChange >= 0;

  return (
    <div className="stock-card" style={{ '--card-color': stockMeta.color }}>
      <div className="stock-card__header">
        <div className="stock-card__info">
          <div className="stock-card__ticker">
            <span className="stock-card__ticker-dot" style={{ backgroundColor: stockMeta.color }}></span>
            {ticker}
          </div>
          <div className="stock-card__name">{stockMeta.name}</div>
        </div>
        <button
          className="stock-card__unsub"
          style={{
            background: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--text-muted)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.7rem',
            cursor: 'pointer',
          }}
          onClick={() => actions.unsubscribe(ticker)}
        >
          Remove
        </button>
      </div>

      <div className="stock-card__price-row">
        <span className="stock-card__price">${stockInfo.price.toFixed(2)}</span>
        <span className={`stock-card__change ${isUp ? 'up' : 'down'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(stockInfo.dayChangePct).toFixed(2)}%
        </span>
      </div>

      <div className="stock-card__detail">
        {isUp ? '+' : ''}${stockInfo.dayChange.toFixed(2)} Today
      </div>

      <div className="stock-card__stats">
        <div className="stock-card__stat">
          <span className="stock-card__stat-label">High</span>
          <span className="stock-card__stat-value">${stockInfo.high.toFixed(2)}</span>
        </div>
        <div className="stock-card__stat">
          <span className="stock-card__stat-label">Low</span>
          <span className="stock-card__stat-value">${stockInfo.low.toFixed(2)}</span>
        </div>
        <div className="stock-card__stat">
          <span className="stock-card__stat-label">Volume</span>
          <span className="stock-card__stat-value">{(stockInfo.volume / 1000000).toFixed(2)}M</span>
        </div>
      </div>

      <div className="stock-card__chart">
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="stock-card__trade-btns">
        <button className="btn btn--buy" onClick={() => actions.openTrade(ticker, 'buy')}>
          Buy
        </button>
        <button className="btn btn--sell" onClick={() => actions.openTrade(ticker, 'sell')}>
          Sell
        </button>
      </div>
    </div>
  );
}
