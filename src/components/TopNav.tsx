import React from 'react';
import {Plus} from 'lucide-react';
import {NavSection} from '../types/eco';
import {BrandLogo} from './BrandLogo';

interface TopNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenComposer: () => void;
}

const NAV_ITEMS: Array<{id: NavSection; label: string}> = [
  {id: 'feed', label: 'Comunidade'},
  {id: 'scrap-art', label: 'Arte com Sucata'},
  {id: 'triage', label: 'Guia de Triagem'},
  {id: 'challenges', label: 'Desafios'},
];

export const TopNav: React.FC<TopNavProps> = ({
  activeSection,
  onSelectSection,
  onOpenComposer,
}) => {
  return (
    <header className="sticky top-0 z-40 eco-glass border-b border-[#bccac0]/40">
      <div className="mx-auto flex h-14 md:h-16 max-w-[1280px] items-center justify-between gap-8 px-4 md:px-6 lg:px-10">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectSection('feed')}
          className="flex items-center whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284c7] rounded-lg"
        >
          <BrandLogo variant="compact" />
        </button>

        {/* Zone 2: 4 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => {
            const isActive =
              activeSection === item.id ||
              (item.id === 'feed' && activeSection === 'saved');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`relative py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284c7] ${
                  isActive
                    ? 'text-[#006948]'
                    : 'text-[#3d4a42] hover:text-[#0b1c30]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#10b981]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenComposer}
            className="eco-cta-gradient inline-flex min-h-[40px] items-center gap-2 rounded-full px-4 py-2 text-xs md:text-sm font-bold text-white whitespace-nowrap shrink-0 transition-transform duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Publicar Dica</span>
          </button>
        </div>
      </div>
    </header>
  );
};
