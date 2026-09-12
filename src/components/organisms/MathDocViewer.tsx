import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ShaderChallenge } from '../../types';
import { ChallengeCard } from '../molecules/ChallengeCard';
import { Button } from '../atoms/Button';
import { BookOpen, Edit3, Copy, Check, Eye } from 'lucide-react';

interface MathDocViewerProps {
  markdown: string;
  onMarkdownChange: (newMd: string) => void;
  toolName: string;
  challenge?: ShaderChallenge;
  onApplySolution?: (solution: string) => void;
}

export const MathDocViewer: React.FC<MathDocViewerProps> = ({
  markdown,
  onMarkdownChange,
  toolName,
  challenge,
  onApplySolution
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-text">
      {/* Header toolbar */}
      <div className="h-10 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2 text-indigo-300 font-mono truncate">
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Math & Code Docs — {toolName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="h-7 px-2.5 text-[11px]"
          >
            {isEditing ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
            {isEditing ? 'Rendered View' : 'Edit Markdown'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCopy}
            className="h-7 px-2.5 text-[11px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy Doc'}
          </Button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-auto p-6">
        {isEditing ? (
          <textarea
            value={markdown}
            onChange={e => onMarkdownChange(e.target.value)}
            className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-indigo-100 resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
            spellCheck={false}
          />
        ) : (
          <div className="max-w-4xl mx-auto math-doc-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {markdown}
            </ReactMarkdown>

            {challenge && onApplySolution && (
              <ChallengeCard challenge={challenge} onApplySolution={onApplySolution} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
