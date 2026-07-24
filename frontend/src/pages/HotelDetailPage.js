import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../api';

function HotelDetailPage() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Currency
  const [currency, setCurrency] = useState('USD');
  const [rates, setRates] = useState({ USD: 1, EUR: 0.85, GBP: 0.73, INR: 83, AED: 3.67, SGD: 1.35, THB: 36, JPY: 149, AUD: 1.52, CAD: 1.37 });
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [hasBooked, setHasBooked] = useState(false);

  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/hotels/${hotelId}`);
        setHotel(response.data);
        setLoading(false);
        
        if (userId) {
          try {
            const bookingsResponse = await axios.get(`${API_URL}/api/bookings/user/${userId}`);
            const userBookings = bookingsResponse.data;
            const hasBooking = userBookings.some(b => b.hotel_id === parseInt(hotelId));
            setHasBooked(hasBooking);
          } catch (err) {
            console.error('Error checking bookings:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching hotel:', error);
        setLoading(false);
      }
    };
    fetchHotel();
    fetchCurrencies();
  }, [hotelId, userId]);

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/currencies`);
      if (response.data && Object.keys(response.data).length > 0) {
        setRates(response.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const convertPrice = (price) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice === 0) return 0;
    
    if (currency === 'USD') return numPrice;
    
    const rate = rates[currency];
    if (!rate || isNaN(rate)) return numPrice;
    
    return numPrice * rate;
  };

  const getCurrencySymbol = () => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      AED: 'د.إ',
      SGD: 'S$',
      THB: '฿',
      JPY: '¥',
      AUD: 'A$',
      CAD: 'C$'
    };
    return symbols[currency] || currency;
  };

  const formatPrice = (price) => {
    const converted = convertPrice(price);
    if (isNaN(converted) || !isFinite(converted)) return '0.00';
    return converted.toFixed(2);
  };

  const handleBooking = async () => {
    if (!selectedRoomType) {
      setError('Please select a room type');
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates');
      return;
    }

    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      const availableRoom = hotel.rooms.find(room =>
        room.room_type === selectedRoomType && room.is_available === 1
      );

      if (!availableRoom) {
        setError('No available rooms of this type for the selected dates');
        return;
      }

      const response = await axios.post(`${API_URL}/api/bookings`, {
        user_id: parseInt(userId),
        hotel_id: parseInt(hotelId),
        room_id: availableRoom.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: parseInt(guests)
      });

      setSuccess(`Booking created! Redirecting to payment...`);
      setError('');
      
      const nights = (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24);
      const totalPrice = typeof response.data.total_price === 'number' 
        ? response.data.total_price 
        : parseFloat(response.data.total_price);
      
      const paymentResponse = await axios.post(`${API_URL}/api/create-checkout-session`, {
        booking_id: response.data.booking_id,
        user_id: parseInt(userId),
        total_price: totalPrice,
        hotel_name: hotel.name,
        nights: nights,
        guests: parseInt(guests)
      });

      window.location.href = paymentResponse.data.url;
      
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
      setSuccess('');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!userId) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/reviews`, {
        user_id: parseInt(userId),
        hotel_id: parseInt(hotelId),
        rating: rating,
        comment: comment
      });
      
      setReviewSuccess('Review submitted successfully!');
      setReviewError('');
      setComment('');
      setRating(5);
      
      const hotelResponse = await axios.get(`${API_URL}/api/hotels/${hotelId}`);
      setHotel(hotelResponse.data);
      
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review');
      setReviewSuccess('');
    }
  };

  if (loading) {
    return <div className="text-center"><h3>Loading...</h3></div>;
  }

  if (!hotel) {
    return <div className="text-center"><h3>Hotel not found</h3></div>;
  }

  return (
    <div>
      <Link to="/hotels" className="btn btn-secondary mb-3">← Back to Hotels</Link>
      
      <div className="float-end">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowCurrencySelector(!showCurrencySelector)}>
          💱 {currency}
        </button>
        {showCurrencySelector && (
          <div className="dropdown-menu show p-2" style={{ position: 'absolute', right: 0, minWidth: '150px' }}>
            {Object.keys(rates).map((curr) => (
              <button key={curr} className="dropdown-item" onClick={() => { setCurrency(curr); setShowCurrencySelector(false); }}>
                {curr}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <h2>{hotel.name}</h2>
      <p><strong>{hotel.city}, {hotel.country}</strong></p>
      <p>{'⭐'.repeat(hotel.star_rating || 3)}</p>
      <p>{hotel.description}</p>
      
      <h4 className="mt-4">Rooms</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      {hotel.room_types && hotel.room_types.length > 0 ? (
        <div className="row">
          {hotel.room_types.map((roomType) => (
            <div className="col-md-4 mb-3" key={roomType.type}>
              <div className={`card ${selectedRoomType === roomType.type ? 'border-primary' : ''}`}
                   style={{ cursor: 'pointer' }}
                   onClick={() => setSelectedRoomType(roomType.type)}>
                <div className="card-body">
                  <h5>{roomType.type}</h5>
                  <p>{getCurrencySymbol()}{formatPrice(roomType.price_per_night)} per night</p>
                  <p>Capacity: {roomType.capacity} guests</p>
                  <p>Available: {roomType.available} / {roomType.total}</p>
                  {selectedRoomType === roomType.type && <span className="badge bg-primary">Selected</span>}
                  {roomType.available === 0 && <span className="badge bg-danger ms-2">Sold Out</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No rooms available.</p>
      )}
      
      <div className="row mt-4">
        <div className="col-md-3">
          <label className="form-label">Check-in Date</label>
          <input type="date" className="form-control" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Check-out Date</label>
          <input type="date" className="form-control" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Number of Guests</label>
          <input type="number" className="form-control" min="1" max="10" value={guests} onChange={(e) => setGuests(e.target.value)} />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button className="btn btn-success w-100" onClick={handleBooking}>Book Now</button>
        </div>
      </div>
      
      <h4 className="mt-5">Reviews</h4>
      
      {userId ? (
        hasBooked ? (
          <div className="card mb-4">
            <div className="card-body">
              <h5>Submit a Review</h5>
              {reviewError && <div className="alert alert-danger">{reviewError}</div>}
              {reviewSuccess && <div className="alert alert-success">{reviewSuccess}</div>}
              <form onSubmit={handleSubmitReview}>
                <div className="mb-3">
                  <label className="form-label">Rating</label>
                  <select className="form-select" value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
                    <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                    <option value="4">⭐⭐⭐⭐ - Good</option>
                    <option value="3">⭐⭐⭐ - Average</option>
                    <option value="2">⭐⭐ - Poor</option>
                    <option value="1">⭐ - Terrible</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Comment</label>
                  <textarea className="form-control" rows="3" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." />
                </div>
                <button type="submit" className="btn btn-primary">Submit Review</button>
              </form>
            </div>
          </div>
        ) : (
          <div className="alert alert-info">You need to book this hotel before you can review it.</div>
        )
      ) : (
        <div className="alert alert-warning">Please <a href="/login">login</a> to submit a review.</div>
      )}
      
      {hotel.reviews && hotel.reviews.length > 0 ? (
        hotel.reviews.map((review) => (
          <div className="card mb-2" key={review.id}>
            <div className="card-body">
              <p><strong>Rating: {'⭐'.repeat(review.rating)}</strong></p>
              <p>{review.comment}</p>
              <small className="text-muted">Reviewed on {review.created_at ? review.created_at.split('T')[0] : 'N/A'}</small>
            </div>
          </div>
        ))
      ) : (
        <p>No reviews yet. Be the first to review!</p>
      )}
    </div>
  );
}

export default HotelDetailPage;