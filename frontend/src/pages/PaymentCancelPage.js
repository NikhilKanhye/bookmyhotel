import React from 'react';
import { Link } from 'react-router-dom';

function PaymentCancelPage() {
  return (
    <div className="text-center py-5">
      <div className="alert alert-danger p-5">
        <h2>❌ Payment Cancelled</h2>
        <p>Your payment was cancelled. No charges were made.</p>
        <Link to="/hotels" className="btn btn-primary mt-3">Browse Hotels</Link>
        <Link to="/" className="btn btn-secondary mt-3 ms-2">Go Home</Link>
      </div>
    </div>
  );
}

export default PaymentCancelPage;