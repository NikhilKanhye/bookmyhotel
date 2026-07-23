import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    fetchHotels();
    fetchPromotions();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/hotels');
      setHotels(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/promotions');
      setPromotions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/hotels/search?city=${searchCity}`);
      setHotels(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="text-center"><h3>Loading hotels...</h3></div>;

  return (
    <div>
      <h2 className="mb-4">Find Hotels</h2>
      <div className="row mb-4">
        <div className="col-md-8">
          <input type="text" className="form-control" placeholder="Search by city..." value={searchCity} onChange={(e) => setSearchCity(e.target.value)} />
        </div>
        <div className="col-md-4">
          <button className="btn btn-primary w-100" onClick={handleSearch}>Search</button>
        </div>
      </div>

      {promotions.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <h4 className="text-success">🔥 Special Deals!</h4>
            <div className="row">
              {promotions.map((promo) => (
                <div className="col-md-3 mb-2" key={promo.id}>
                  <div className="card border-success">
                    <div className="card-body">
                      <h6>{promo.title}</h6>
                      <p className="text-success">{promo.discount_percentage}% OFF</p>
                      <small>{promo.hotel_name}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {hotels.length === 0 ? (
        <p>No hotels found.</p>
      ) : (
        <div className="row">
          {hotels.map((hotel) => (
            <div className="col-md-4 mb-4" key={hotel.id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{hotel.name}</h5>
                  <p className="card-text"><strong>{hotel.city}, {hotel.country}</strong><br />{'⭐'.repeat(hotel.star_rating || 3)}</p>
                  <p className="card-text">{hotel.description ? hotel.description.substring(0, 100) + '...' : ''}</p>
                </div>
                <div className="card-footer">
                  <Link to={`/hotels/${hotel.id}`} className="btn btn-primary w-100">View Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HotelsPage;