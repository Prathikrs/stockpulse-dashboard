import { useApp } from '../context/AppContext';
import StockCard from './StockCard';
import PortfolioView from './PortfolioView';
import OrdersView from './OrdersView';

export default function Dashboard() {
  const { state, actions } = useApp();
  const { portfolio, activeView, subscriptions, supportedStocks, email } = state;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="header__left">
          <div className="header__logo">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M3 17L8 10L13 14L17 7L21 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="header__brand">StockPulse</span>
        </div>

        <nav className="header__nav">
          <button
            className={`header__nav-btn ${activeView === 'market' ? 'active' : ''}`}
            onClick={() => actions.setView('market')}
          >
            Market
          </button>
          <button
            className={`header__nav-btn ${activeView === 'portfolio' ? 'active' : ''}`}
            onClick={() => actions.setView('portfolio')}
          >
            Portfolio
          </button>
          <button
            className={`header__nav-btn ${activeView === 'orders' ? 'active' : ''}`}
            onClick={() => actions.setView('orders')}
          >
            Orders
          </button>
        </nav>

        <div className="header__right">
          <span className="header__status" id="connection-status">
            <span className={`status-dot ${state.connected ? 'connected' : ''}`}></span>
            <span>{state.connected ? 'Live' : 'Reconnecting...'}</span>
          </span>
          <span className="header__user">{email}</span>
          <button className="btn btn--ghost btn--xs" onClick={() => actions.logout()}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {/* Performance Metrics Bar */}
        <section className="summary-row">
          <div className="summary-card">
            <div className="summary-card__label">Net Worth</div>
            <div className="summary-card__value">${portfolio.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="summary-card__sub text-muted">Cash + Holdings</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Buying Power</div>
            <div className="summary-card__value">${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="summary-card__sub text-muted">Available Cash</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Holdings Value</div>
            <div className="summary-card__value">${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="summary-card__sub text-muted">Current Value</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Total Profit / Loss</div>
            <div className={`summary-card__value ${portfolio.totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {portfolio.totalPnl >= 0 ? '+' : ''}${portfolio.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`summary-card__sub ${portfolio.totalPnl >= 0 ? 'text-green' : 'text-red'}`}>
              {portfolio.totalPnl >= 0 ? '▲' : '▼'} {portfolio.totalPnlPct.toFixed(2)}%
            </div>
          </div>
        </section>

        {activeView === 'market' && (
          <>
            {/* Stock Chip Selector */}
            <section className="stock-chips-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Available Stocks</h2>
                  <p className="section-subtitle">Toggle subscription to track stock in real-time</p>
                </div>
              </div>
              <div className="stock-chips">
                {supportedStocks.map((stock) => {
                  const isSubbed = subscriptions.includes(stock.ticker);
                  return (
                    <div
                      key={stock.ticker}
                      className={`stock-chip ${isSubbed ? 'subscribed' : ''}`}
                      onClick={() => {
                        if (isSubbed) actions.unsubscribe(stock.ticker);
                        else actions.subscribe(stock.ticker);
                      }}
                    >
                      <span className="stock-chip__dot" style={{ backgroundColor: stock.color }}></span>
                      <span className="stock-chip__ticker">{stock.ticker}</span>
                      <span className="stock-chip__name">{stock.name}</span>
                      <span className="stock-chip__badge">Live</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Subscribed Stocks Grid */}
            <section>
              <div className="section-header">
                <h2 className="section-title">Your Live Watchlist</h2>
              </div>
              <div className="stock-grid">
                {subscriptions.map((ticker) => (
                  <StockCard key={ticker} ticker={ticker} />
                ))}
                {subscriptions.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state__icon">📈</div>
                    <p className="empty-state__title">Your Watchlist is Empty</p>
                    <p className="empty-state__desc">Toggle subscription options above to add stocks to your dashboard.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeView === 'portfolio' && <PortfolioView />}
        {activeView === 'orders' && <OrdersView />}
      </main>
    </div>
  );
}
