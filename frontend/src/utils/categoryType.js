// Older API responses have no type. Keep them usable during a rolling deployment.
export function categoryType(category) {
  return category?.type || 'both';
}
export function acceptsOperation(category, operationType) {
  return categoryType(category) === 'both' || categoryType(category) === operationType;
}
