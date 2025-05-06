import { useState } from 'react';
import MessageItem from './MessageItem';

const ChatInterface = ({ username, accessToken, showLoginAlert, onLogout }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);
    
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
        onLogout();
        return;
      }
      
      console.log('Sending headers:', headers);
      console.log('JD DEBUG: handleSend called at', new Date().toISOString());

      const res = await fetch('http://localhost:5001/askllm', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ prompt: input }), 
        credentials: 'include'
      });

      if (res.status === 401) {
        setMessages(msgs => [
          ...msgs,
          { sender: 'bot', text: 'Unauthorized (401). Please log in again. Your session or token may have expired.' }
        ]);
        setLoading(false);
        onLogout();
        return;
      }
      if (res.status === 403) {
        setMessages(msgs => [
          ...msgs,
          { sender: 'bot', text: 'Forbidden (403). You do not have access. Please log in again.' }
        ]);
        setLoading(false);
        onLogout();
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

  const containerStyle = {
    maxWidth: 480,
    margin: '40px auto',
    border: '1px solid #ddd',
    borderRadius: 8,
    boxShadow: '0 2px 8px #eee',
    display: 'flex',
    flexDirection: 'column',
    height: '80vh',
    background: '#fafbfc'
  };

  const headerStyle = {
    padding: 16, 
    borderBottom: '1px solid #eee', 
    fontWeight: 'bold', 
    fontSize: 22
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  };

  const formStyle = {
    display: 'flex',
    borderTop: '1px solid #eee',
    padding: 12,
    background: '#fff'
  };

  const inputStyle = {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: 16
  };

  const buttonStyle = {
    marginLeft: 8,
    padding: '0 18px',
    borderRadius: 20,
    border: 'none',
    background: '#4f8cff',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    cursor: loading ? 'not-allowed' : 'pointer'
  };

  const typingIndicatorStyle = {
    alignSelf: 'center',
    background: '#e9ecef',
    color: '#222',
    padding: '8px 14px',
    borderRadius: 16,
    maxWidth: '80%',
    fontSize: 16,
    fontStyle: 'italic'
  };

  const logoutButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: '#f00',
    cursor: 'pointer',
    marginLeft: 10,
    fontSize: 14
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        Gemini LLM Chat
        <span style={{float: 'right', fontSize: 15, fontWeight: 'normal', color: '#555'}}>
          {username && `👤 ${username}`}
          <button onClick={onLogout} style={logoutButtonStyle}>Logout</button>
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
      
      <div style={messagesContainerStyle}>
        {messages.map((msg, idx) => (
          <MessageItem key={idx} message={msg} />
        ))}
        
        {loading && (
          <div style={typingIndicatorStyle}>
            Bot is typing...
          </div>
        )}
      </div>
      
      <form onSubmit={handleSend} style={formStyle}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={inputStyle}
          disabled={loading}
        />
        <button
          type="submit"
          style={buttonStyle}
          disabled={loading}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
