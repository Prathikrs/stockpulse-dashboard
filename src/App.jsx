import { useApp } from './context/AppContext'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import TradeModal from './components/TradeModal'
import ToastContainer from './components/ToastContainer'
import './App.css'

function App() {
  const { state } = useApp();

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="bg-grid" />
      <div className="bg-glow bg-glow--1" />
      <div className="bg-glow bg-glow--2" />
      <div className="bg-glow bg-glow--3" />

      {state.isLoggedIn ? <Dashboard /> : <LoginScreen />}
      {state.tradeModal && <TradeModal />}
      <ToastContainer />
    </div>
  );
}

export default App;
