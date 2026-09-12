import React, { useState, useEffect, useMemo } from 'react';
import { allTools } from '../tools/registry';
import { ShaderTool, ShaderPreset, Category } from '../types';
import { SidebarToolList } from '../components/organisms/SidebarToolList';
import { ShaderCodeEditor, CodeEditorPane, ViewportPane } from '../components/organisms/ShaderCodeEditor';
import { MathDocViewer } from '../components/organisms/MathDocViewer';
import { HeaderNav } from '../components/organisms/HeaderNav';
import { StatusBar } from '../components/organisms/StatusBar';
import { PresetManagerModal } from '../components/organisms/PresetManagerModal';
import { ResizableSplitter } from '../components/atoms/ResizableSplitter';
import { apiService } from '../services/apiService';

export const ToolboxPage: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ShaderTool>(allTools[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number>(300);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [activeView, setActiveView] = useState<'code' | 'docs' | 'split'>('code');
  const [presetName, setPresetName] = useState(selectedTool.name);
  const [presetDesc, setPresetDesc] = useState(selectedTool.description);
  const [currentId, setCurrentId] = useState<number | undefined>(undefined);
  const [savedStatus, setSavedStatus] = useState('');
  const [compileError, setCompileError] = useState<{ message: string; line?: number } | null>(null);

  // Lesson completion tracking stored in localStorage
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completed_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentIndex = useMemo(() => {
    const idx = allTools.findIndex(t => t.id === selectedTool.id);
    return idx >= 0 ? idx : 0;
  }, [selectedTool]);

  const [splitWidths, setSplitWidths] = useState<{ code: number; viewport: number; docs: number }>({
    code: 35,
    viewport: 35,
    docs: 30
  });

  const [code, setCode] = useState<string>(`
// ShaderStudio IDE: ${selectedTool.name}
${selectedTool.glsl}

${selectedTool.previewMain}
  `.trim());

  const [markdownDoc, setMarkdownDoc] = useState<string>(selectedTool.markdownDoc);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await apiService.getCategories();
    setCategories(cats);
  };

  const handleToggleComplete = () => {
    setCompletedIds(prev => {
      const updated = prev.includes(selectedTool.id)
        ? prev.filter(id => id !== selectedTool.id)
        : [...prev, selectedTool.id];
      localStorage.setItem('completed_lessons', JSON.stringify(updated));
      return updated;
    });
  };

  const handlePrevLesson = () => {
    if (currentIndex > 0) {
      handleSelectTool(allTools[currentIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    if (currentIndex < allTools.length - 1) {
      handleSelectTool(allTools[currentIndex + 1]);
    }
  };

  const handleCreateCategory = async (name: string, parentId: number | null) => {
    await apiService.createCategory(name, parentId);
    loadCategories();
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm('Delete this folder and its presets?')) {
      await apiService.deleteCategory(id);
      if (selectedCategoryId === id) setSelectedCategoryId(null);
      loadCategories();
    }
  };

  const handleSelectTool = (tool: ShaderTool) => {
    setSelectedTool(tool);
    setPresetName(tool.name);
    setPresetDesc(tool.description);
    setCurrentId(undefined);
    setCode(`
// ShaderStudio IDE: ${tool.name}
${tool.glsl}

${tool.previewMain}
    `.trim());
    setMarkdownDoc(tool.markdownDoc);
  };

  const handleSelectPreset = (preset: ShaderPreset) => {
    const customTool: ShaderTool = {
      id: `preset-${preset.id}`,
      section: 'Custom Saved Presets',
      name: preset.name,
      description: preset.description || 'Custom user preset',
      orderIndex: preset.order_index || 0,
      difficulty: preset.difficulty || 'Intermediate',
      challenge: { prompt: '', hint: '', solution: '' },
      glsl: '',
      defaultParams: {},
      previewMain: preset.glsl_code,
      markdownDoc: preset.markdown_doc || '# Custom Preset Documentation\n\nNo documentation provided.'
    };
    setSelectedTool(customTool);
    setPresetName(preset.name);
    setPresetDesc(preset.description || '');
    setCurrentId(preset.id);
    setCode(preset.glsl_code);
    setMarkdownDoc(customTool.markdownDoc);
  };

  const handleSaveToFolder = async (catId: number | null) => {
    try {
      const res = await apiService.createPreset({
        category_id: catId,
        name: presetName,
        description: presetDesc,
        glsl_code: code,
        markdown_doc: markdownDoc
      });
      if (res.id) setCurrentId(res.id);
      setSavedStatus('Saved to folder!');
      setTimeout(() => setSavedStatus(''), 3000);
    } catch {
      setSavedStatus('Error saving');
    }
  };

  const handleSave = async () => {
    try {
      if (currentId) {
        await apiService.updatePreset({
          id: currentId,
          category_id: selectedCategoryId,
          name: presetName,
          description: presetDesc,
          glsl_code: code,
          markdown_doc: markdownDoc
        });
        setSavedStatus('Updated successfully');
      } else {
        const res = await apiService.createPreset({
          category_id: selectedCategoryId,
          name: presetName,
          description: presetDesc,
          glsl_code: code,
          markdown_doc: markdownDoc
        });
        if (res.id) setCurrentId(res.id);
        setSavedStatus('Saved successfully');
      }
      setTimeout(() => setSavedStatus(''), 3000);
    } catch {
      setSavedStatus('Error saving');
    }
  };

  const handleFormat = () => {
    const formatted = code
      .split('\n')
      .map(line => line.trim())
      .join('\n');
    setCode(formatted);
  };

  const handleSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${presetName.toLowerCase().replace(/\s+/g, '-')}-shader.png`;
    a.click();
  };

  const handleResizeSidebar = (delta: number) => {
    setSidebarWidth(prev => Math.min(Math.max(prev + delta, 220), 480));
  };

  const handleResizeSplitCode = (delta: number) => {
    const totalWidth = window.innerWidth - (isSidebarCollapsed ? 48 : sidebarWidth);
    if (totalWidth <= 0) return;
    const deltaPercent = (delta / totalWidth) * 100;
    setSplitWidths(prev => {
      const newCode = Math.min(Math.max(prev.code + deltaPercent, 20), 60);
      const diff = newCode - prev.code;
      return {
        ...prev,
        code: newCode,
        viewport: Math.max(prev.viewport - diff, 20)
      };
    });
  };

  const handleResizeSplitViewport = (delta: number) => {
    const totalWidth = window.innerWidth - (isSidebarCollapsed ? 48 : sidebarWidth);
    if (totalWidth <= 0) return;
    const deltaPercent = (delta / totalWidth) * 100;
    setSplitWidths(prev => {
      const newViewport = Math.min(Math.max(prev.viewport + deltaPercent, 20), 60);
      const diff = newViewport - prev.viewport;
      return {
        ...prev,
        viewport: newViewport,
        docs: Math.max(prev.docs - diff, 20)
      };
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 font-sans select-none">
      <HeaderNav
        presetName={presetName}
        onPresetNameChange={setPresetName}
        section={selectedTool.section}
        lessonNumber={currentIndex + 1}
        totalLessons={allTools.length}
        isCompleted={completedIds.includes(selectedTool.id)}
        onToggleComplete={handleToggleComplete}
        onPrevLesson={handlePrevLesson}
        onNextLesson={handleNextLesson}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < allTools.length - 1}
        activeView={activeView}
        onViewChange={setActiveView}
        onFormat={handleFormat}
        onSnapshot={handleSnapshot}
        onOpenPresets={() => setIsModalOpen(true)}
        onSave={handleSave}
        savedStatus={savedStatus}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Container */}
        <div style={{ width: isSidebarCollapsed ? '48px' : `${sidebarWidth}px` }} className="h-full flex-shrink-0">
          <SidebarToolList
            tools={allTools}
            selectedTool={selectedTool}
            onSelectTool={handleSelectTool}
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onCreateCategory={handleCreateCategory}
            onDeleteCategory={handleDeleteCategory}
            onSelectPreset={handleSelectPreset}
            onSaveCurrentToCategory={handleSaveToFolder}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            completedIds={completedIds}
          />
        </div>

        {/* Resizable Splitter for Sidebar */}
        {!isSidebarCollapsed && (
          <ResizableSplitter direction="horizontal" onResize={handleResizeSidebar} />
        )}

        {/* Central Work Area according to activeView */}
        {activeView === 'code' && (
          <ShaderCodeEditor
            code={code}
            onCodeChange={setCode}
            toolName={selectedTool.name}
          />
        )}

        {activeView === 'docs' && (
          <MathDocViewer
            markdown={markdownDoc}
            onMarkdownChange={setMarkdownDoc}
            toolName={selectedTool.name}
            challenge={selectedTool.challenge}
            onApplySolution={setCode}
          />
        )}

        {activeView === 'split' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Column 1: Code Editor Pane */}
            <CodeEditorPane
              style={{ width: `${splitWidths.code}%` }}
              code={code}
              onCodeChange={setCode}
              toolName={selectedTool.name}
              compileError={compileError}
            />

            {/* Splitter 1 */}
            <ResizableSplitter direction="horizontal" onResize={handleResizeSplitCode} />

            {/* Column 2: WebGL2 Live Viewport Pane */}
            <ViewportPane
              style={{ width: `${splitWidths.viewport}%` }}
              code={code}
              onError={setCompileError}
            />

            {/* Splitter 2 */}
            <ResizableSplitter direction="horizontal" onResize={handleResizeSplitViewport} />

            {/* Column 3: Academic Math & Code Documentation */}
            <div style={{ width: `${splitWidths.docs}%` }} className="h-full border-l border-neutral-800 flex flex-col">
              <MathDocViewer
                markdown={markdownDoc}
                onMarkdownChange={setMarkdownDoc}
                toolName={selectedTool.name}
                challenge={selectedTool.challenge}
                onApplySolution={setCode}
              />
            </div>
          </div>
        )}
      </div>

      <StatusBar fps={60} activeTool={selectedTool.name} />

      <PresetManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
      />
    </div>
  );
};
