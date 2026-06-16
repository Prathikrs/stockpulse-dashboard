import { useApp } from '../context/AppContext';

export default function PortfolioView() {
  const { state, actions } = useApp();
  const { portfolio } = state;
  const holdings = Object.entries(portfolio.holdings);

  return (
    <div className="portfolio-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Asset Holdings</h2>
          <p className="section-subtitle">Manage your open positions and performance metrics</p>
        </div>
      </div>

      <div className="portfolio-grid">
        {holdings.map(([ticker, holding]) => {
          if (holding.qty <= 0) return null;
          const isPnlPositive = holding.pnl >= 0;

          return (
            <div key={ticker} className="holding-card" style={{ borderLeft: `4px solid ${holding.meta.color}` }}>
              <div className="holding-card__header">
                <div className="holding-card__ticker">
                  <span className="holding-card__dot" style={{ backgroundColor: holding.meta.color }} />
                  {ticker}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    {holding.meta.name}
                  </span>
                </div>
                <div className={`holding-card__pnl ${isPnlPositive ? 'positive' : 'negative'}`}>
                  {isPnlPositive ? '+' : ''}{holding.pnlPct.toFixed(2)}%
                </div>
              </div>

              <div className="holding-card__body">
                <div className="holding-card__field">
                  <span className="holding-card__label">Quantity</span>
                  <span className="holding-card__value">{holding.qty} shares</span>
                </div>
                <div className="holding-card__field">
                  <span className="holding-card__label">Market Value</span>
                  <span className="holding-card__value">${holding.marketValue.toLocaleString()}</span>
                </div>
                <div className="holding-card__field">
                  <span className="holding-card__label">Avg Price</span>
                  <span className="holding-card__value">${holding.avgPrice.toFixed(2)}</span>
                </div>
                <div className="holding-card__field">
                  <span className="holding-card__label">Current Price</span>
                  <span className="holding-card__value">${holding.currentPrice.toFixed(2)}</span>
                </div>
                <div className="holding-card__field" style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                  <span className="holding-card__label">Total Profit / Loss</span>
                  <span className={`holding-card__value ${isPnlPositive ? 'text-green' : 'text-red'}`} style={{ fontSize: '1rem' }}>
                    {isPnlPositive ? '+' : ''}${holding.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="holding-card__actions">
                <button className="btn btn--buy btn--xs" onClick={() => actions.openTrade(ticker, 'buy')}>
                  Buy More
                </button>
                <button className="btn btn--sell btn--xs" onClick={() => actions.openTrade(ticker, 'sell')}>
                  Sell
                </button>
              </div>
            </div>
          );
        })}

        {holdings.filter(([_, h]) => h.qty > 0).length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">💼</div>
            <p className="empty-state__title">No Holdings Yet</p>
            <p className="empty-state__desc">You do not own any stock positions yet. Visit the market tab to make your first trade.</p>
          </div>
        )}
      </div>
    </div>
  );
}
