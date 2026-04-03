import React from 'react';
import './AddPropertySteps.css';

const AddPropertySteps = ({ currentStep, totalSteps }) => {
  const steps = [
    'Basic Info',
    'Pricing & Terms', 
    'Amenities',
    'Location',
    'Media',
    'Review'
  ];

  return (
    <div className="steps-container">
      <div className="steps-progress">
        <div 
          className="progress-bar" 
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
      <div className="steps-list">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`step-item ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">
              {index + 1 < currentStep ? '✓' : index + 1}
            </div>
            <div className="step-label">{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddPropertySteps;
