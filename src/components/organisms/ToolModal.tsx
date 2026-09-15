import React, { useState, useEffect } from 'react';
import { ShaderTool, DifficultyTier } from '../../types';
import { X, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';

interface ToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (toolData: Partial<ShaderTool>) => Promise<void>;
  initialTool?: ShaderTool | null;
  existingSections: string[];
}

export const ToolModal: React.FC<ToolModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTool,
  existingSections
}) => {
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [customSection, setCustomSection] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyTier>('Beginner');
  const [orderIndex, setOrderIndex] = useState<number>(0);
  const [challengePrompt, setChallengePrompt] = useState('');
  const [challengeHint, setChallengeHint] = useState('');
  const [challengeSolution, setChallengeSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTool) {
      setName(initialTool.name);
      setSection(initialTool.section);
      setCustomSection('');
      setDescription(initialTool.description);
      setDifficulty(initialTool.difficulty);
      setOrderIndex(initialTool.orderIndex);
      setChallengePrompt(initialTool.challenge?.prompt || '');
      setChallengeHint(initialTool.challenge?.hint || '');
      setChallengeSolution(initialTool.challenge?.solution || '');
    } else {
      setName('');
      setSection(existingSections[0] || '11. Community & Custom Shaders');
      setCustomSection('');
      setDescription('');
      setDifficulty('Beginner');
      setOrderIndex(100);
      setChallengePrompt('');
      setChallengeHint('');
      setChallengeSolution('');
    }
    setError(null);
  }, [initialTool, isOpen, existingSections]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tool name is required.');
      return;
    }

    const finalSection = section === '__new__' ? customSection.trim() : section;
    if (!finalSection) {
      setError('Section / Chapter is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<ShaderTool> = {
        name: name.trim(),
        section: finalSection,
        description: description.trim(),
        difficulty,
        orderIndex: Number(orderIndex) || 0,
        challenge: {
          prompt: challengePrompt.trim(),
          hint: challengeHint.trim(),
          solution: challengeSolution.trim()
        }
      };

      if (initialTool) {
        payload.id = initialTool.id;
        payload.glsl = initialTool.glsl;
        payload.previewMain = initialTool.previewMain;
        payload.markdownDoc = initialTool.markdownDoc;
        payload.defaultParams = initialTool.defaultParams;
      } else {
        // Default starter template for a brand new shader tool
        payload.glsl = `// Starter GLSL Function for ${name.trim()}
vec3 computeEffect(in vec2 uv) {
  return vec3(uv.x, uv.y, 0.5 + 0.5 * sin(u_time));
}`;
        payload.previewMain = `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord.xy / u_resolution.xy;
  vec3 col = computeEffect(uv);
  fragColor = vec4(col, 1.0);
}`;
        payload.markdownDoc = `# ${name.trim()}

## 1. Overview
${description.trim() || 'Custom shader tool documentation.'}

## 2. Mathematical Formulation
Detailed mathematical derivation and line-by-line breakdown here.`;
        payload.defaultParams = {};
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save tool.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">
              {initialTool ? `Edit Tool: ${initialTool.name}` : 'Create New Shader Tool'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tool Name & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-neutral-300 font-medium">Tool Name *</label>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Polar Vortex Warp"
                required
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-medium">Difficulty Tier</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DifficultyTier)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Hero">Hero</option>
              </select>
            </div>
          </div>

          {/* Section / Category */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">Curriculum Section / Chapter *</label>
            <div className="flex gap-2">
              <select
                value={section}
                onChange={e => setSection(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {existingSections.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="__new__">+ Create New Section...</option>
              </select>
              {section === '__new__' && (
                <Input
                  type="text"
                  value={customSection}
                  onChange={e => setCustomSection(e.target.value)}
                  placeholder="New section title"
                  className="flex-1"
                  required
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary of the mathematical concept and GPU implementation..."
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Order Index */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-medium">Curriculum Order Index</label>
            <Input
              type="number"
              value={orderIndex}
              onChange={e => setOrderIndex(Number(e.target.value))}
              placeholder="e.g. 42"
              className="w-32"
            />
          </div>

          {/* Challenge Section */}
          <div className="p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Interactive "Your Turn" Coding Challenge</span>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px]">Challenge Prompt</label>
              <Input
                type="text"
                value={challengePrompt}
                onChange={e => setChallengePrompt(e.target.value)}
                placeholder="e.g. Add a time offset to animate the spiral rotation."
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px]">Hint</label>
              <Input
                type="text"
                value={challengeHint}
                onChange={e => setChallengeHint(e.target.value)}
                placeholder="e.g. Try adding u_time * 2.0 to the angle before computing coords."
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400 text-[11px]">Verified Solution Snippet</label>
              <textarea
                value={challengeSolution}
                onChange={e => setChallengeSolution(e.target.value)}
                placeholder="Exact verified solution GLSL snippet..."
                rows={3}
                className="w-full font-mono bg-neutral-900 border border-neutral-800 rounded p-2 text-[11px] text-neutral-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="text-xs h-8">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {isSubmitting ? 'Saving...' : initialTool ? 'Update Tool' : 'Create Tool'}
          </Button>
        </div>
      </div>
    </div>
  );
};
