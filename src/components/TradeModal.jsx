import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TradeModal() {
  const { state, actions } = useApp();
  const { tradeModal, prices, portfolio, supportedStocks } = state;

  const [qtyStr, setQtyStr] = useState('10');

  if (!tradeModal) return null;

  const { ticker, side } = tradeModal;
  const stockMeta = supportedStocks.find((s) => s.ticker === ticker);
  const stockPrice = prices[ticker]?.price || stockMeta?.basePrice || 0;

  const qty = parseInt(qtyStr, 10) || 0;
  const totalCost = stockPrice * qty;

  const holding = portfolio.holdings[ticker];
  const maxSell = holding ? holding.qty : 0;
  const maxBuy = Math.floor(portfolio.cash / stockPrice);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (qty <= 0) {
      actions.showToast('Please enter a valid quantity.', 'error');
      return;
    }

    if (side === 'buy') {
      if (totalCost > portfolio.cash) {
        actions.showToast('Insufficient funds.', 'error');
        return;
      }
      actions.buy(ticker, qty);
    } else {
      if (qty > maxSell) {
        actions.showToast('Insufficient shares to sell.', 'error');
        return;
      }
      actions.sell(ticker, qty);
    }
    actions.closeTrade();
  };

  return (
    <div className="modal-overlay" onClick={() => actions.closeTrade()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title" style={{ textTransform: 'capitalize' }}>
            {side} {ticker}
          </h3>
          <button className="modal__close" onClick={() => actions.closeTrade()}>
            &times;
          </button>
        </div>

        <div className="modal__stock-info">
          <span className="modal__stock-dot" style={{ backgroundColor: stockMeta?.color || '#ccc' }}></span>
          <div>
            <div className="modal__stock-ticker">{ticker}</div>
            <div className="modal__stock-name">{stockMeta?.name}</div>
          </div>
          <div className="modal__stock-price">${stockPrice.toFixed(2)}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__field">
            <label htmlFor="trade-qty">Shares Quantity</label>
            <input
              type="number"
              id="trade-qty"
              min="1"
              step="1"
              value={qtyStr}
              onChange={(e) => setQtyStr(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="modal__summary">
            <div className="modal__summary-row">
              <span className="modal__summary-label">
                {side === 'buy' ? 'Buying Power' : 'Available Position'}
              </span>
              <span className="modal__summary-value">
                {side === 'buy'
                  ? `$${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                  : `${maxSell} shares`}
              </span>
            </div>
            <div className="modal__summary-row">
              <span className="modal__summary-label">Estimated Price</span>
              <span className="modal__summary-value">${stockPrice.toFixed(2)}</span>
            </div>
            <div className="modal__summary-row total">
              <span className="modal__summary-label">Estimated Total</span>
              <span className="modal__summary-value">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn--ghost"
              style={{ flex: 1 }}
              onClick={() => actions.closeTrade()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${side === 'buy' ? 'btn--buy' : 'btn--sell'}`}
              style={{ flex: 2 }}
              disabled={qty <= 0 || (side === 'buy' ? totalCost > portfolio.cash : qty > maxSell)}
            >
              Confirm {side} Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
