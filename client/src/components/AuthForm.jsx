import { useState } from 'react';

const AuthForm = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError('Email and password are required');
      return;
    }
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5001/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password })
      });
      const data = await res.json();
      console.log('Login response:', data);

      if (res.ok) {
        onLoginSuccess(email.trim(), data.accesstoken);
        setEmail('');
        setPassword('');
        alert('You are logged in!');
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (err) {
      setLoginError('Could not reach login server');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() ) {
      setLoginError('All fields are required');
      return;
    }
    setLoginError('');
    try {
      const res = await fetch('http://localhost:5001/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          email: email.trim(), 
          password: password,
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        // Reset form and show success
        setName('');
        setEmail('');
        setPassword('');
        setLoginError('Registration successful! Please login.');
        setIsLogin(true); // Switch to login form
      } else {
        setLoginError(data.message || 'Registration failed');
      }
    } catch (err) {
      setLoginError('Could not reach registration server');
    }
  };

  const formContainerStyle = {
    maxWidth: 340,
    margin: '120px auto',
    border: '1px solid #ddd',
    borderRadius: 8,
    boxShadow: '0 2px 8px #eee',
    padding: 32,
    background: '#fafbfc',
    textAlign: 'center'
  };

  const inputStyle = {
    width: '100%',
    padding: 10,
    borderRadius: 20,
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: 16,
    marginBottom: 16
  };

  const buttonStyle = {
    width: '100%',
    padding: '10px 0',
    borderRadius: 20,
    border: 'none',
    background: '#4f8cff',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    cursor: 'pointer',
    marginBottom: 10
  };

  const linkButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: '#4f8cff',
    textDecoration: 'underline',
    cursor: 'pointer',
    marginTop: 10
  };

  return (
    <div style={formContainerStyle}>
      <h2>{isLogin ? 'Login to' : 'Register for'} Gemini LLM Chat</h2>
      
      {isLogin ? (
        <form onSubmit={handleLogin} style={{marginTop: 24}}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister} style={{marginTop: 24}}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your full name"
            style={inputStyle}
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={inputStyle}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Register
          </button>
        </form>
      )}
      
      {loginError && (
        <div style={{color: loginError.includes('successful') ? 'green' : 'red', marginTop: 12, fontSize: 15}}>
          {loginError}
        </div>
      )}
      
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setLoginError('');
        }}
        style={linkButtonStyle}
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default AuthForm;
