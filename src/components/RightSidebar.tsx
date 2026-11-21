import React from 'react';
import {LogOut, MapPin, RotateCcw} from 'lucide-react';
import {DropOffPoint, HabitItem, MaterialType} from '../types/eco';
import {AuthUser} from './LoginScreen';

interface RightSidebarProps {
  currentUser: AuthUser;
  onLogout: () => void;
  habits: HabitItem[];
  onToggleHabit: (habitId: string) => void;
  onResetHabits: () => void;
  dropOffPoints: DropOffPoint[];
  selectedMaterial: MaterialType;
  bonusPoints: number;
  bonusKg: number;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentUser,
  onLogout,
  habits,
  onToggleHabit,
  onResetHabits,
  dropOffPoints,
  selectedMaterial,
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
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e0f2fe] text-xs font-bold text-[#006398]"
              aria-hidden="true"
            >
              {currentUser.initials}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0b1c30] truncate">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-[#6d7a72] truncate">
                {currentUser.neighborhood}
              </p>
            </div>
          </div>

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

      {/* Nearby Drop-Off Points */}
      <section className="eco-card rounded-3xl p-5" aria-label="Pontos de coleta próximos">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#0b1c30]">
            <MapPin className="h-4 w-4 text-[#0284c7]" aria-hidden="true" />
            <span>Ecopontos próximos</span>
          </h2>
          <span className="text-xs font-medium text-[#6d7a72] tabular-nums">
            {filteredPoints.length} locais
          </span>
        </div>

        {filteredPoints.length === 0 ? (
          <p className="text-xs text-[#6d7a72] py-2">
            Nenhum ecoponto cadastrado para o filtro atual. Limpe o filtro de material para ver todos os pontos.
          </p>
        ) : (
          <ul className="divide-y divide-[#bccac0]/25">
            {filteredPoints.map((point) => (
              <li key={point.id} className="py-3 first:pt-1 last:pb-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-bold text-[#0b1c30] truncate">
                    {point.name}
                  </p>
                  <span className="text-xs font-semibold text-[#0284c7] shrink-0 tabular-nums">
                    {point.distanceKm}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#6d7a72]">
                  {point.district} · {point.hours}
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#3d4a42]">
                  Recebe: {point.acceptedMaterials.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};
