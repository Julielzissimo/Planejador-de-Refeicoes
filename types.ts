export interface MealCategory {
  id: string;
  name: string;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface MealEntry {
  dishName: string;
  ingredients: Ingredient[]; 
  preparationMethod?: string; // Formerly notes/description, now specific for cooking instructions
}

// Key format: "dayIndex-categoryId" (e.g., "0-breakfast")
export type MealPlan = Record<string, MealEntry>;

export interface AppData {
  categories: MealCategory[];
  plan: MealPlan;
}

export const DAYS_OF_WEEK = [
  'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'
];

export const DEFAULT_CATEGORIES: MealCategory[] = [
  { id: 'cafedamanha', name: 'Café da Manhã' },
  { id: 'almoco', name: 'Almoço' },
  { id: 'jantar', name: 'Jantar' },
];

export const UNITS = [
  'un',
  'g',
  'kg',
  'ml',
  'l',
  'xícara',
  'colher',
  'fatia',
  'pacote',
  'lata',
  'a gosto'
];