import React from 'react'
import '../styles/Navbar.css'

const Navbar = ({ onGetStarted }) => {
  return (
    <div className="navbar">
      <div className="navbar-start">
        <a href="/" className="brand-text">Hotel Booking</a>
      </div>
    
      <button 
        onClick={onGetStarted}
        className="get-started-button"
      >
        Get Started
      </button>
    </div>
  )
}

export default Navbar
