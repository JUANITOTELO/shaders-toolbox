import React from 'react';
import { ShaderTool, DifficultyTier } from '../../types';

interface ToolCardProps {
  tool: ShaderTool;
  isSelected: boolean;
  onSelect: (tool: ShaderTool) => void;
  isCompleted?: boolean;
}

const difficultyColors: Record<DifficultyTier, string> = {
  Beginner: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
  Intermediate: 'bg-sky-950 text-sky-300 border-sky-800/60',
  Advanced: 'bg-purple-950 text-purple-300 border-purple-800/60',
  Hero: 'bg-amber-950 text-amber-300 border-amber-800/60'
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, isSelected, onSelect, isCompleted = false }) => {
  return (
    <div
      onClick={() => onSelect(tool)}
      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
        isSelected
          ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50'
          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-[10px] font-mono text-neutral-500">#{tool.orderIndex}</span>
          <h3 className="font-semibold text-xs text-neutral-100 truncate">{tool.name}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${difficultyColors[tool.difficulty]}`}>
            {tool.difficulty}
          </span>
          {isCompleted && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Completed" />
          )}
        </div>
      </div>
      <p className="text-[11px] text-neutral-400 line-clamp-1">{tool.description}</p>
    </div>
  );
};
