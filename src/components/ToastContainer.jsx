import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

function ToastItem({ toast, onRemove }) {
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Start exit animation after 3.5 seconds
    const exitTimer = setTimeout(() => {
      setIsRemoving(true);
    }, 3500);

    // Call onRemove after exit animation completes (4 seconds total)
    const removeTimer = setTimeout(() => {
      onRemove();
    }, 3900);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onRemove]);

  const getIcon = () => {
    switch (toast.toastType) {
      case 'success':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  return (
    <div
      className={`toast toast--${toast.toastType || 'info'} ${isRemoving ? 'removing' : ''}`}
      onClick={() => {
        setIsRemoving(true);
        setTimeout(onRemove, 300);
      }}
    >
      <span className="toast__icon">{getIcon()}</span>
      <span className="toast__msg">{toast.message}</span>
    </div>
  );
}

export default function ToastContainer() {
  const { state, actions } = useApp();
  const { toasts } = state;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => actions.removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
