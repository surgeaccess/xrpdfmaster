// SlidingPanel.js
import React from 'react';
import './SlidingPanel.css';

const SlidingPanel = ({ isOpen, content }) => {
  return (
    <div className={`sliding-panel ${isOpen ? 'open' : ''}`}>
      <div className="sliding-panel-content">
        {content}
      </div>
    </div>
  );
};

export default SlidingPanel;