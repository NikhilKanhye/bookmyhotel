import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPromotionsPage() {
  const [hotels, setHotels] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ hotel_id: '', title: '', description: '', discount_percentage: 10, start_date: '', end_date: '' });

  useEffect(() => {
    fetchHotels();
    fetchPromotions();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/hotels');
      setHotels(response.data);
    } catch (err) { console.error(err); }
  };

  const fetchPromotions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/promotions');
      setPromotions(response.data);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/promotions', formData);
      alert('Promotion added!');
      setFormData({ hotel_id: '', title: '', description: '', discount_percentage: 10, start_date: '', end_date: '' });
      fetchPromotions();
    } catch (err) { alert('Failed to add promotion'); }
  };

  if (loading) return <div className="text-center"><h3>Loading...</h3></div>;

  return (
    <div>
      <h2 className="mb-4">Manage Promotions</h2>
      <div className="card mb-4">
        <div className="card-body">
          <h5>Add New Promotion</h5>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Hotel</label>
                <select className="form-select" value={formData.hotel_id} onChange={(e) => setFormData({...formData, hotel_id: e.target.value})} required>
                  <option value="">Select Hotel</option>
                  {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Title</label>
                <input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="col-md-12 mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Discount %</label>
                <input type="number" className="form-control" value={formData.discount_percentage} onChange={(e) => setFormData({...formData, discount_percentage: parseInt(e.target.value)})} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">End Date</label>
                <input type="date" className="form-control" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required />
              </div>
              <div className="col-md-12">
                <button type="submit" className="btn btn-success">Add Promotion</button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="row">
        {promotions.map((promo) => (
          <div className="col-md-4 mb-3" key={promo.id}>
            <div className="card">
              <div className="card-body">
                <h5>{promo.title}</h5>
                <p>{promo.description}</p>
                <p><strong>Discount:</strong> {promo.discount_percentage}%</p>
                <p><strong>Valid:</strong> {promo.start_date} to {promo.end_date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPromotionsPage;