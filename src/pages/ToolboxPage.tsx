import React, { useState, useEffect, useMemo } from 'react';
import { allTools } from '../tools/registry';
import { ShaderTool, ShaderPreset, Category } from '../types';
import { SidebarToolList } from '../components/organisms/SidebarToolList';
import { ShaderCodeEditor, CodeEditorPane, ViewportPane } from '../components/organisms/ShaderCodeEditor';
import { MathDocViewer } from '../components/organisms/MathDocViewer';
import { HeaderNav } from '../components/organisms/HeaderNav';
import { StatusBar } from '../components/organisms/StatusBar';
import { PresetManagerModal } from '../components/organisms/PresetManagerModal';
import { ToolModal } from '../components/organisms/ToolModal';
import { ResizableSplitter } from '../components/atoms/ResizableSplitter';
import { apiService } from '../services/apiService';

const getToolCode = (tool: ShaderTool): string => {
  if (!tool) return '';
  const glsl = tool.glsl?.trim() || '';
  const preview = tool.previewMain?.trim() || '';

  if (!glsl) return preview;
  if (!preview) return glsl;

  // Avoid duplicating if preview already includes glsl or IDE header
  if (preview.includes(glsl) || preview.startsWith('// ShaderStudio IDE:')) {
    return preview;
  }

  return `// ShaderStudio IDE: ${tool.name}\n${glsl}\n\n${preview}`.trim();
};

export const getToolSolutionCode = (tool: ShaderTool, solution: string) => {
  const glsl = (tool.glsl || '').trim();
  const sol = (solution || '').trim();
  if (!glsl) return sol;
  if (!sol) return glsl;

  // If the solution already includes glsl or IDE header, or if it replaces the glsl logic entirely (e.g. simd-pipeline-intro)
  if (sol.includes(glsl) || sol.startsWith('// ShaderStudio IDE:') || sol.includes('computeBaseColor')) {
    return sol;
  }

  return `// ShaderStudio IDE: ${tool.name}\n${glsl}\n\n${sol}`.trim();
};

export const ToolboxPage: React.FC = () => {
  const [tools, setTools] = useState<ShaderTool[]>(allTools);
  const [selectedTool, setSelectedTool] = useState<ShaderTool>(allTools[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<ShaderTool | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState<number>(300);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [activeView, setActiveView] = useState<'code' | 'docs' | 'split'>('code');
  const [presetName, setPresetName] = useState(selectedTool.name);
  const [presetDesc, setPresetDesc] = useState(selectedTool.description);
  const [currentId, setCurrentId] = useState<number | undefined>(undefined);
  const [isPresetMode, setIsPresetMode] = useState<boolean>(false);
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
    const idx = tools.findIndex(t => t.id === selectedTool.id);
    return idx >= 0 ? idx : 0;
  }, [tools, selectedTool]);

  const [splitWidths, setSplitWidths] = useState<{ code: number; viewport: number; docs: number }>({
    code: 35,
    viewport: 35,
    docs: 30
  });

  const [code, setCode] = useState<string>(() => getToolCode(allTools[0]));

  const [markdownDoc, setMarkdownDoc] = useState<string>(selectedTool.markdownDoc);

  useEffect(() => {
    loadTools();
    loadCategories();
  }, []);

  const loadTools = async (selectId?: string) => {
    const loaded = await apiService.getTools();
    if (loaded && loaded.length > 0) {
      setTools(loaded);
      const targetId = selectId || selectedTool.id;
      const match = loaded.find(t => t.id === targetId) || loaded[0];
      setSelectedTool(match);
      if (!isPresetMode) {
        setPresetName(match.name);
        setPresetDesc(match.description);
        setCode(getToolCode(match));
        setMarkdownDoc(match.markdownDoc || '');
      }
    }
  };

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
      handleSelectTool(tools[currentIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    if (currentIndex < tools.length - 1) {
      handleSelectTool(tools[currentIndex + 1]);
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
    setIsPresetMode(false);
    setCode(getToolCode(tool));
    setMarkdownDoc(tool.markdownDoc || '');
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
    setSelectedCategoryId(preset.category_id ?? null);
    setIsPresetMode(true);
    setCode(preset.glsl_code);
    setMarkdownDoc(customTool.markdownDoc);
  };

  // Tool CRUD Operations
  const handleOpenCreateTool = () => {
    setEditingTool(null);
    setIsToolModalOpen(true);
  };

  const handleOpenEditTool = (tool?: ShaderTool) => {
    setEditingTool(tool || selectedTool);
    setIsToolModalOpen(true);
  };

  const handleSaveToolModal = async (toolData: Partial<ShaderTool>) => {
    if (editingTool) {
      const updated: ShaderTool = {
        ...editingTool,
        ...toolData,
        id: editingTool.id
      };
      const res = await apiService.updateTool(updated);
      setSavedStatus('Tool updated in database!');
      const saved = res.tool || updated;
      await loadTools(saved.id);
      if (selectedTool.id === updated.id) {
        handleSelectTool(saved);
      }
    } else {
      const res = await apiService.createTool(toolData);
      setSavedStatus('Tool created in database!');
      if (res.tool) {
        await loadTools(res.tool.id);
        handleSelectTool(res.tool);
      } else {
        await loadTools();
      }
    }
    setTimeout(() => setSavedStatus(''), 3000);
  };

  const handleDeleteTool = async (tool: ShaderTool) => {
    if (confirm(`Are you sure you want to delete tool "${tool.name}" from the database?`)) {
      await apiService.deleteTool(tool.id);
      setSavedStatus('Tool deleted!');
      const updated = tools.filter(t => t.id !== tool.id);
      setTools(updated);
      if (selectedTool.id === tool.id && updated.length > 0) {
        handleSelectTool(updated[0]);
      }
      setTimeout(() => setSavedStatus(''), 3000);
    }
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
      if (res && res.id) {
        setCurrentId(res.id);
        setSelectedCategoryId(catId);
        setIsPresetMode(true);
      }
      setSavedStatus('Saved to folder!');
      setTimeout(() => setSavedStatus(''), 3000);
      return res;
    } catch {
      setSavedStatus('Error saving');
    }
  };

  const handleSave = async () => {
    try {
      if (isPresetMode && currentId) {
        // Update preset in folder
        await apiService.updatePreset({
          id: currentId,
          category_id: selectedCategoryId,
          name: presetName,
          description: presetDesc,
          glsl_code: code,
          markdown_doc: markdownDoc
        });
        setSavedStatus('Updated preset successfully');
      } else {
        // Update tool directly in the database
        const updatedTool: ShaderTool = {
          ...selectedTool,
          name: presetName,
          description: presetDesc,
          glsl: '',
          previewMain: code,
          markdownDoc: markdownDoc
        };
        const res = await apiService.updateTool(updatedTool);
        const saved = res.tool || updatedTool;
        setSelectedTool(saved);
        setSavedStatus('Saved tool to DB!');
        await loadTools(saved.id);
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

  const handleApplySolution = (solution: string) => {
    const fullSol = getToolSolutionCode(selectedTool, solution);
    setCode(fullSol);
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

  const existingSections = useMemo(() => {
    return Array.from(new Set(tools.map(t => t.section)));
  }, [tools]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 font-sans select-none">
      <HeaderNav
        presetName={presetName}
        onPresetNameChange={setPresetName}
        section={selectedTool.section}
        lessonNumber={currentIndex + 1}
        totalLessons={tools.length}
        isCompleted={completedIds.includes(selectedTool.id)}
        onToggleComplete={handleToggleComplete}
        onPrevLesson={handlePrevLesson}
        onNextLesson={handleNextLesson}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < tools.length - 1}
        activeView={activeView}
        onViewChange={setActiveView}
        onFormat={handleFormat}
        onSnapshot={handleSnapshot}
        onOpenPresets={() => setIsModalOpen(true)}
        onSave={handleSave}
        savedStatus={savedStatus}
        onEditToolMetadata={!isPresetMode ? () => handleOpenEditTool(selectedTool) : undefined}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Container */}
        <div style={{ width: isSidebarCollapsed ? '48px' : `${sidebarWidth}px` }} className="h-full flex-shrink-0">
          <SidebarToolList
            tools={tools}
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
            onCreateTool={handleOpenCreateTool}
            onEditTool={handleOpenEditTool}
            onDeleteTool={handleDeleteTool}
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
            onApplySolution={handleApplySolution}
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
                onApplySolution={handleApplySolution}
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

      <ToolModal
        isOpen={isToolModalOpen}
        onClose={() => setIsToolModalOpen(false)}
        onSave={handleSaveToolModal}
        initialTool={editingTool}
        existingSections={existingSections}
      />
    </div>
  );
};
