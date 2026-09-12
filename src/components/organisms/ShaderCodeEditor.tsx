import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { ShaderRenderer } from '../../core/ShaderRenderer';
import { ResizableSplitter } from '../atoms/ResizableSplitter';
import { AlertTriangle, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';

interface CodeEditorPaneProps {
  code: string;
  onCodeChange: (code: string) => void;
  toolName: string;
  compileError: { message: string; line?: number } | null;
  className?: string;
  style?: React.CSSProperties;
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  code,
  onCodeChange,
  toolName,
  compileError,
  className = '',
  style
}) => {
  return (
    <div
      style={style}
      className={`flex flex-col h-full bg-[#1e1e1e] border-r border-neutral-800 overflow-hidden ${className}`}
    >
      {/* Editor Header */}
      <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono select-none">
        <span className="truncate">GLSL ES 3.00 — {toolName}.frag</span>
        {compileError ? (
          <span className="flex items-center gap-1.5 text-rose-400 text-[11px] shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
            Error {compileError.line ? `(Line ${compileError.line})` : ''}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Compiled OK
          </span>
        )}
      </div>

      {/* Compilation Error Banner */}
      {compileError && (
        <div className="px-3 py-1.5 bg-rose-950/80 border-b border-rose-800/60 text-rose-200 text-xs font-mono select-none flex items-center gap-2 overflow-x-auto">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="truncate">{compileError.message}</span>
        </div>
      )}

      {/* CodeMirror Editor with Exact Aligned Gutters */}
      <div className="relative flex-1 overflow-hidden">
        <CodeMirror
          value={code}
          height="100%"
          theme={vscodeDark}
          extensions={[cpp()]}
          onChange={val => onCodeChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full text-xs"
        />
      </div>
    </div>
  );
};

interface ViewportPaneProps {
  code: string;
  onError?: (err: { message: string; line?: number } | null) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ViewportPane: React.FC<ViewportPaneProps> = ({
  code,
  onError,
  className = '',
  style
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      style={style}
      className={`flex flex-col h-full bg-black relative overflow-hidden ${isFullscreen ? '!fixed !inset-0 !z-50 !w-full !h-full' : ''} ${className}`}
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 select-none">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg bg-neutral-900/80 backdrop-blur border border-neutral-700/50 text-neutral-300 hover:text-white cursor-pointer transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex-1 w-full h-full">
        <ShaderRenderer fragmentShader={code} onError={onError} />
      </div>
    </div>
  );
};

interface ShaderCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  toolName: string;
}

export const ShaderCodeEditor: React.FC<ShaderCodeEditorProps> = ({ code, onCodeChange, toolName }) => {
  const [editorWidthPercent, setEditorWidthPercent] = useState<number>(50);
  const [compileError, setCompileError] = useState<{ message: string; line?: number } | null>(null);

  const handleResize = (delta: number) => {
    const parentWidth = window.innerWidth - 320;
    if (parentWidth <= 0) return;
    const deltaPercent = (delta / parentWidth) * 100;
    setEditorWidthPercent(prev => Math.min(Math.max(prev + deltaPercent, 20), 80));
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-neutral-950 relative">
      <CodeEditorPane
        style={{ width: `${editorWidthPercent}%` }}
        code={code}
        onCodeChange={onCodeChange}
        toolName={toolName}
        compileError={compileError}
      />

      <ResizableSplitter direction="horizontal" onResize={handleResize} />

      <ViewportPane
        style={{ width: `${100 - editorWidthPercent}%` }}
        code={code}
        onError={setCompileError}
      />
    </div>
  );
};
