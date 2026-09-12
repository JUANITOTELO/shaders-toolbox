import React, { useState, useEffect } from 'react';
import { Category, ShaderPreset, ShaderTool } from '../../types';
import { apiService } from '../../services/apiService';
import { Folder, FolderPlus, Trash2, ChevronRight, ChevronDown, Plus, FileCode, Check, Layers } from 'lucide-react';

interface FolderTreeProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (id: number | null) => void;
  onCreateCategory: (name: string, parentId: number | null) => void;
  onDeleteCategory: (id: number) => void;
  onSelectPreset: (preset: ShaderPreset) => void;
  onSaveCurrentToCategory: (categoryId: number | null) => void;
  zeroHeroTools?: ShaderTool[];
  onSelectTool?: (tool: ShaderTool) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onCreateCategory,
  onDeleteCategory,
  onSelectPreset,
  onSaveCurrentToCategory,
  zeroHeroTools = [],
  onSelectTool
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<number, boolean>>({
    1: true
  });
  const [folderPresets, setFolderPresets] = useState<Record<number, ShaderPreset[]>>({});
  const [allCustomPresets, setAllCustomPresets] = useState<ShaderPreset[]>([]);
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(true);
  const [savedBadgeFolderId, setSavedBadgeFolderId] = useState<number | null>(null);

  const fetchPresetsForCategories = async () => {
    const allPresets = await apiService.getPresets();
    setAllCustomPresets(allPresets);
    const map: Record<number, ShaderPreset[]> = {};
    allPresets.forEach(preset => {
      const catId = preset.category_id || 2;
      if (!map[catId]) map[catId] = [];
      map[catId].push(preset);
    });
    setFolderPresets(map);
  };

  useEffect(() => {
    fetchPresetsForCategories();
  }, [categories]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateCategory(newFolderName.trim(), null);
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const toggleExpand = (catId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSaveToFolder = (catId: number | null, e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveCurrentToCategory(catId);
    setSavedBadgeFolderId(catId ?? -1);
    setTimeout(() => {
      setSavedBadgeFolderId(null);
      fetchPresetsForCategories();
    }, 2000);
  };

  const handleDeletePreset = async (presetId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this preset?')) {
      await apiService.deletePreset(presetId);
      fetchPresetsForCategories();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-neutral-900/90 rounded-xl border border-neutral-800 text-xs">
      <div className="flex items-center justify-between px-2 py-1 text-neutral-400 font-semibold tracking-wider uppercase text-[10px]">
        <span>Library Folders</span>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="hover:text-indigo-400 cursor-pointer p-0.5"
          title="New Folder"
        >
          <FolderPlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="flex items-center gap-1.5 px-2 py-1">
          <input
            type="text"
            placeholder="New folder name..."
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button type="submit" className="px-2 py-1 bg-indigo-600 rounded text-white text-[11px]">Add</button>
        </form>
      )}

      {/* All Custom Presets Root Item */}
      <div className="flex flex-col">
        <div
          onClick={() => onSelectCategory(null)}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left group cursor-pointer ${
            selectedCategoryId === null
              ? 'bg-indigo-950/60 text-indigo-300 font-medium'
              : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 truncate">
            <button
              onClick={e => { e.stopPropagation(); setIsAllExpanded(!isAllExpanded); }}
              className="p-0.5 hover:text-white rounded cursor-pointer"
            >
              {isAllExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />}
            </button>
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">All Custom Presets</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 font-mono">
              {allCustomPresets.length}
            </span>
          </div>
          <button
            onClick={e => handleSaveToFolder(null, e)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 rounded cursor-pointer"
            title="Save current shader to root collection"
          >
            {savedBadgeFolderId === -1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>

        {isAllExpanded && allCustomPresets.length > 0 && (
          <div className="flex flex-col gap-1 pl-6 pr-1 py-1 border-l border-neutral-800 ml-4 my-1">
            {allCustomPresets.map(preset => (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className="flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-800/50 cursor-pointer text-[11px] text-neutral-300 hover:text-white group transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileCode className="w-3 h-3 text-emerald-400/70 shrink-0" />
                  <span className="truncate">{preset.name}</span>
                </div>
                <button
                  onClick={e => preset.id && handleDeletePreset(preset.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-red-400 rounded"
                  title="Delete preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Folders */}
      {categories.map(cat => {
        const isExpanded = !!expandedFolderIds[cat.id];
        const isZeroHero = cat.slug === 'from-zero-to-hero';
        const presetsInFolder = folderPresets[cat.id] || [];
        const count = isZeroHero ? zeroHeroTools.length : presetsInFolder.length;

        return (
          <div key={cat.id} className="flex flex-col">
            {/* Folder Header Row */}
            <div
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-left group cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-indigo-950/60 text-indigo-300 font-medium'
                  : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 truncate">
                <button
                  onClick={e => toggleExpand(cat.id, e)}
                  className="p-0.5 hover:text-white rounded cursor-pointer"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />}
                </button>
                <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                  {count}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => handleSaveToFolder(cat.id, e)}
                  className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-emerald-400 rounded cursor-pointer"
                  title="Save current shader to this folder"
                >
                  {savedBadgeFolderId === cat.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
                </button>
                {cat.id !== 1 && cat.slug !== 'default-collection' && cat.slug !== 'from-zero-to-hero' && (
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteCategory(cat.id); }}
                    className="p-1 hover:bg-neutral-800 text-neutral-500 hover:text-red-400 rounded cursor-pointer"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Folder Contents (Expanded) */}
            {isExpanded && (
              <div className="flex flex-col gap-1 pl-6 pr-1 py-1 border-l border-neutral-800 ml-4 my-1">
                {isZeroHero ? (
                  // Zero to Hero Curriculum Lessons
                  zeroHeroTools.map(tool => (
                    <div
                      key={tool.id}
                      onClick={() => onSelectTool && onSelectTool(tool)}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-800/50 cursor-pointer text-[11px] text-neutral-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3 h-3 text-indigo-400/70 shrink-0" />
                        <span className="truncate">#{tool.orderIndex} {tool.name}</span>
                      </div>
                      <span className="text-[9px] px-1 py-0.2 rounded font-mono text-neutral-500">
                        {tool.difficulty}
                      </span>
                    </div>
                  ))
                ) : presetsInFolder.length === 0 ? (
                  <div className="px-2 py-1 text-[11px] text-neutral-500 italic">
                    Folder is empty. Click + to save here.
                  </div>
                ) : (
                  // Custom Presets inside Folder
                  presetsInFolder.map(preset => (
                    <div
                      key={preset.id}
                      onClick={() => onSelectPreset(preset)}
                      className="flex items-center justify-between px-2 py-1 rounded hover:bg-neutral-800/50 cursor-pointer text-[11px] text-neutral-300 hover:text-white group transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className="w-3 h-3 text-emerald-400/70 shrink-0" />
                        <span className="truncate">{preset.name}</span>
                      </div>
                      <button
                        onClick={e => preset.id && handleDeletePreset(preset.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-red-400 rounded"
                        title="Delete preset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
