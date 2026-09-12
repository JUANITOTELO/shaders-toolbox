import React from 'react';
import { Terminal, Cpu, CheckCircle2 } from 'lucide-react';

export const StatusBar: React.FC<{ fps: number; activeTool: string }> = ({ fps, activeTool }) => {
  return (
    <footer className="h-7 bg-neutral-900 border-t border-neutral-800 px-4 flex items-center justify-between text-[11px] font-mono text-neutral-400 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>GLSL ES 3.00 Compiled</span>
        </div>
        <span className="text-neutral-700">|</span>
        <span>Active: <strong className="text-neutral-200">{activeTool}</strong></span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>FPS: <strong className="text-neutral-200">{fps}</strong></span>
        </div>
        <span className="text-neutral-700">|</span>
        <span>WebGL2 Context</span>
        <span className="text-neutral-700">|</span>
        <span>UTF-8</span>
      </div>
    </footer>
  );
};
