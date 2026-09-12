import { ShaderPreset, Category } from '../types';

export const apiService = {
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
