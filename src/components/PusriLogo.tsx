import React from 'react';

interface PusriLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const PusriLogo: React.FC<PusriLogoProps> = ({ 
  className = 'h-10 w-auto', 
  size 
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={size ? { height: size, width: typeof size === 'number' ? `${size * 0.9}px` : size } : undefined}
    >
      <img
        src="/logo-pusri.svg"
        alt="Logo Resmi PT Pusri Palembang"
        className="h-full w-auto object-contain transition-transform"
        loading="eager"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
