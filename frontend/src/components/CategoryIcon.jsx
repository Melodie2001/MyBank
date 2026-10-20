import Icon from './Icon';

const categoryIcons = {
  'house.png': 'home',
  'train.png': 'train',
  'healthcare.png': 'heart',
  'books.png': 'book',
  'plane.png': 'plane',
  'dog.png': 'paw',
  'briefcase.png': 'briefcase',
  'gamepad.png': 'game',
  'burger.png': 'food',
  'pills.png': 'pill',
  'entertainment.png': 'film',
  'cart.png': 'cart',
  'transfer.png': 'transfer',
};

export default function CategoryIcon({ category, size = 24 }) {
  return <Icon name={categoryIcons[category?.icon] || 'wallet'} size={size} style={{ color: category?.color }} />;
}
