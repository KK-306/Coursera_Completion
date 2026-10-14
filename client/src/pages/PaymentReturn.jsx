import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE_URL || 'https://coursera-completion-backend.onrender.com';

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const [state, setState] = useState({
    loading: true,
    status: 'Checking your payment...',
    paid: false,
  });

  useEffect(() => {
    const orderId = params.get('order_id');
    if (!orderId) {
      setState({ loading: false, status: 'No order reference was provided.', paid: false });
      return;
    }

    fetch(`${API}/api/payments/status/${encodeURIComponent(orderId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not verify payment status.');
        return data;
      })
      .then((data) => setState({
        loading: false,
        status: data.status === 'PAID' ? 'Payment confirmed' : `Payment status: ${data.status}`,
        paid: data.status === 'PAID',
      }))
      .catch(() => setState({
        loading: false,
        status: 'We could not confirm your payment yet. Please contact support with your order reference.',
        paid: false,
      }));
  }, [params]);

  return (
    <section className="return-page">
      <div className="return-card">
        <div className={`return-icon ${state.paid ? 'success' : ''}`}>
          {state.loading ? '...' : state.paid ? 'OK' : 'i'}
        </div>
        <h1>{state.status}</h1>
        <p>
          {state.paid
            ? 'Thank you. Keep your order reference. The next step is your Coursera completion support plan.'
            : 'Do not pay again immediately if money was debited. Check with your bank and contact support if the status remains unclear.'}
        </p>
        <Link className="button button-primary" to="/">Back to homepage <span aria-hidden="true">-&gt;</span></Link>
      </div>
    </section>
  );
}
