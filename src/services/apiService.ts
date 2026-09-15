import { ShaderPreset, Category, ShaderTool } from '../types';
import { allTools as fallbackTools } from '../tools/registry';

export const apiService = {
  // --- TOOLS CRUD (Data-Driven Architecture) ---
  async getTools(): Promise<ShaderTool[]> {
    try {
      const res = await fetch('/api/tools.php');
      if (!res.ok) throw new Error('Failed to fetch tools from database');
      const data: ShaderTool[] = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem('local_tools_cache', JSON.stringify(data));
        return data;
      }
      throw new Error('Empty tools response');
    } catch (err) {
      console.warn('API error, falling back to local storage / static tools:', err);
      const local = localStorage.getItem('local_tools_cache');
      if (local) {
        try {
          return JSON.parse(local);
        } catch {
          // fallback to bundled
        }
      }
      return fallbackTools;
    }
  },

  async getTool(id: string): Promise<ShaderTool | null> {
    try {
      const res = await fetch(`/api/tools.php?id=${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      const tools = await this.getTools();
      return tools.find(t => t.id === id) || null;
    }
  },

  async createTool(tool: Partial<ShaderTool>): Promise<{ message: string; tool: ShaderTool }> {
    try {
      const res = await fetch('/api/tools.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tool)
      });
      if (!res.ok) throw new Error('Failed to create tool');
      const result = await res.json();
      localStorage.removeItem('local_tools_cache');
      return result;
    } catch (err) {
      console.warn('Saving tool locally due to network failure:', err);
      const newTool: ShaderTool = {
        id: tool.id || `tool-${Date.now()}`,
        section: tool.section || 'Custom Tools',
        name: tool.name || 'Untitled Tool',
        description: tool.description || '',
        glsl: tool.glsl || '',
        defaultParams: tool.defaultParams || {},
        previewMain: tool.previewMain || 'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  fragColor = vec4(1.0);\n}',
        markdownDoc: tool.markdownDoc || `# ${tool.name}\n\nDocumentation`,
        orderIndex: tool.orderIndex ?? 999,
        difficulty: tool.difficulty || 'Beginner',
        challenge: tool.challenge || { prompt: '', hint: '', solution: '' },
        created_at: new Date().toISOString()
      };
      const local = localStorage.getItem('local_tools_cache');
      const list: ShaderTool[] = local ? JSON.parse(local) : [...fallbackTools];
      list.push(newTool);
      localStorage.setItem('local_tools_cache', JSON.stringify(list));
      return { message: 'Created tool locally', tool: newTool };
    }
  },

  async updateTool(tool: ShaderTool): Promise<{ message: string; tool: ShaderTool }> {
    try {
      const res = await fetch('/api/tools.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tool)
      });
      if (!res.ok) throw new Error('Failed to update tool');
      const result = await res.json();
      localStorage.removeItem('local_tools_cache');
      return result;
    } catch (err) {
      console.warn('Updating tool locally due to network failure:', err);
      const local = localStorage.getItem('local_tools_cache');
      let list: ShaderTool[] = local ? JSON.parse(local) : [...fallbackTools];
      list = list.map(t => t.id === tool.id ? tool : t);
      localStorage.setItem('local_tools_cache', JSON.stringify(list));
      return { message: 'Updated tool locally', tool };
    }
  },

  async deleteTool(id: string): Promise<{ message: string; id: string }> {
    try {
      const res = await fetch(`/api/tools.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete tool');
      const result = await res.json();
      localStorage.removeItem('local_tools_cache');
      return result;
    } catch (err) {
      console.warn('Deleting tool locally due to network failure:', err);
      const local = localStorage.getItem('local_tools_cache');
      let list: ShaderTool[] = local ? JSON.parse(local) : [...fallbackTools];
      list = list.filter(t => t.id !== id);
      localStorage.setItem('local_tools_cache', JSON.stringify(list));
      return { message: 'Deleted tool locally', id };
    }
  },

  // --- CATEGORIES CRUD ---
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch('/api/categories.php');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data: Category[] = await res.json();
      // Deduplicate by slug
      const seen = new Set<string>();
      return data.filter(c => {
        if (seen.has(c.slug)) return false;
        seen.add(c.slug);
        return true;
      });
    } catch {
      const local = localStorage.getItem('local_categories');
      const cats: Category[] = local ? JSON.parse(local) : [
        { id: 1, parent_id: null, name: 'From Zero to Hero', slug: 'from-zero-to-hero', icon: 'graduation-cap' },
        { id: 2, parent_id: null, name: 'Default Collection', slug: 'default-collection', icon: 'folder' }
      ];
      const seen = new Set<string>();
      return cats.filter(c => {
        if (seen.has(c.slug)) return false;
        seen.add(c.slug);
        return true;
      });
    }
  },

  async createCategory(name: string, parentId: number | null = null): Promise<any> {
    try {
      const res = await fetch('/api/categories.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parent_id: parentId })
      });
      if (!res.ok) throw new Error('Failed to create category');
      return await res.json();
    } catch {
      const local = localStorage.getItem('local_categories');
      const categories: Category[] = local ? JSON.parse(local) : [];
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (categories.some(c => c.slug === slug)) {
        return { message: 'Category already exists' };
      }
      const newCat: Category = { id: Date.now(), parent_id: parentId, name, slug };
      categories.push(newCat);
      localStorage.setItem('local_categories', JSON.stringify(categories));
      return { message: 'Saved locally', id: newCat.id };
    }
  },

  async deleteCategory(id: number): Promise<any> {
    try {
      const res = await fetch(`/api/categories.php?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return await res.json();
    } catch {
      const local = localStorage.getItem('local_categories');
      let categories: Category[] = local ? JSON.parse(local) : [];
      categories = categories.filter(c => c.id !== id);
      localStorage.setItem('local_categories', JSON.stringify(categories));
      return { message: 'Deleted locally' };
    }
  },

  // --- PRESETS CRUD ---
  async getPresets(categoryId?: number): Promise<ShaderPreset[]> {
    try {
      const url = categoryId ? `/api/presets.php?category_id=${categoryId}` : '/api/presets.php';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch presets');
      return await res.json();
    } catch {
      const local = localStorage.getItem('local_presets');
      const presets: ShaderPreset[] = local ? JSON.parse(local) : [];
      if (categoryId) return presets.filter(p => p.category_id === categoryId);
      return presets;
    }
  },

  async createPreset(preset: ShaderPreset): Promise<any> {
    try {
      const res = await fetch('/api/presets.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
      if (!res.ok) throw new Error('Failed to create preset');
      return await res.json();
    } catch {
      const local = localStorage.getItem('local_presets');
      const presets: ShaderPreset[] = local ? JSON.parse(local) : [];
      const newPreset = { ...preset, id: Date.now(), created_at: new Date().toISOString() };
      presets.unshift(newPreset);
      localStorage.setItem('local_presets', JSON.stringify(presets));
      return { message: 'Saved locally', id: newPreset.id };
    }
  },

  async updatePreset(preset: ShaderPreset): Promise<any> {
    try {
      const res = await fetch('/api/presets.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset)
      });
      if (!res.ok) throw new Error('Failed to update preset');
      return await res.json();
    } catch {
      const local = localStorage.getItem('local_presets');
      let presets: ShaderPreset[] = local ? JSON.parse(local) : [];
      presets = presets.map(p => p.id === preset.id ? preset : p);
      localStorage.setItem('local_presets', JSON.stringify(presets));
      return { message: 'Updated locally' };
    }
  },

  async deletePreset(id: number): Promise<any> {
    try {
      const res = await fetch(`/api/presets.php?id=${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete preset');
      return await res.json();
    } catch {
      const local = localStorage.getItem('local_presets');
      let presets: ShaderPreset[] = local ? JSON.parse(local) : [];
      presets = presets.filter(p => p.id !== id);
      localStorage.setItem('local_presets', JSON.stringify(presets));
      return { message: 'Deleted locally' };
    }
  }
};
