import React, {useEffect, useState} from 'react';
import {Check, Clock, Copy, MapPin, Navigation, X} from 'lucide-react';
import {DropOffPoint, MaterialType} from '../types/eco';

interface EcopontosMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  dropOffPoints: DropOffPoint[];
  initialMaterial?: MaterialType;
  initialPointId?: string;
  onFilterFeedByMaterial: (material: MaterialType) => void;
}

const MAP_MATERIAL_FILTERS: MaterialType[] = [
  MaterialType.ALL,
  MaterialType.PET,
  MaterialType.ALUMINUM,
  MaterialType.GLASS,
  MaterialType.CARDBOARD,
  MaterialType.ORGANIC,
  MaterialType.TEXTILE,
];

export const EcopontosMapModal: React.FC<EcopontosMapModalProps> = ({
  isOpen,
  onClose,
  dropOffPoints,
  initialMaterial = MaterialType.ALL,
  initialPointId,
  onFilterFeedByMaterial,
}) => {
  const [materialFilter, setMaterialFilter] =
    useState<MaterialType>(initialMaterial);
  const [selectedPointId, setSelectedPointId] = useState<string>(
    initialPointId || dropOffPoints[0]?.id || '',
  );
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = async (addressText: string) => {
    try {
      await navigator.clipboard.writeText(addressText);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      setCopiedAddress(false);
    }
  };

  useEffect(() => {
    setMaterialFilter(initialMaterial);
    if (initialPointId) {
      setSelectedPointId(initialPointId);
    } else if (initialMaterial !== MaterialType.ALL) {
      const matching = dropOffPoints.find((p) =>
        p.acceptedMaterials.includes(initialMaterial),
      );
      if (matching) setSelectedPointId(matching.id);
    }
  }, [initialMaterial, initialPointId, dropOffPoints, isOpen]);

  if (!isOpen) return null;

  const matchingPoints =
    materialFilter === MaterialType.ALL
      ? dropOffPoints
      : dropOffPoints.filter((p) => p.acceptedMaterials.includes(materialFilter));

  const activePoint =
    matchingPoints.find((p) => p.id === selectedPointId) ||
    matchingPoints[0] ||
    dropOffPoints[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0b1c30]/45 backdrop-blur-sm p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ecopontos-map-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(11,28,48,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="ecopontos-map-title"
              className="text-xl font-extrabold tracking-tight text-[#0b1c30]"
            >
              Mapa de Ecopontos e Cooperativas
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#3d4a42]">
              Selecione um ponto no mapa ou filtre por material para saber onde entregar seus recicláveis limpos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar mapa"
            className="flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Material Filters */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {MAP_MATERIAL_FILTERS.map((mat) => {
            const active = materialFilter === mat;
            return (
              <button
                key={mat}
                type="button"
                onClick={() => {
                  setMaterialFilter(mat);
                  if (mat !== MaterialType.ALL) {
                    const firstMatch = dropOffPoints.find((p) =>
                      p.acceptedMaterials.includes(mat),
                    );
                    if (firstMatch) setSelectedPointId(firstMatch.id);
                  }
                }}
                className={`min-h-[36px] rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#006398] text-white'
                    : 'bg-[#eff4ff] text-[#3d4a42] hover:bg-[#dce9ff]'
                }`}
              >
                {mat === MaterialType.ALL ? 'Todos os materiais' : mat}
              </button>
            );
          })}
        </div>

        {/* Interactive Neighborhood Vector Map */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          <div className="md:col-span-7 relative min-h-[260px] overflow-hidden rounded-3xl border border-[#bccac0]/45 bg-[#eff4ff]">
            {/* Clean neighborhood SVG backdrop */}
            <svg
              viewBox="0 0 400 280"
              className="h-full w-full block"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <rect width="400" height="280" fill="#eff4ff" />
              {/* Park green areas */}
              <rect x="28" y="26" width="96" height="66" rx="18" fill="#d1fae5" opacity="0.7" />
              <rect x="245" y="168" width="118" height="82" rx="22" fill="#dcfce7" opacity="0.75" />
              {/* Stream / river */}
              <path
                d="M0 165 Q120 140 215 162 T400 132"
                fill="none"
                stroke="#bae6fd"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Clean street grid */}
              <g stroke="#ffffff" strokeWidth="4" opacity="0.9">
                <line x1="0" y1="75" x2="400" y2="75" />
                <line x1="0" y1="195" x2="400" y2="195" />
                <line x1="95" y1="0" x2="95" y2="280" />
                <line x1="210" y1="0" x2="210" y2="280" />
                <line x1="315" y1="0" x2="315" y2="280" />
              </g>
              {/* User origin marker */}
              <circle cx="200" cy="140" r="14" fill="#0ea5e9" fillOpacity="0.16" />
              <circle cx="200" cy="140" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Interactive Drop-Off Pins */}
            {dropOffPoints.map((point) => {
              const matchesFilter =
                materialFilter === MaterialType.ALL ||
                point.acceptedMaterials.includes(materialFilter);
              const isSelected = activePoint?.id === point.id;

              return (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => setSelectedPointId(point.id)}
                  style={{left: `${point.mapX}%`, top: `${point.mapY}%`}}
                  aria-label={`${point.name}, ${point.distanceKm}`}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-md transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                    isSelected
                      ? 'z-20 scale-105 bg-[#006948] text-white ring-4 ring-[#10b981]/30'
                      : matchesFilter
                        ? 'z-10 bg-white text-[#0b1c30] hover:bg-[#e6f7f1]'
                        : 'z-0 bg-white/60 text-[#6d7a72] opacity-55'
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{point.district}</span>
                </button>
              );
            })}

            <div className="pointer-events-none absolute bottom-3 left-3 eco-glass rounded-full px-3 py-1 text-[11px] font-semibold text-[#0b1c30]">
              Sua localização aproximada · Centro
            </div>
          </div>

          {/* Selected Station Details */}
          <div className="md:col-span-5 flex flex-col justify-between rounded-3xl bg-[#f8f9ff] border border-[#bccac0]/35 p-5">
            {activePoint ? (
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-[#006948]">
                    {activePoint.district}
                  </span>
                  <span className="text-xs font-bold text-[#006398] tabular-nums">
                    {activePoint.distanceKm} de você
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-extrabold text-[#0b1c30]">
                  {activePoint.name}
                </h3>

                <div className="mt-3 space-y-2 text-xs text-[#3d4a42]">
                  <p className="flex items-start gap-2">
                    <Navigation
                      className="h-4 w-4 shrink-0 text-[#0284c7] mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{activePoint.address}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock
                      className="h-4 w-4 shrink-0 text-[#059669] mt-0.5"
                      aria-hidden="true"
                    />
                    <span>{activePoint.hours}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyAddress(
                      `${activePoint.name} - ${activePoint.address} (${activePoint.district})`,
                    )
                  }
                  className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white border border-[#bccac0]/45 px-3.5 py-1.5 text-xs font-bold text-[#006398] hover:bg-[#eff4ff] transition-colors"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#059669]" aria-hidden="true" />
                      <span>Endereço copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copiar endereço</span>
                    </>
                  )}
                </button>

                <div className="mt-4 pt-4 border-t border-[#bccac0]/30">
                  <p className="text-xs font-semibold text-[#6d7a72] mb-2">
                    Materiais aceitos neste ponto
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {activePoint.acceptedMaterials.map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => {
                          onFilterFeedByMaterial(mat);
                          onClose();
                        }}
                        className="rounded-full bg-white border border-[#bccac0]/45 px-3 py-1 text-[11px] font-semibold text-[#0b1c30] hover:border-[#059669] hover:text-[#006948]"
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6d7a72]">
                Nenhum ponto disponível para este filtro.
              </p>
            )}

            {materialFilter !== MaterialType.ALL && (
              <button
                type="button"
                onClick={() => {
                  onFilterFeedByMaterial(materialFilter);
                  onClose();
                }}
                className="mt-5 eco-cta-gradient w-full min-h-[42px] rounded-full px-4 text-xs font-bold text-white"
              >
                Ver dicas de {materialFilter} no feed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
