import {
  Utensils, Car, ShoppingBag, House, Heart, Film, GraduationCap, Plane, Ellipsis,
} from 'lucide-react';

export const categories = [
  ['Food & dining', '#f5a35b', Utensils],
  ['Transport', '#78a5eb', Car],
  ['Shopping', '#be93eb', ShoppingBag],
  ['Housing', '#73c9b5', House],
  ['Health', '#ec8291', Heart],
  ['Entertainment', '#e4be58', Film],
  ['Education', '#7f91dc', GraduationCap],
  ['Travel', '#58b9c3', Plane],
  ['Other', '#98a2ad', Ellipsis],
] as const;
