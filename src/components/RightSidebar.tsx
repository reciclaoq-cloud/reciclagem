import React from 'react';
import {LogOut, MapPin, RotateCcw} from 'lucide-react';
import {DropOffPoint, HabitItem, MaterialType} from '../types/eco';
import {AuthUser} from './LoginScreen';

interface RightSidebarProps {
  currentUser: AuthUser;
  onLogout: () => void;
  onOpenProfile: () => void;
  habits: HabitItem[];
  onToggleHabit: (habitId: string) => void;
  onResetHabits: () => void;
  dropOffPoints: DropOffPoint[];
  selectedMaterial: MaterialType;
  onOpenDropOffMap: (material?: MaterialType, pointId?: string) => void;
  bonusPoints: number;
  bonusKg: number;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentUser,
  onLogout,
  onOpenProfile,
  habits,
  onToggleHabit,
  onResetHabits,
  dropOffPoints,
  selectedMaterial,
  onOpenDropOffMap,
  bonusPoints,
  bonusKg,
}) => {
  const completedHabits = habits.filter((h) => h.completed);
  const completedCount = completedHabits.length;
  const totalCount = habits.length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;

  const habitPoints = completedHabits.reduce((sum, h) => sum + h.points, 0);
  const habitKg = completedHabits.reduce((sum, h) => sum + h.kgSaved, 0);

  const totalPoints = 140 + habitPoints + bonusPoints;
  const totalKg = (3.4 + habitKg + bonusKg).toFixed(2).replace('.', ',');

  const filteredPoints =
    selectedMaterial === MaterialType.ALL
      ? dropOffPoints
      : dropOffPoints.filter((point) =>
          point.acceptedMaterials.includes(selectedMaterial),
        );

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progressRatio);

  return (
    <aside className="space-y-6">
      {/* Personal Eco-Impact & Daily Habits */}
      <section className="eco-card rounded-3xl p-5" aria-label="Seu impacto diário">
        <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#bccac0]/35">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 min-w-0 text-left group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0f2fe] text-xs font-bold text-[#006398] group-hover:bg-[#cce5ff] transition-colors"
              aria-hidden="true"
            >
              {currentUser.initials}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0b1c30] group-hover:text-[#006948] truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-[#6d7a72] truncate">
                {currentUser.neighborhood} · Ver perfil
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-[#eff4ff] px-3 py-1 text-xs font-semibold text-[#006398] hover:bg-[#dce9ff] whitespace-nowrap shrink-0 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#6d7a72]">
              Seu impacto na semana
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#0b1c30] tabular-nums">
              {totalKg} kg
            </p>
            <p className="text-xs font-medium text-[#3d4a42] tabular-nums">
              desviados de aterros · {totalPoints} pts eco
            </p>
          </div>

          <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center"
            aria-label={`${completedCount} de ${totalCount} hábitos de hoje concluídos`}
          >
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke="#e5eeff"
                strokeWidth="6"
              />
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute text-xs font-bold text-[#006948] tabular-nums">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        <div className="my-5 border-t border-[#bccac0]/35" />

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#0b1c30]">
            Hábitos de hoje
          </h2>
          {completedCount > 0 && (
            <button
              type="button"
              onClick={onResetHabits}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6d7a72] hover:text-[#0b1c30]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Zerar dia</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-[#bccac0]/25">
          {habits.map((habit) => (
            <label
              key={habit.id}
              className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-[13px] font-semibold leading-snug transition-colors ${
                    habit.completed ? 'text-[#006948]' : 'text-[#0b1c30]'
                  }`}
                >
                  {habit.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#6d7a72] tabular-nums">
                  {habit.impactLabel} · +{habit.points} pts
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={habit.completed}
                aria-label={habit.label}
                onClick={() => onToggleHabit(habit.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                  habit.completed ? 'bg-[#10b981]' : 'bg-[#cbd5e1]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    habit.completed ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </section>

      {/* Nearby Collection Station Map & Drop-Off Points */}
      <section className="eco-card rounded-3xl p-5" aria-label="Pontos de coleta próximos">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#0b1c30]">
            <MapPin className="h-4 w-4 text-[#0284c7]" aria-hidden="true" />
            <span>Ecopontos próximos</span>
          </h2>
          <button
            type="button"
            onClick={() => onOpenDropOffMap(selectedMaterial)}
            className="text-xs font-bold text-[#0284c7] hover:underline whitespace-nowrap"
          >
            Abrir mapa
          </button>
        </div>

        {/* Mini Interactive Collection Station Map Preview */}
        <div className="relative mb-4 h-32 w-full overflow-hidden rounded-2xl border border-[#bccac0]/35 bg-[#eff4ff]">
          <svg
            viewBox="0 0 280 140"
            className="h-full w-full block"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <rect width="280" height="140" fill="#eff4ff" />
            <rect x="18" y="14" width="66" height="38" rx="10" fill="#d1fae5" opacity="0.7" />
            <rect x="180" y="84" width="76" height="44" rx="12" fill="#dcfce7" opacity="0.7" />
            <path d="M0 84 Q90 66 165 82 T280 68" fill="none" stroke="#bae6fd" strokeWidth="9" />
            <g stroke="#ffffff" strokeWidth="2.5" opacity="0.9">
              <line x1="0" y1="42" x2="280" y2="42" />
              <line x1="0" y1="102" x2="280" y2="102" />
              <line x1="72" y1="0" x2="72" y2="140" />
              <line x1="152" y1="0" x2="152" y2="140" />
              <line x1="224" y1="0" x2="224" y2="140" />
            </g>
          </svg>

          {dropOffPoints.map((point) => {
            const active =
              selectedMaterial === MaterialType.ALL ||
              point.acceptedMaterials.includes(selectedMaterial);
            return (
              <button
                key={point.id}
                type="button"
                onClick={() => onOpenDropOffMap(selectedMaterial, point.id)}
                title={`${point.name} (${point.distanceKm})`}
                style={{left: `${point.mapX}%`, top: `${point.mapY}%`}}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-110 ${
                  active
                    ? 'bg-[#006948] text-white ring-3 ring-[#10b981]/25'
                    : 'bg-white/80 text-[#6d7a72] opacity-60'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {filteredPoints.length === 0 ? (
          <p className="text-xs text-[#6d7a72] py-2">
            Nenhum ecoponto cadastrado para o filtro atual. Limpe o filtro de material para ver todos os pontos.
          </p>
        ) : (
          <ul className="divide-y divide-[#bccac0]/25">
            {filteredPoints.map((point) => (
              <li key={point.id} className="py-2.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => onOpenDropOffMap(selectedMaterial, point.id)}
                  className="w-full text-left group"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-bold text-[#0b1c30] group-hover:text-[#006948] truncate">
                      {point.name}
                    </p>
                    <span className="text-xs font-semibold text-[#0284c7] shrink-0 tabular-nums">
                      {point.distanceKm}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#6d7a72]">
                    {point.district} · {point.hours}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};
