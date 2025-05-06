import React from 'react';
import '../styles/Homepage.css';
import Navbar from './Navbar';
import Video from './Video';
const Homepage = ({ onGetStarted }) => {
  return (
    <div className="homepage-container">
       <p className="subtitle">
      AI-Powered Hotel Booking
      </p>
      <h1 className="main-heading">
      Discover Your Perfect <span className="highlight">Stay</span> <br />
      with AI Assistance
      </h1>
      <p className="description">
      Simplify your hotel search and booking process <br /> with our intelligent AI solutions.
      </p>
      
      <button 
        onClick={onGetStarted}
        className="get-started-button"
      >
        Get Started
      </button>
      
      <p className="disclaimer">
        Start for free. No credit card required.
      </p> 

      <Navbar/>
      <Video/> 
    </div>
  );
};

export default Homepage;