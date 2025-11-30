import React from 'react';

interface AlertProps {
  variant?: 'info' | 'success' | 'error';
  children: React.ReactNode;
}

const variantStyles = {
  info: 'bg-blue-100 text-blue-800 border-blue-300',
  success: 'bg-green-100 text-green-800 border-green-300',
  error: 'bg-red-100 text-red-800 border-red-300',
};

export const Alert: React.FC<AlertProps> = ({ variant = 'info', children }) => {
  return (
    <div className={`border-l-4 p-4 mb-4 rounded ${variantStyles[variant]}`}> 
      {children}
    </div>
  );
}; 