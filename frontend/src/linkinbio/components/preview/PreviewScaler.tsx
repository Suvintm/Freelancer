import React from 'react';

interface PreviewScalerProps {
  children: React.ReactNode;
  scale?: number;
}

export const PreviewScaler: React.FC<PreviewScalerProps> = ({ children, scale = 1 }) => {
  return (
    <div
      className="origin-center transition-transform duration-300 flex items-center justify-center"
      style={{ transform: `scale(${scale})` }}
    >
      {children}
    </div>
  );
};

export default PreviewScaler;
