import React, { useEffect, useState } from 'react';
import { ShaderPreset, Category } from '../../types';
import { apiService } from '../../services/apiService';
import { Button } from '../atoms/Button';
import { X, Trash2, FolderOpen, Folder } from 'lucide-react';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: ShaderPreset) => void;
  categories: Category[];
  selectedCategoryId: number | null;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  categories,
  selectedCategoryId
}) => {
  const [presets, setPresets] = useState<ShaderPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState<number | null>(selectedCategoryId);

  const fetchPresets = async () => {
    setLoading(true);
    const data = await apiService.getPresets(activeFilterId || undefined);
    setPresets(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchPresets();
    }
  }, [isOpen, activeFilterId]);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this preset?')) {
      await apiService.deletePreset(id);
      fetchPresets();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-neutral-100 text-sm">Preset Library & Digital Asset Manager</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2 bg-neutral-950/60 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveFilterId(null)}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
              activeFilterId === null ? 'bg-indigo-600 text-white font-medium' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            All Folders
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilterId(cat.id)}
              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeFilterId === cat.id ? 'bg-indigo-600 text-white font-medium' : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Folder className="w-3 h-3 text-indigo-300" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Preset List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loading ? (
            <p className="text-sm text-neutral-400 text-center py-8">Loading presets...</p>
          ) : presets.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No saved presets in this folder. Save one from the code editor!</p>
          ) : (
            presets.map(preset => (
              <div key={preset.id} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4 hover:border-neutral-700 transition-colors">
                <div>
                  <h3 className="font-semibold text-neutral-200 text-sm">{preset.name}</h3>
                  <p className="text-xs text-neutral-400 line-clamp-1">{preset.description || 'Custom shader preset'}</p>
                  <span className="text-[10px] text-neutral-500 font-mono">{preset.created_at}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={() => { onSelectPreset(preset); onClose(); }} className="h-8 px-3 text-xs">
                    Load
                  </Button>
                  <Button variant="outline" onClick={() => handleDelete(preset.id)} className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 border-rose-900/40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
