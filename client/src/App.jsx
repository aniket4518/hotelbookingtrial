import { useState } from 'react'
import './App.css'
 

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [accessToken, setAccessToken] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);
    //FETCH WITH BACKEND
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      if (accessToken && typeof accessToken === 'string' && accessToken.length > 0) {
        headers.Authorization = `Bearer ${accessToken}`;
      } else {
        console.warn('No access token found: Authorization header will be missing!');
        setMessages(msgs => [
          ...msgs,
          { sender: 'bot', text: 'You are not authorized. Please log in again.' }
        ]);
        setLoading(false);
        return;
      }
      // Debug: log headers to verify
      console.log('Sending headers:', headers);

      // JD: line 33 console run this time
      console.log('JD DEBUG: handleSend called at', new Date().toISOString());

      const res = await fetch('http://localhost:5001/askllm', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ prompt: input }), // <-- fix: use 'prompt'
        credentials: 'include'
      });

      // Handle fetch/network errors and 401/403/400 specifically
      if (res.status === 401) {
        setMessages(msgs => [
          ...msgs,
          { sender: 'bot', text: 'Unauthorized (401). Please log in again. Your session or token may have expired.' }
        ]);
        setLoading(false);
        setAccessToken('');
        setUsername('');
        return;
      }
      if (res.status === 403) {
        setMessages(msgs => [
          ...msgs,
          { sender: 'bot', text: 'Forbidden (403). You do not have access. Please log in again.' }
        ]);
        setLoading(false);
        setAccessToken('');
        setUsername('');
        return;
      }
      if (res.status === 400) {
        setMessages(msgs => [
          ...msgs,
          { sender: 'bot', text: 'Sorry, your request was invalid (400).' }
        ]);
        setLoading(false);
        return;
      }

      // If LLM response is JSON, show the whole JSON as a formatted string if no reply/response field
      const data = await res.json();
       
      console.log('Response data:', data); 
      setMessages(msgs => [
        ...msgs,
        {
          sender: 'bot',
          text:
            data.reply ||
            data.response ||
            (typeof data === 'object' ? (
              <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : 'Sorry, no response.')
        }
      ]);
    } catch (err) {
      setMessages(msgs => [
        ...msgs,
        { sender: 'bot', text: 'Error: Could not reach backend.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
      // Debug: log response for troubleshooting
      // Remove or comment out in production
      console.log('Login response:', data);

      if (res.ok) {
        setUsername(email.trim());
        setAccessToken(data.accesstoken);
        setEmail('');
        setPassword('');
        setShowLoginAlert(true);
        alert('You are logged in!');
        setTimeout(() => setShowLoginAlert(false), 1500);
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (err) {
      setLoginError('Could not reach login server');
    }
  };

  if (!username) {
    return (
      <div style={{
        maxWidth: 340,
        margin: '120px auto',
        border: '1px solid #ddd',
        borderRadius: 8,
        boxShadow: '0 2px 8px #eee',
        padding: 32,
        background: '#fafbfc',
        textAlign: 'center'
      }}>
        <h2>Login to Gemini LLM Chat</h2>
        <form onSubmit={handleLogin} style={{marginTop: 24}}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 20,
              border: '1px solid #ccc',
              outline: 'none',
              fontSize: 16,
              marginBottom: 16
            }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 20,
              border: '1px solid #ccc',
              outline: 'none',
              fontSize: 16,
              marginBottom: 16
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 20,
              border: 'none',
              background: '#4f8cff',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Login
          </button>
          {loginError && (
            <div style={{color: 'red', marginTop: 12, fontSize: 15}}>
              {loginError}
            </div>
          )}
        </form>
      </div>
    );
  }

  // Show chat input and chat UI only after login
  return (
    <div style={{
      maxWidth: 480,
      margin: '40px auto',
      border: '1px solid #ddd',
      borderRadius: 8,
      boxShadow: '0 2px 8px #eee',
      display: 'flex',
      flexDirection: 'column',
      height: '80vh',
      background: '#fafbfc'
    }}>
      <header style={{padding: 16, borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: 22}}>
        Gemini LLM Chat
        <span style={{float: 'right', fontSize: 15, fontWeight: 'normal', color: '#555'}}>
          {username && `👤 ${username}`}
        </span>
      </header>
      {showLoginAlert && (
        <div style={{
          alignSelf: 'center',
          background: '#d1e7dd',
          color: '#155724',
          padding: '10px 0',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          You are logged in!
        </div>
      )}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'user' ? '#d1e7dd' : '#e9ecef',
              color: '#222',
              padding: '8px 14px',
              borderRadius: 16,
              maxWidth: '80%',
              fontSize: 16
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div
            style={{
              alignSelf: 'center',
              background: '#e9ecef',
              color: '#222',
              padding: '8px 14px',
              borderRadius: 16,
              maxWidth: '80%',
              fontSize: 16,
              fontStyle: 'italic'
            }}
          >
            Bot is typing...
          </div>
        )}
      </div>
      {/* Chat input is always shown after login */}
      <form
        onSubmit={handleSend}
        style={{
          display: 'flex',
          borderTop: '1px solid #eee',
          padding: 12,
          background: '#fff'
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 20,
            border: '1px solid #ccc',
            outline: 'none',
            fontSize: 16
          }}
          disabled={loading}
        />
        <button
          type="submit"
          style={{
            marginLeft: 8,
            padding: '0 18px',
            borderRadius: 20,
            border: 'none',
            background: '#4f8cff',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App
