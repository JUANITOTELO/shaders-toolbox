import React, { useState } from 'react';
import { ShaderTool } from '../../types';
import { ShaderRenderer } from '../../core/ShaderRenderer';
import { Button } from '../atoms/Button';
import { Code, Play, RefreshCw, Save } from 'lucide-react';

interface ShaderViewportProps {
  tool: ShaderTool;
}

export const ShaderViewport: React.FC<ShaderViewportProps> = ({ tool }) => {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullShaderSource = `
// Tool: ${tool.name} (${tool.section})
${tool.glsl}

${tool.previewMain}
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShaderSource);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSavePreset = async () => {
    try {
      const res = await fetch('/api/presets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tool.name,
          description: tool.description,
          glsl_code: fullShaderSource
        })
      });
      const data = await res.json();
      alert(data.message || 'Preset saved successfully!');
    } catch {
      alert('Saved preset locally / API unavailable.');
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
      <div className="h-16 border-b border-neutral-800 px-6 flex items-center justify-between bg-neutral-900/40">
        <div>
          <h1 className="font-bold text-lg text-neutral-100">{tool.name}</h1>
          <p className="text-xs text-neutral-400">{tool.section}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowCode(!showCode)}>
            <Code className="w-4 h-4" />
            {showCode ? 'Preview' : 'GLSL Source'}
          </Button>
          <Button variant="secondary" onClick={handleCopy}>
            <RefreshCw className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
          <Button onClick={handleSavePreset}>
            <Save className="w-4 h-4" />
            Save Preset
          </Button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6 bg-neutral-950">
        {showCode ? (
          <div className="w-full h-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 overflow-auto font-mono text-xs text-indigo-300">
            <pre>{fullShaderSource}</pre>
          </div>
        ) : (
          <div className="w-full h-full rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-black">
            <ShaderRenderer fragmentShader={fullShaderSource} />
          </div>
        )}
      </div>
    </main>
  );
};
