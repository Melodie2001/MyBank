import api from '../api/axios';

// Toutes les categories disponibles (pour la modale de sélection)
export async function getCategories() {
  const response = await api.get('/api/categories');
  return response.data;
}

// Les categories de l'utilisateur connecté
export async function getMyCategories() {
  const response = await api.get('/api/my-categories');
  return response.data;
}

// Ajouter une categorie à sa liste
export async function addToMyCategories(categoryId) {
  const response = await api.post('/api/my-categories', { category_id: categoryId });
  return response.data;
}

// Supprimer une categorie de sa liste
export async function removeFromMyCategories(id) {
  const response = await api.delete(`/api/my-categories/${id}`);
  return response.data;
}