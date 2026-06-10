import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCategories, getMyCategories, addToMyCategories, removeFromMyCategories } from '../services/categoryService';
import api from '../api/axios';

vi.mock('../api/axios');

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCategories returns list of all categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Food', icon: 'burger.png', color: '#00C49A' },
      { id: 2, name: 'Housing', icon: 'house.png', color: '#156064' }
    ];
    api.get.mockResolvedValueOnce({ data: mockCategories });

    const result = await getCategories();
    expect(result).toEqual(mockCategories);
    expect(api.get).toHaveBeenCalledWith('/api/categories');
  });

  it('getMyCategories returns user categories', async () => {
    const mockCategories = [
      { id: 1, name: 'Food', icon: 'burger.png', color: '#00C49A' }
    ];
    api.get.mockResolvedValueOnce({ data: mockCategories });

    const result = await getMyCategories();
    expect(result).toEqual(mockCategories);
    expect(api.get).toHaveBeenCalledWith('/api/my-categories');
  });

  it('addToMyCategories sends correct data', async () => {
    api.post.mockResolvedValueOnce({ data: { message: 'Category added', category: { id: 1, name: 'Food' } } });

    const result = await addToMyCategories(1);
    expect(api.post).toHaveBeenCalledWith('/api/my-categories', { category_id: 1 });
    expect(result.message).toBe('Category added');
  });

  it('removeFromMyCategories calls correct endpoint', async () => {
    api.delete.mockResolvedValueOnce({ data: { message: 'Category removed' } });

    const result = await removeFromMyCategories(1);
    expect(api.delete).toHaveBeenCalledWith('/api/my-categories/1');
    expect(result.message).toBe('Category removed');
  });
});