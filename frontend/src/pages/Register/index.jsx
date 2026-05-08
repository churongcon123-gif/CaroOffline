import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/authApi';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await registerUser(username, password);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fade-in" style={{ padding: '40px 16px', maxWidth: '400px' }}>
      <h2 className="section-title">Create an Account</h2>
      <div style={{ background: 'var(--steam-card-bg)', padding: '24px', borderRadius: '4px', border: '1px solid var(--steam-border)' }}>
        
        {error && (
          <div style={{ background: 'rgba(226, 0, 26, 0.1)', color: 'var(--steam-red)', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', border: '1px solid var(--steam-red)' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(164, 208, 7, 0.1)', color: 'var(--steam-green-bright)', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', border: '1px solid var(--steam-green)' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--steam-highlight)' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '3px', outline: 'none' }}
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--steam-highlight)' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '3px', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--steam-highlight)' }}>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--steam-darker-bg)', border: '1px solid var(--steam-border)', color: 'var(--steam-highlight)', borderRadius: '3px', outline: 'none' }}
            />
          </div>

          <button type="submit" className="btn btn-green" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating Account...' : 'Join CaroOnline'}
          </button>
        </form>

        <p style={{ marginTop: '16px', fontSize: '12px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
