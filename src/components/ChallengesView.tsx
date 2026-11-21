import React from 'react';
import {Check, Trophy, Users} from 'lucide-react';
import {DailyChallenge, PostCategory} from '../types/eco';

interface ChallengesViewProps {
  challenges: DailyChallenge[];
  onToggleJoin: (challengeId: string) => void;
  onToggleStep: (challengeId: string, stepIndex: number) => void;
}

const CATEGORY_TEXT: Record<Exclude<PostCategory, PostCategory.ALL>, string> = {
  [PostCategory.RECYCLING]: 'Reciclagem Prática',
  [PostCategory.ZERO_WASTE]: 'Zero Desperdício',
  [PostCategory.SCRAP_ART]: 'Arte com Sucata',
};

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  challenges,
  onToggleJoin,
  onToggleStep,
}) => {
  return (
    <div className="space-y-5">
      <div className="eco-card rounded-3xl p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e6f7f1] text-[#006948]">
            <Trophy className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0b1c30]">
              Desafios Coletivos
            </h1>
            <p className="text-sm text-[#3d4a42]">
              Participe de missões semanais com a vizinhança para reduzir desperdício e dar novo uso às sucatas.
            </p>
          </div>
        </div>
      </div>

      {challenges.map((challenge) => {
        const progressPercent = Math.min(
          100,
          Math.round(
            (challenge.currentParticipants / challenge.targetParticipants) * 100,
          ),
        );

        return (
          <article key={challenge.id} className="eco-card rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#006948]">
                  {CATEGORY_TEXT[challenge.category]} · {challenge.deadlineLabel} · +{challenge.rewardPoints} pts eco
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#0b1c30]">
                  {challenge.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onToggleJoin(challenge.id)}
                className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284c7] ${
                  challenge.joined
                    ? 'bg-[#e6f7f1] text-[#006948] hover:bg-[#d1fae5]'
                    : 'eco-cta-gradient text-white'
                }`}
              >
                {challenge.joined ? 'Participando' : 'Participar do desafio'}
              </button>
            </div>

            <p className="mt-2.5 text-sm leading-relaxed text-[#3d4a42]">
              {challenge.description}
            </p>

            {/* Collective Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#6d7a72] tabular-nums mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#0284c7]" aria-hidden="true" />
                  <span>
                    {challenge.currentParticipants} de {challenge.targetParticipants} participantes
                  </span>
                </span>
                <span className="text-[#006398]">{progressPercent}% da meta</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e5eeff]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#0284c7] transition-all duration-300"
                  style={{width: `${progressPercent}%`}}
                />
              </div>
            </div>

            {/* Action Checklist */}
            <div className="mt-5 pt-4 border-t border-[#bccac0]/30 space-y-2">
              <p className="text-xs font-semibold text-[#6d7a72]">
                Ações práticas do desafio
              </p>
              {challenge.actionChecklist.map((step, index) => {
                const isDone = challenge.completedSteps.includes(index);
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => onToggleStep(challenge.id, index)}
                    className="flex w-full min-h-[40px] items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-colors hover:bg-[#f8f9ff]"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        isDone
                          ? 'border-[#10b981] bg-[#10b981] text-white'
                          : 'border-[#bccac0] bg-white'
                      }`}
                    >
                      {isDone && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    </span>
                    <span
                      className={
                        isDone
                          ? 'font-medium text-[#006948] line-through'
                          : 'font-medium text-[#0b1c30]'
                      }
                    >
                      {step}
                    </span>
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
};
