import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    star_rating: 3,
    description: '',
    phone: '',
    email: '',
    image_url: ''
  });
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/hotels');
      setHotels(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchRooms = async (hotelId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/hotels/${hotelId}`);
      setRooms(response.data.rooms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddHotel = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/hotels', formData);
      alert('Hotel added successfully!');
      setShowForm(false);
      setFormData({ name: '', address: '', city: '', country: '', star_rating: 3, description: '', phone: '', email: '', image_url: '' });
      fetchHotels();
    } catch (err) {
      alert('Failed to add hotel');
    }
  };

  const handleUpdateHotel = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/admin/hotels/${editingHotel.id}`, formData);
      alert('Hotel updated successfully!');
      setEditingHotel(null);
      setFormData({ name: '', address: '', city: '', country: '', star_rating: 3, description: '', phone: '', email: '', image_url: '' });
      fetchHotels();
    } catch (err) {
      alert('Failed to update hotel');
    }
  };

  const handleDeleteHotel = async (id) => {
    if (!window.confirm('Delete this hotel? All rooms will also be deleted.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/hotels/${id}`);
      alert('Deleted!');
      fetchHotels();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleEditClick = (hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      address: hotel.address || '',
      city: hotel.city,
      country: hotel.country,
      star_rating: hotel.star_rating,
      description: hotel.description || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
      image_url: hotel.image_url || ''
    });
    fetchRooms(hotel.id);
  };

  const toggleRoomAvailability = async (roomId, currentStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/rooms/${roomId}`, {
        is_available: currentStatus ? 0 : 1
      });
      alert('Room availability updated!');
      if (editingHotel) {
        fetchRooms(editingHotel.id);
      }
    } catch (err) {
      alert('Failed to update room availability');
    }
  };

  if (loading) return <div className="text-center"><h3>Loading...</h3></div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Hotels</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add New Hotel'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h5>Add New Hotel</h5>
            <form onSubmit={handleAddHotel}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Hotel Name</label>
                  <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">City</label>
                  <input type="text" className="form-control" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Country</label>
                  <input type="text" className="form-control" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Star Rating</label>
                  <select className="form-select" value={formData.star_rating} onChange={(e) => setFormData({...formData, star_rating: parseInt(e.target.value)})}>
                    <option value="1">⭐</option><option value="2">⭐⭐</option><option value="3">⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐</option><option value="5">⭐⭐⭐⭐⭐</option>
                  </select>
                </div>
                <div className="col-md-12 mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <button type="submit" className="btn btn-success">Save Hotel</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingHotel && (
        <div className="card mb-4 border-primary">
          <div className="card-body">
            <h5>Edit Hotel: {editingHotel.name}</h5>
            <form onSubmit={handleUpdateHotel}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Hotel Name</label>
                  <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">City</label>
                  <input type="text" className="form-control" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Country</label>
                  <input type="text" className="form-control" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Star Rating</label>
                  <select className="form-select" value={formData.star_rating} onChange={(e) => setFormData({...formData, star_rating: parseInt(e.target.value)})}>
                    <option value="1">⭐</option><option value="2">⭐⭐</option><option value="3">⭐⭐⭐</option>
                    <option value="4">⭐⭐⭐⭐</option><option value="5">⭐⭐⭐⭐⭐</option>
                  </select>
                </div>
                <div className="col-md-12 mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="col-md-12">
                  <button type="submit" className="btn btn-primary">Update Hotel</button>
                  <button type="button" className="btn btn-secondary ms-2" onClick={() => { setEditingHotel(null); setFormData({ name: '', address: '', city: '', country: '', star_rating: 3, description: '', phone: '', email: '', image_url: '' }); }}>Cancel Edit</button>
                </div>
              </div>
            </form>
            
            {rooms.length > 0 && (
              <div className="mt-3">
                <h6>Room Availability</h6>
                <div className="row">
                  {rooms.map((room) => (
                    <div className="col-md-3 mb-2" key={room.id}>
                      <div className="card">
                        <div className="card-body">
                          <h6>{room.room_type}</h6>
                          <p>${room.price_per_night} per night</p>
                          <button 
                            className={`btn btn-sm ${room.is_available ? 'btn-success' : 'btn-danger'}`}
                            onClick={() => toggleRoomAvailability(room.id, room.is_available)}
                          >
                            {room.is_available ? 'Available' : 'Unavailable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="row">
        {hotels.map((hotel) => (
          <div className="col-md-6 mb-3" key={hotel.id}>
            <div className="card">
              <div className="card-body">
                <h5>{hotel.name}</h5>
                <p><strong>{hotel.city}, {hotel.country}</strong></p>
                <p>{'⭐'.repeat(hotel.star_rating)}</p>
                <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditClick(hotel)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHotel(hotel.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminHotelsPage;