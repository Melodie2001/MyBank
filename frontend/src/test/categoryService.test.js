import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import api from '../api/axios';

vi.mock('../api/axios');

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCategories returns list of categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Food', icon: 'burger.png', color: '#00C49A' },
      { id: 2, name: 'Housing', icon: 'house.png', color: '#156064' }
    ];
    api.get.mockResolvedValueOnce({ data: mockCategories });

    const result = await getCategories();
    expect(result).toEqual(mockCategories);
    expect(api.get).toHaveBeenCalledWith('/api/categories');
  });

  it('createCategory sends correct data', async () => {
    const newCategory = { name: 'Travel', icon: 'plane.png', color: '#F8E16C' };
    api.post.mockResolvedValueOnce({ data: { message: 'Category created', category: { id: 3, ...newCategory } } });

    const result = await createCategory(newCategory);
    expect(api.post).toHaveBeenCalledWith('/api/categories', newCategory);
    expect(result.category.name).toBe('Travel');
  });

  it('updateCategory sends correct data', async () => {
    const updatedData = { name: 'Updated Food', icon: 'burger.png', color: '#00C49A' };
    api.put.mockResolvedValueOnce({ data: { message: 'Category updated', category: { id: 1, ...updatedData } } });

    const result = await updateCategory(1, updatedData);
    expect(api.put).toHaveBeenCalledWith('/api/categories/1', updatedData);
    expect(result.category.name).toBe('Updated Food');
  });

  it('deleteCategory calls correct endpoint', async () => {
    api.delete.mockResolvedValueOnce({ data: { message: 'Category deleted' } });

    const result = await deleteCategory(1);
    expect(api.delete).toHaveBeenCalledWith('/api/categories/1');
    expect(result.message).toBe('Category deleted');
  });
});