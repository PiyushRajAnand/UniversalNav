import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/', { replace: true }); // Forces route replacement to home
    } catch (err) {
      console.error('Login submit error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error || 
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center flex-grow-1 my-auto" style={{ maxWidth: '450px' }}>
      <div className="card shadow-lg p-4 bg-dark text-light border border-secondary w-100">
        <h2 className="text-center mb-4 text-info fw-bold">Login to UniversalNav</h2>
        
        {error && <div className="alert alert-danger py-2">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-light">Email address</label>
            <input
              type="email"
              className="form-control bg-secondary text-light border-0 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-semibold text-light">Password</label>
            <input
              type="password"
              className="form-control bg-secondary text-light border-0 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-info w-100 py-2 fw-bold text-dark"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 text-light">
          Don't have an account? <Link to="/signup" className="text-info text-decoration-none fw-semibold">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
