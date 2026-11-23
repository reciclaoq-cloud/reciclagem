import React from 'react';
import {
  Bookmark,
  Compass,
  Palette,
  ScanSearch,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {NavSection} from '../types/eco';

interface MobileBottomNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

const MOBILE_TABS: Array<{
  id: NavSection;
  label: string;
  Icon: React.ComponentType<{className?: string}>;
}> = [
  {id: 'feed', label: 'Feed', Icon: Compass},
  {id: 'scrap-art', label: 'Sucata', Icon: Palette},
  {id: 'ai-reuse', label: 'IA', Icon: Sparkles},
  {id: 'triage', label: 'Triagem', Icon: ScanSearch},
  {id: 'challenges', label: 'Desafios', Icon: Trophy},
  {id: 'saved', label: 'Salvos', Icon: Bookmark},
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeSection,
  onSelectSection,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden eco-glass border-t border-[#bccac0]/45"
      aria-label="Navegação rápida"
    >
      <div className="grid grid-cols-6 h-14 items-center px-1">
        {MOBILE_TABS.map(({id, label, Icon}) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectSection(id)}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl transition-colors duration-150 ${
                isActive ? 'text-[#006948]' : 'text-[#3d4a42]'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
