import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/dashboard');
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center"><h3>Loading dashboard...</h3></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h5 className="card-title">Total Users</h5>
              <h2 className="card-text">{stats.total_users}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h5 className="card-title">Total Hotels</h5>
              <h2 className="card-text">{stats.total_hotels}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-warning">
            <div className="card-body">
              <h5 className="card-title">Total Bookings</h5>
              <h2 className="card-text">{stats.total_bookings}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-white bg-danger">
            <div className="card-body">
              <h5 className="card-title">Total Revenue</h5>
              <h2 className="card-text">${stats.total_revenue}</h2>
              <small>Nights: {stats.total_nights} | ADR: ${stats.avg_daily_rate.toFixed(2)}</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header"><h5>Recent Bookings</h5></div>
            <div className="card-body">
              {stats.recent_bookings && stats.recent_bookings.length > 0 ? (
                <table className="table table-striped">
                  <thead><tr><th>Guest</th><th>Hotel</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {stats.recent_bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.user_name}</td>
                        <td>{booking.hotel_name}</td>
                        <td>${booking.total_price}</td>
                        <td><span className={`badge ${booking.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`}>{booking.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No recent bookings</p>}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header"><h5>Bookings by Hotel</h5></div>
            <div className="card-body">
              {stats.bookings_by_hotel && stats.bookings_by_hotel.length > 0 ? (
                <table className="table table-striped">
                  <thead><tr><th>Hotel</th><th>Bookings</th><th>Nights</th><th>Revenue</th></tr></thead>
                  <tbody>
                    {stats.bookings_by_hotel.map((hotel) => (
                      <tr key={hotel.id}>
                        <td>{hotel.name}</td>
                        <td>{hotel.booking_count}</td>
                        <td>{hotel.total_nights || 0}</td>
                        <td>${hotel.revenue || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No data</p>}
            </div>
          </div>
          <div className="card mt-3">
            <div className="card-header"><h5>Hotel Reports</h5></div>
            <div className="card-body">
              {stats.bookings_by_hotel && stats.bookings_by_hotel.map((hotel) => (
                <div key={hotel.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                  <span>{hotel.name}</span>
                  <span className="badge bg-primary">{hotel.booking_count} bookings</span>
                  <a href={`/hotels/${hotel.id}`} className="btn btn-sm btn-outline-primary">View Report</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;