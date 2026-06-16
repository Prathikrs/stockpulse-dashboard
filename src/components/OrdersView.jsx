import { useApp } from '../context/AppContext';

export default function OrdersView() {
  const { state } = useApp();
  const { orders } = state;

  return (
    <section className="orders-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">Order History</h2>
          <p className="section-subtitle">A record of all your executed trades</p>
        </div>
      </div>

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Ticker</th>
              <th>Action</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const date = new Date(order.timestamp).toLocaleString();
              return (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{date}</td>
                  <td style={{ fontWeight: 700 }}>{order.ticker}</td>
                  <td>
                    <span className={`order-type ${order.type.toLowerCase()}`}>
                      {order.type}
                    </span>
                  </td>
                  <td>{order.qty}</td>
                  <td>${order.price.toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}

            {orders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No orders have been executed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
