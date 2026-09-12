import React, { useState } from 'react';
import { ShaderChallenge } from '../../types';
import { Button } from '../atoms/Button';
import { Target, HelpCircle, Lightbulb, CheckCircle2 } from 'lucide-react';

interface ChallengeCardProps {
  challenge: ShaderChallenge;
  onApplySolution: (solution: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onApplySolution }) => {
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);

  const handleApply = () => {
    onApplySolution(challenge.solution);
    setSolved(true);
    setTimeout(() => setSolved(false), 3000);
  };

  return (
    <div className="mt-6 p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
          <Target className="w-4 h-4 text-indigo-400" />
          <span>Interactive Coding Challenge</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHint(!showHint)}
            className="h-7 px-2.5 text-[11px] border-indigo-800/50 hover:bg-indigo-900/30"
          >
            <HelpCircle className="w-3 h-3 text-indigo-400" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleApply}
            className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {solved ? <CheckCircle2 className="w-3 h-3 text-emerald-300" /> : <Lightbulb className="w-3 h-3" />}
            {solved ? 'Solution Loaded' : 'Load Solution'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-indigo-100/90 leading-relaxed font-sans">
        {challenge.prompt}
      </p>

      {showHint && (
        <div className="mt-3 p-3 rounded-lg bg-neutral-900/90 border border-indigo-900/50 text-[11px] font-mono text-indigo-300 animate-fade-in">
          <strong className="text-indigo-200">Hint: </strong>{challenge.hint}
        </div>
      )}
    </div>
  );
};
