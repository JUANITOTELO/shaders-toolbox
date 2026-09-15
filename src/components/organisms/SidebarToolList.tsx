import React, { useState } from 'react';
import { ShaderTool, Category, DifficultyTier, ShaderPreset } from '../../types';
import { ToolCard } from '../molecules/ToolCard';
import { FolderTree } from './FolderTree';
import { Input } from '../atoms/Input';
import { Search, Layers, ChevronRight, ChevronDown, Folder, PanelLeftClose, PanelLeft, GraduationCap, CheckCircle2, Plus } from 'lucide-react';

interface SidebarToolListProps {
  tools: ShaderTool[];
  selectedTool: ShaderTool;
  onSelectTool: (tool: ShaderTool) => void;
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  onCreateCategory: (name: string, parentId: number | null) => void;
  onDeleteCategory: (id: number) => void;
  onSelectPreset: (preset: ShaderPreset) => void;
  onSaveCurrentToCategory: (categoryId: number | null) => void | Promise<any>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  completedIds: string[];
  onCreateTool?: () => void;
  onEditTool?: (tool: ShaderTool) => void;
  onDeleteTool?: (tool: ShaderTool) => void;
}

export const SidebarToolList: React.FC<SidebarToolListProps> = ({
  tools,
  selectedTool,
  onSelectTool,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onDeleteCategory,
  onSelectPreset,
  onSaveCurrentToCategory,
  isCollapsed,
  onToggleCollapse,
  completedIds,
  onCreateTool,
  onEditTool,
  onDeleteTool
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'curriculum' | 'folders'>('curriculum');
  const [tierFilter, setTierFilter] = useState<'All' | DifficultyTier>('All');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const filteredTools = tools
    .filter(t => tierFilter === 'All' || t.difficulty === tierFilter)
    .filter(
      t => t.name.toLowerCase().includes(search.toLowerCase()) ||
           t.section.toLowerCase().includes(search.toLowerCase()) ||
           t.description.toLowerCase().includes(search.toLowerCase())
    );

  const sections = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.section]) acc[tool.section] = [];
    acc[tool.section].push(tool);
    return acc;
  }, {} as Record<string, ShaderTool[]>);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const progressPercent = Math.round((completedIds.length / tools.length) * 100);

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-3 select-none gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
          title="Expand Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="w-6 h-px bg-neutral-800" />
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('curriculum'); }}
          className="p-2 text-neutral-400 hover:text-indigo-400 rounded-lg hover:bg-neutral-800 cursor-pointer"
          title="Zero to Hero Curriculum"
        >
          <GraduationCap className="w-4 h-4" />
        </button>
        <button
          onClick={() => { onToggleCollapse(); setActiveTab('folders'); }}
          className="p-2 text-neutral-400 hover:text-indigo-400 rounded-lg hover:bg-neutral-800 cursor-pointer"
          title="Folder Categories"
        >
          <Folder className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-full h-full bg-neutral-900 border-r border-neutral-800 flex flex-col select-none overflow-hidden">
      {/* Header & Tabs */}
      <div className="p-3 border-b border-neutral-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                activeTab === 'curriculum' ? 'bg-indigo-600 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Zero to Hero</span>
            </button>
            <button
              onClick={() => setActiveTab('folders')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition-colors ${
                activeTab === 'folders' ? 'bg-indigo-600 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Folders</span>
            </button>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Curriculum Progress Bar */}
        {activeTab === 'curriculum' && (
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {completedIds.length} / {tools.length} Completed
              </span>
              <div className="flex items-center gap-2">
                <span>{progressPercent}%</span>
                {onCreateTool && (
                  <button
                    onClick={onCreateTool}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium cursor-pointer transition-colors shadow-xs"
                    title="Create new shader tool in database"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Tool</span>
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                style={{ width: `${progressPercent}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* Search & Tiers */}
        {activeTab === 'curriculum' && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
              <Input
                placeholder="Search zero-to-hero lessons..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 text-xs py-1.5"
              />
            </div>

            {/* Difficulty Tier Filters */}
            <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-medium">
              {(['All', 'Beginner', 'Intermediate', 'Advanced', 'Hero'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    tierFilter === tier
                      ? 'bg-neutral-200 text-neutral-950 font-bold'
                      : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main View: Lessons or Folders */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-3">
        {activeTab === 'folders' ? (
          <FolderTree
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
            onCreateCategory={onCreateCategory}
            onDeleteCategory={onDeleteCategory}
            onSelectPreset={onSelectPreset}
            onSaveCurrentToCategory={onSaveCurrentToCategory}
            zeroHeroTools={tools}
            onSelectTool={onSelectTool}
          />
        ) : (
          Object.entries(sections).map(([sectionName, sectionTools]) => {
            const isSectionCollapsed = collapsedSections[sectionName];
            return (
              <div key={sectionName} className="flex flex-col gap-1">
                <button
                  onClick={() => toggleSection(sectionName)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-800/60 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors w-full text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="truncate">{sectionName}</span>
                  </div>
                  {isSectionCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>

                {!isSectionCollapsed && (
                  <div className="flex flex-col gap-1.5 pl-2">
                    {sectionTools.map(tool => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        isSelected={selectedTool.id === tool.id}
                        onSelect={onSelectTool}
                        isCompleted={completedIds.includes(tool.id)}
                        onEdit={onEditTool}
                        onDelete={onDeleteTool}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
