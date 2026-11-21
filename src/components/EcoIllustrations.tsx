import React, {useState} from 'react';
import {IllustrationTheme} from '../types/eco';

interface EcoIllustrationProps {
  theme: IllustrationTheme;
  customImageUrl?: string;
  alt: string;
  className?: string;
}

export const EcoIllustration: React.FC<EcoIllustrationProps> = ({
  theme,
  customImageUrl,
  alt,
  className = 'w-full h-56',
}) => {
  const [imgError, setImgError] = useState(false);

  if (customImageUrl && !imgError) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-[#eff4ff] ${className}`}>
        <img
          src={customImageUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#bccac0]/35 ${className}`}
      role="img"
      aria-label={alt}
    >
      {renderArtwork(theme)}
    </div>
  );
};

function renderArtwork(theme: IllustrationTheme) {
  switch (theme) {
    case 'pet-planter':
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-pet" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#eff6ff" />
              <stop offset="55%" stopColor="#ecfdf5" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
            <linearGradient id="pet-bottle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.65" />
            </linearGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-pet)" />
          <circle cx="520" cy="70" r="90" fill="#d1fae5" opacity="0.55" />
          <circle cx="110" cy="260" r="110" fill="#e0f2fe" opacity="0.7" />
          {/* Hanging cord */}
          <line x1="210" y1="0" x2="210" y2="90" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 3" />
          <line x1="430" y1="0" x2="430" y2="120" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 3" />
          {/* Left PET bottle */}
          <rect x="155" y="75" width="110" height="175" rx="22" fill="url(#pet-bottle)" stroke="#0284c7" strokeOpacity="0.35" strokeWidth="2" />
          <rect x="155" y="175" width="110" height="75" rx="18" fill="#38bdf8" fillOpacity="0.22" />
          <path d="M160 155 Q210 144 260 155 L260 175 L160 175 Z" fill="#5b4636" opacity="0.85" />
          <line x1="210" y1="168" x2="210" y2="232" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          {/* Basil leaves */}
          <path d="M210 148 C195 110 172 95 168 118 C164 138 192 145 210 148 Z" fill="#059669" />
          <path d="M210 148 C225 102 252 92 254 116 C256 138 228 145 210 148 Z" fill="#10b981" />
          <path d="M210 144 C205 102 215 80 222 100 C228 118 216 135 210 144 Z" fill="#047857" />
          {/* Right PET bottle */}
          <rect x="375" y="105" width="110" height="165" rx="22" fill="url(#pet-bottle)" stroke="#0284c7" strokeOpacity="0.35" strokeWidth="2" />
          <rect x="375" y="198" width="110" height="72" rx="18" fill="#38bdf8" fillOpacity="0.22" />
          <path d="M380 180 Q430 170 480 180 L480 198 L380 198 Z" fill="#5b4636" opacity="0.85" />
          <line x1="430" y1="194" x2="430" y2="255" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          <path d="M430 174 C414 142 390 128 388 148 C386 168 412 172 430 174 Z" fill="#10b981" />
          <path d="M430 174 C446 136 474 128 472 150 C470 168 446 172 430 174 Z" fill="#059669" />
          {/* Capillary arrows */}
          <path d="M312 195 L328 195 M320 187 L320 203" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case 'water-rinse':
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-rinse" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f0f9ff" />
              <stop offset="100%" stopColor="#e6f7f1" />
            </linearGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-rinse)" />
          <ellipse cx="320" cy="245" rx="190" ry="38" fill="#bae6fd" opacity="0.45" />
          {/* Basin */}
          <path d="M165 160 L475 160 L442 242 C438 252 426 258 412 258 L228 258 C214 258 202 252 198 242 Z" fill="#ffffff" stroke="#0284c7" strokeOpacity="0.35" strokeWidth="2.5" />
          <path d="M180 182 Q250 172 320 182 T460 182 L442 240 C438 248 426 252 412 252 L228 252 C214 252 202 248 198 240 Z" fill="#7dd3fc" fillOpacity="0.32" />
          {/* Clean containers inside/beside */}
          <rect x="235" y="102" width="68" height="92" rx="14" transform="rotate(-10 269 148)" fill="#ffffff" stroke="#059669" strokeWidth="2" />
          <rect x="330" y="95" width="76" height="98" rx="16" transform="rotate(8 368 144)" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" />
          {/* Droplets */}
          <path d="M318 46 C318 46 334 68 334 79 C334 88 327 95 318 95 C309 95 302 88 302 79 C302 68 318 46 318 46 Z" fill="#0ea5e9" opacity="0.75" />
          <circle cx="290" cy="196" r="8" fill="#ffffff" opacity="0.75" />
          <circle cx="352" cy="204" r="11" fill="#ffffff" opacity="0.75" />
          <circle cx="380" cy="192" r="6" fill="#ffffff" opacity="0.75" />
        </svg>
      );
    case 'tin-lantern':
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-tin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0f2338" />
              <stop offset="100%" stopColor="#1e3a52" />
            </linearGradient>
            <radialGradient id="lantern-glow" cx="50%" cy="52%" r="48%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0f2338" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-tin)" />
          <circle cx="320" cy="165" r="145" fill="url(#lantern-glow)" />
          {/* Projected light dots */}
          <g fill="#fde68a" opacity="0.55">
            <circle cx="170" cy="115" r="4" />
            <circle cx="152" cy="155" r="3" />
            <circle cx="185" cy="205" r="4" />
            <circle cx="470" cy="115" r="4" />
            <circle cx="490" cy="160" r="3" />
            <circle cx="458" cy="208" r="4" />
            <circle cx="215" cy="78" r="3" />
            <circle cx="425" cy="78" r="3" />
          </g>
          {/* Tin can body */}
          <rect x="248" y="84" width="144" height="172" rx="14" fill="#334155" stroke="#94a3b8" strokeWidth="2.5" />
          <ellipse cx="320" cy="84" rx="72" ry="12" fill="#475569" stroke="#cbd5e1" strokeWidth="2" />
          {/* Perforated geometric pattern */}
          <g fill="#fef08a">
            <circle cx="320" cy="130" r="6" />
            <circle cx="290" cy="155" r="5" />
            <circle cx="350" cy="155" r="5" />
            <circle cx="272" cy="182" r="4.5" />
            <circle cx="320" cy="182" r="7" />
            <circle cx="368" cy="182" r="4.5" />
            <circle cx="290" cy="210" r="5" />
            <circle cx="350" cy="210" r="5" />
            <circle cx="320" cy="232" r="5.5" />
          </g>
          {/* Wire handle */}
          <path d="M248 110 C248 44 392 44 392 110" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
        </svg>
      );
    case 'compost-bucket':
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-compost" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ecfdf5" />
              <stop offset="100%" stopColor="#f0f9ff" />
            </linearGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-compost)" />
          <circle cx="515" cy="240" r="95" fill="#dcfce7" opacity="0.7" />
          {/* Bottom collector bucket */}
          <path d="M230 185 L410 185 L395 272 C393 280 385 285 376 285 L264 285 C255 285 247 280 245 272 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          <rect x="222" y="176" width="196" height="14" rx="7" fill="#cbd5e1" />
          {/* Top digester bucket */}
          <path d="M225 82 L415 82 L402 176 L238 176 Z" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
          <rect x="216" y="70" width="208" height="16" rx="8" fill="#059669" />
          {/* Compost layers */}
          <rect x="242" y="138" width="156" height="30" rx="4" fill="#78350f" opacity="0.78" />
          <rect x="238" y="112" width="164" height="22" rx="4" fill="#d97706" opacity="0.32" />
          {/* Sprout icon */}
          <path d="M320 70 L320 42" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
          <path d="M320 46 C304 32 288 38 294 52 C298 60 312 56 320 46 Z" fill="#10b981" />
          <path d="M320 42 C336 26 352 34 346 48 C342 56 328 52 320 42 Z" fill="#059669" />
          {/* Tap on lower bucket */}
          <rect x="392" y="232" width="26" height="10" rx="4" fill="#0284c7" />
        </svg>
      );
    case 'cardboard-organizer':
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-card" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#eff4ff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-card)" />
          <ellipse cx="320" cy="268" rx="200" ry="22" fill="#cbd5e1" opacity="0.45" />
          {/* Tall back compartment wrapped in denim blue */}
          <rect x="195" y="78" width="110" height="180" rx="12" fill="#1e40af" fillOpacity="0.82" stroke="#1e3a8a" strokeWidth="2" />
          <line x1="205" y1="88" x2="295" y2="88" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="5 4" />
          {/* Pencils/tools sticking out */}
          <rect x="220" y="36" width="10" height="54" rx="3" transform="rotate(-8 225 63)" fill="#10b981" />
          <rect x="255" y="32" width="12" height="58" rx="3" transform="rotate(6 261 61)" fill="#f59e0b" />
          {/* Mid compartment */}
          <rect x="295" y="128" width="105" height="130" rx="12" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <rect x="315" y="96" width="52" height="44" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Front low kraft tray */}
          <rect x="372" y="176" width="110" height="82" rx="12" fill="#d6b28a" stroke="#a17a50" strokeWidth="2" />
          <circle cx="427" cy="217" r="14" fill="#ffffff" fillOpacity="0.6" />
        </svg>
      );
    case 'kitchen-scraps':
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-kitchen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f0fdf4" />
              <stop offset="100%" stopColor="#eff6ff" />
            </linearGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-kitchen)" />
          {/* Glass broth jar */}
          <rect x="242" y="84" width="156" height="184" rx="24" fill="#ffffff" fillOpacity="0.9" stroke="#059669" strokeOpacity="0.45" strokeWidth="2.5" />
          <rect x="258" y="64" width="124" height="22" rx="8" fill="#006948" />
          {/* Golden vegetable broth */}
          <rect x="252" y="138" width="136" height="120" rx="16" fill="#fbbf24" fillOpacity="0.38" />
          {/* Carrot, herb, onion shapes inside */}
          <circle cx="294" cy="196" r="14" fill="#f97316" opacity="0.82" />
          <circle cx="348" cy="212" r="12" fill="#fb923c" opacity="0.82" />
          <path d="M312 172 C328 154 352 162 340 182 C330 192 308 184 312 172 Z" fill="#10b981" opacity="0.85" />
          <circle cx="288" cy="230" r="9" fill="#a855f7" opacity="0.45" />
          {/* Steam waves */}
          <path d="M292 48 Q284 36 292 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
          <path d="M324 44 Q316 32 324 20" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
          <path d="M354 48 Q346 36 354 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case 'glass-terrarium':
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ecfdf5" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-glass)" />
          <rect x="235" y="76" width="170" height="196" rx="28" fill="#ffffff" fillOpacity="0.85" stroke="#059669" strokeWidth="2.5" />
          <rect x="260" y="58" width="120" height="20" rx="6" fill="#475569" />
          {/* Pebble + soil layers */}
          <rect x="245" y="226" width="150" height="36" rx="12" fill="#94a3b8" opacity="0.55" />
          <rect x="245" y="198" width="150" height="32" rx="6" fill="#5b4636" opacity="0.85" />
          {/* Moss & fern */}
          <path d="M250 198 Q285 182 320 194 T390 196 L390 206 L250 206 Z" fill="#10b981" />
          <path d="M320 192 C302 150 282 130 278 152 C275 170 302 184 320 192 Z" fill="#059669" />
          <path d="M320 192 C338 144 362 128 362 150 C362 170 338 184 320 192 Z" fill="#047857" />
        </svg>
      );
    case 'sorting-guide':
    default:
      return (
        <svg viewBox="0 0 640 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="bg-sort" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8f9ff" />
              <stop offset="100%" stopColor="#e5eeff" />
            </linearGradient>
          </defs>
          <rect width="640" height="320" fill="url(#bg-sort)" />
          {/* Clean lid half */}
          <rect x="135" y="88" width="160" height="145" rx="14" fill="#d6b28a" stroke="#059669" strokeWidth="3" />
          <path d="M190 160 L208 178 L244 142" fill="none" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Cut line */}
          <line x1="320" y1="64" x2="320" y2="256" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="8 6" />
          {/* Soiled base half */}
          <rect x="345" y="88" width="160" height="145" rx="14" fill="#c79e72" stroke="#ba1a1a" strokeWidth="2.5" strokeOpacity="0.6" />
          <circle cx="425" cy="160" r="32" fill="#92400e" opacity="0.28" />
          <circle cx="445" cy="145" r="14" fill="#92400e" opacity="0.24" />
          <path d="M408 143 L442 177 M442 143 L408 177" stroke="#ba1a1a" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
}
