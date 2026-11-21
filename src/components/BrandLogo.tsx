import React from 'react';

interface BrandLogoProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const LOGO_SRC =
  '/assets/aistudio/WhatsApp_Image_2026-11-18_at_13.52.38_f5e8965b.jpeg';

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  className = '',
}) => {
  if (variant === 'full') {
    return (
      <div
        className={`relative mx-auto h-36 w-64 overflow-hidden rounded-2xl ${className}`}
      >
        <img
          src={LOGO_SRC}
          alt="ReciclaOQ"
          className="h-full w-full object-cover object-center scale-[1.46] mix-blend-multiply"
        />
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#bccac0]/40">
        <img
          src={LOGO_SRC}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center translate-y-[10.5%] scale-[2.55] mix-blend-multiply"
        />
      </span>
      <span className="text-xl font-extrabold tracking-tight whitespace-nowrap">
        <span className="text-[#006948]">Recicla</span>
        <span className="text-[#006398]">OQ</span>
      </span>
    </span>
  );
};
