import { useState } from 'react';
import { login, register } from './api/notes';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const fn = isRegister ? register : login;
      const res = await fn(email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('email', res.data.email);
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5c518' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 40, borderRadius: 10, width: 320 }}>
        <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="Shiro Notes" style={{ width: 80, height: 80, display: 'block', margin: '0 auto 15px auto', borderRadius: 12 }} />
        <h2 style={{ marginTop: 0, color: 'black' }}>{isRegister ? 'Sign Up' : 'Log In'}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }}
          required
        />
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, paddingRight: 40, boxSizing: 'border-box' }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              padding: 4,
              color: '#555'
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <button type="submit" style={{ width: '100%', padding: 10, marginBottom: 10 }}>
          {isRegister ? 'Sign Up' : 'Log In'}
        </button>
        <p style={{ textAlign: 'center', cursor: 'pointer', color: 'blue' }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </p>
      </form>
    </div>
  );
}

export default Login;
