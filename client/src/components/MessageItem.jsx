import React from 'react';

const MessageItem = ({ message }) => {
  const messageStyle = {
    alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
    background: message.sender === 'user' ? '#d1e7dd' : '#e9ecef',
    color: '#222',
    padding: '8px 14px',
    borderRadius: 16,
    maxWidth: '80%',
    fontSize: 16
  };

  return (
    <div style={messageStyle}>
      {message.text}
    </div>
  );
};

export default MessageItem;
