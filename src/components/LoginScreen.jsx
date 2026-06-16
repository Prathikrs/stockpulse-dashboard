import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { actions } = useApp();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      actions.login(email.trim());
    }
  };

  return (
    <section className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 17L8 10L13 14L17 7L21 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="login-title">StockPulse</h1>
        <p className="login-subtitle">Professional real-time trading dashboard</p>

        <div className="login-features">
          <div className="login-feature">
            <span className="login-feature__icon">📈</span>
            Live Prices
          </div>
          <div className="login-feature">
            <span className="login-feature__icon">💰</span>
            Buy & Sell
          </div>
          <div className="login-feature">
            <span className="login-feature__icon">📊</span>
            Portfolio
          </div>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="input-group">
            <label htmlFor="email-input">Email Address</label>
            <input
              type="email"
              id="email-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn--primary btn--full" id="login-btn">
            <span>Sign In to Dashboard</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <p className="login-hint">
          Try logging in with two different emails in separate browser tabs to see independent real-time updates.
        </p>
      </div>
    </section>
  );
}
