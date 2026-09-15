import React from 'react';
import { Button } from '../atoms/Button';
import { Wand2, Download, FolderOpen, Save, Sparkles, Code2, BookOpen, Columns, ChevronLeft, ChevronRight, CheckCircle2, Settings } from 'lucide-react';

interface HeaderNavProps {
  presetName: string;
  onPresetNameChange: (name: string) => void;
  section: string;
  lessonNumber: number;
  totalLessons: number;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onPrevLesson: () => void;
  onNextLesson: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  activeView: 'code' | 'docs' | 'split';
  onViewChange: (view: 'code' | 'docs' | 'split') => void;
  onFormat: () => void;
  onSnapshot: () => void;
  onOpenPresets: () => void;
  onSave: () => void;
  savedStatus: string;
  onEditToolMetadata?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  presetName,
  onPresetNameChange,
  section,
  lessonNumber,
  totalLessons,
  isCompleted,
  onToggleComplete,
  onPrevLesson,
  onNextLesson,
  hasPrev,
  hasNext,
  activeView,
  onViewChange,
  onFormat,
  onSnapshot,
  onOpenPresets,
  onSave,
  savedStatus,
  onEditToolMetadata
}) => {
  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ShaderStudio IDE</span>
        </div>

        {/* Sequential Lesson Navigation */}
        <div className="flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800 text-xs font-mono text-neutral-300">
          <button
            onClick={onPrevLesson}
            disabled={!hasPrev}
            className="p-0.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Previous Lesson"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] px-1 font-semibold text-indigo-300">
            {lessonNumber}/{totalLessons}
          </span>
          <button
            onClick={onNextLesson}
            disabled={!hasNext}
            className="p-0.5 rounded hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
            title="Next Lesson"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleComplete}
            className={`ml-1 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
              isCompleted ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Mark Lesson Completed"
          >
            <CheckCircle2 className="w-3 h-3" />
            {isCompleted ? 'Done' : 'Mark'}
          </button>
        </div>

        <span className="text-neutral-600">/</span>
        <input
          type="text"
          value={presetName}
          onChange={e => onPresetNameChange(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-indigo-500 rounded px-2.5 py-1 text-xs font-medium text-neutral-100 focus:outline-none transition-colors w-44 truncate"
        />
        {savedStatus && (
          <span className="text-xs font-medium text-emerald-400 animate-fade-in">{savedStatus}</span>
        )}
      </div>

      {/* Center View Selector Tabs */}
      <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-mono">
        <button
          onClick={() => onViewChange('code')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded cursor-pointer transition-colors ${
            activeView === 'code' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code (GLSL)</span>
        </button>
        <button
          onClick={() => onViewChange('docs')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded cursor-pointer transition-colors ${
            activeView === 'docs' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Math & Docs</span>
        </button>
        <button
          onClick={() => onViewChange('split')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded cursor-pointer transition-colors ${
            activeView === 'split' ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Split View</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onFormat} className="h-8 px-2.5 text-xs" title="Format GLSL">
          <Wand2 className="w-3.5 h-3.5" />
          Format
        </Button>
        <Button variant="outline" onClick={onSnapshot} className="h-8 px-2.5 text-xs" title="Snapshot PNG">
          <Download className="w-3.5 h-3.5" />
          Snapshot
        </Button>
        <Button variant="outline" onClick={onOpenPresets} className="h-8 px-2.5 text-xs">
          <FolderOpen className="w-3.5 h-3.5" />
          Presets
        </Button>
        {onEditToolMetadata && (
          <Button variant="outline" onClick={onEditToolMetadata} className="h-8 px-2.5 text-xs" title="Edit Tool Metadata">
            <Settings className="w-3.5 h-3.5" />
            Tool Info
          </Button>
        )}
        <Button onClick={onSave} className="h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-500">
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
      </div>
    </header>
  );
};
