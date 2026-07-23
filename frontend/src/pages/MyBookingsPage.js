import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const userId = localStorage.getItem('user_id');
    console.log('Fetching bookings for user:', userId);
    
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      // Use the correct endpoint
      const response = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`);
      console.log('Bookings response:', response.data);
      
      if (response.data && response.data.length > 0) {
        setBookings(response.data);
      } else {
        setBookings([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error.response?.data || error.message);
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/bookings/${bookingId}`);
      alert('Booking cancelled!');
      fetchBookings();
    } catch (error) {
      alert('Failed to cancel booking');
    }
  };

  if (loading) {
    return <div className="text-center"><h3>Loading bookings...</h3></div>;
  }

  const userId = localStorage.getItem('user_id');
  if (!userId) {
    return (
      <div className="text-center">
        <h3>Please <a href="/login">Login</a> to view your bookings</h3>
      </div>
    );
  }

  if (bookings.length === 0) {
    return <div className="text-center"><h3>No bookings yet.</h3></div>;
  }

  return (
    <div>
      <h2 className="mb-4">My Bookings</h2>
      <div className="row">
        {bookings.map((booking) => (
          <div className="col-md-6 mb-3" key={booking.id}>
            <div className="card">
              <div className="card-body">
                <h5>{booking.hotel_name}</h5>
                <p><strong>Room:</strong> {booking.room_type}</p>
                <p><strong>Guests:</strong> {booking.guests || 1}</p>
                <p><strong>Check-in:</strong> {booking.check_in}</p>
                <p><strong>Check-out:</strong> {booking.check_out}</p>
                <p><strong>Total:</strong> ${booking.total_price}</p>
                <p><strong>Status:</strong> 
                  <span className={`badge ${booking.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`}>
                    {booking.status}
                  </span>
                </p>
                {booking.status === 'confirmed' && (
                  <button className="btn btn-danger mt-2" onClick={() => handleCancel(booking.id)}>
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyBookingsPage;