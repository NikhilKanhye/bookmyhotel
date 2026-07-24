import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../api';

function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post(`${API_URL}/api/request-reset`, { email });
      setSuccess(response.data.message);
      if (response.data.reset_url) {
        setSuccess(`${response.data.message}\nReset link: ${response.data.reset_url}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email not found');
    }
    setLoading(false);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card">
          <div className="card-body">
            <h2 className="text-center mb-4">Forgot Password</h2>
            <p className="text-muted text-center">Enter your email to receive a password reset link</p>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success" style={{ whiteSpace: 'pre-line' }}>{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <p className="text-center mt-3">
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RequestResetPage;