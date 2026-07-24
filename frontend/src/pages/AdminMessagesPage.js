import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../api';

function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/contact-messages`);
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/contact-messages/${id}`);
      fetchMessages();
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  if (loading) {
    return <div className="text-center"><h3>Loading messages...</h3></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Contact Messages</h2>
      
      {messages.length === 0 ? (
        <div className="alert alert-info">No messages yet.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Hotel</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, index) => (
                <tr key={msg.id}>
                  <td>{index + 1}</td>
                  <td>{msg.name}</td>
                  <td>{msg.email}</td>
                  <td>{msg.hotel_name || 'N/A'}</td>
                  <td>{msg.subject}</td>
                  <td>{msg.message ? msg.message.substring(0, 50) + '...' : ''}</td>
                  <td>{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleDelete(msg.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminMessagesPage;