import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email: email,
        password: password
      });

      console.log('Login response:', response.data);

      // Save user data to localStorage
      localStorage.setItem('user_id', response.data.user_id);
      localStorage.setItem('user_name', response.data.name);
      localStorage.setItem('user_role', response.data.role);
      
      // Save language preference if exists
      if (response.data.language) {
        localStorage.setItem('language', response.data.language);
      }

      // Call the onLogin function from App.js
      onLogin(response.data.name, response.data.role, response.data.user_id);

      // Navigate to home
      navigate('/');
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-4">
        <div className="card">
          <div className="card-body">
            <h2 className="text-center mb-4">Login</h2>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="text-center mt-2">
              <Link to="/request-reset" className="btn btn-link btn-sm text-decoration-none">
                Forgot Password?
              </Link>
            </div>

            <p className="text-center mt-3">
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;