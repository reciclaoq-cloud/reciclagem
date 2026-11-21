import React from 'react';
import {
  Bookmark,
  Compass,
  Filter,
  Palette,
  ScanSearch,
  Trophy,
} from 'lucide-react';
import {MaterialType, NavSection} from '../types/eco';

interface LeftSidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  selectedMaterial: MaterialType;
  onSelectMaterial: (material: MaterialType) => void;
  savedCount: number;
  totalPosts: number;
}

const COMMUNITY_LINKS: Array<{
  id: NavSection;
  label: string;
  Icon: React.ComponentType<{className?: string}>;
}> = [
  {id: 'feed', label: 'Feed da Comunidade', Icon: Compass},
  {id: 'scrap-art', label: 'Arte com Sucata', Icon: Palette},
  {id: 'triage', label: 'Guia de Triagem', Icon: ScanSearch},
  {id: 'challenges', label: 'Desafios Diários', Icon: Trophy},
  {id: 'saved', label: 'Dicas Salvas', Icon: Bookmark},
];

const MATERIAL_FILTERS: MaterialType[] = [
  MaterialType.ALL,
  MaterialType.PET,
  MaterialType.ALUMINUM,
  MaterialType.GLASS,
  MaterialType.CARDBOARD,
  MaterialType.ORGANIC,
  MaterialType.TEXTILE,
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeSection,
  onSelectSection,
  selectedMaterial,
  onSelectMaterial,
  savedCount,
  totalPosts,
}) => {
  return (
    <aside className="space-y-6">
      <div className="eco-card rounded-3xl p-5">
        <h2 className="text-xs font-semibold tracking-wide text-[#6d7a72] mb-3">
          Navegação
        </h2>
        <nav className="space-y-1" aria-label="Menu da comunidade">
          {COMMUNITY_LINKS.map(({id, label, Icon}) => {
            const isActive = activeSection === id;
            const trailing =
              id === 'saved'
                ? savedCount
                : id === 'feed'
                  ? totalPosts
                  : undefined;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectSection(id)}
                className={`flex w-full min-h-[44px] items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                  isActive
                    ? 'bg-[#e6f7f1] text-[#006948]'
                    : 'text-[#3d4a42] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-[#059669]' : 'text-[#6d7a72]'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{label}</span>
                </span>
                {typeof trailing === 'number' && (
                  <span className="tabular-nums text-xs font-semibold text-[#6d7a72]">
                    {trailing}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="my-5 border-t border-[#bccac0]/35" />

        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#6d7a72]">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Filtrar por material</span>
          </h2>
          {selectedMaterial !== MaterialType.ALL && (
            <button
              type="button"
              onClick={() => onSelectMaterial(MaterialType.ALL)}
              className="text-xs font-semibold text-[#0284c7] hover:underline"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {MATERIAL_FILTERS.map((material) => {
            const isSelected = selectedMaterial === material;
            const label =
              material === MaterialType.ALL ? 'Todos' : material;
            return (
              <button
                key={material}
                type="button"
                onClick={() => {
                  onSelectMaterial(material);
                  if (activeSection === 'triage' || activeSection === 'challenges') {
                    onSelectSection('feed');
                  }
                }}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                  isSelected
                    ? 'bg-[#006398] text-white'
                    : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff] hover:text-[#0b1c30]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
