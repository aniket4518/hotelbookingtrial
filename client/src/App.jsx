import { useState } from 'react'
import './App.css'
import AuthForm from './components/AuthForm'
import ChatInterface from './components/ChatInterface'
import Homepage from './components/Homepage'
import Navbar from './components/Navbar'

function App() {
  const [username, setUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'auth', or 'chat'

  const handleLoginSuccess = (email, token) => {
    setUsername(email);
    setAccessToken(token);
    setShowLoginAlert(true);
    setCurrentPage('chat');
    setTimeout(() => setShowLoginAlert(false), 1500);
  };

  const handleLogout = () => {
    setUsername('');
    setAccessToken('');
    setCurrentPage('home');
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  // Render content based on current page state
  const renderContent = () => {
    switch(currentPage) {
      case 'home':
        return <Homepage onGetStarted={() => navigateTo('auth')} />;
      case 'auth':
        return username ? navigateTo('chat') : <AuthForm onLoginSuccess={handleLoginSuccess} />;
      case 'chat':
        return !username ? navigateTo('auth') : (
          <ChatInterface 
            username={username}
            accessToken={accessToken}
            showLoginAlert={showLoginAlert}
            onLogout={handleLogout}
          />
        );
      default:
        return <Homepage onGetStarted={() => navigateTo('auth')} />;
    }
  };

  return (
    <>
      <Navbar onGetStarted={() => navigateTo('auth')} />
      {renderContent()}
    </>
  );
}

export default App
