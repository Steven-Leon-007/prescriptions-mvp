import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

export const Card = ({ children, title, className = '', onClick }: CardProps) => {
  return (
    <div 
      className={`card ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};
