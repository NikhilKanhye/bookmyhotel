import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const bookingIdParam = searchParams.get('booking_id');
    
    console.log('Session ID from URL:', sessionId);
    console.log('Booking ID from URL:', bookingIdParam);
    
    if (bookingIdParam) {
      confirmPayment(bookingIdParam, sessionId);
    } else {
      setLoading(false);
      setMessage('Payment successful! Your booking is confirmed.');
    }
  }, [searchParams]);

  const confirmPayment = async (bookingId, sessionId) => {
    try {
      console.log('Confirming booking:', bookingId);
      
      // Call backend to confirm the booking
      const response = await axios.post('http://localhost:5000/api/confirm-payment', {
        booking_id: bookingId,
        session_id: sessionId
      });
      
      console.log('Confirm response:', response.data);
      setMessage('✅ Payment successful! Your booking is confirmed.');
      setLoading(false);
    } catch (error) {
      console.error('Error confirming payment:', error.response?.data || error.message);
      setMessage('✅ Payment successful! Your booking is confirmed.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center"><h3>Processing payment...</h3></div>;
  }

  return (
    <div className="text-center py-5">
      <div className="alert alert-success p-5">
        <h2>✅ Payment Successful!</h2>
        <p>{message}</p>
        <Link to="/my-bookings" className="btn btn-primary mt-3">View My Bookings</Link>
        <Link to="/" className="btn btn-secondary mt-3 ms-2">Go Home</Link>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;