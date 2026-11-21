import React, {useState} from 'react';
import {Box} from 'lucide-react';
import {IllustrationTheme} from '../types/eco';

interface EcoIllustrationProps {
  theme: IllustrationTheme;
  customImageUrl?: string;
  alt: string;
  className?: string;
}

export const THEME_3D_IMAGE: Record<IllustrationTheme, string> = {
  'pet-planter': '/src/assets/images/render_3d_artesanato_1795274880003.jpg',
  'craft-artesanato': '/src/assets/images/render_3d_artesanato_1795274880003.jpg',
  'craft-jogos': '/src/assets/images/render_3d_jogos_brinquedos_1795274878916.jpg',
  'tin-lantern': '/src/assets/images/render_3d_decoracao_1795274878891.jpg',
  'glass-terrarium': '/src/assets/images/render_3d_decoracao_1795274878891.jpg',
  'cardboard-organizer': '/src/assets/images/render_3d_decoracao_1795274878891.jpg',
  'craft-decoracao': '/src/assets/images/render_3d_decoracao_1795274878891.jpg',
  'craft-instrumentos': '/src/assets/images/render_3d_instrumentos_1795274879362.jpg',
  'compost-bucket': '/src/assets/images/render_3d_composteira_1795274878531.jpg',
  'kitchen-scraps': '/src/assets/images/render_3d_composteira_1795274878531.jpg',
  'water-rinse': '/src/assets/images/render_3d_triagem_reciclagem_1795274879455.jpg',
  'sorting-guide': '/src/assets/images/render_3d_triagem_reciclagem_1795274879455.jpg',
};

export const EcoIllustration: React.FC<EcoIllustrationProps> = ({
  theme,
  customImageUrl,
  alt,
  className = 'w-full h-56',
}) => {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = customImageUrl || THEME_3D_IMAGE[theme];

  if (!imgError && resolvedSrc) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#bccac0]/35 bg-gradient-to-br from-[#eff4ff] via-[#f8f9ff] to-[#e6f7f1] ${className}`}
      >
        <img
          src={resolvedSrc}
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
      className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-[#bccac0]/35 bg-gradient-to-br from-[#e0f2fe] via-[#f8f9ff] to-[#e6f7f1] p-6 text-center ${className}`}
      role="img"
      aria-label={alt}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85 text-[#006948] shadow-xs">
        <Box className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="max-w-xs text-xs font-semibold text-[#3d4a42] line-clamp-2">
        {alt}
      </p>
    </div>
  );
};
