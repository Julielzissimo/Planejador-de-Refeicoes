import { AppData, DEFAULT_CATEGORIES, MealEntry, Ingredient } from '../types';

const STORAGE_KEY = 'meal_planner_data_v2';

// Helper to migrate legacy data if necessary
const migrateEntry = (entry: any): MealEntry => {
  // Check if ingredients is a string (legacy format)
  if (typeof entry.ingredients === 'string') {
    const legacyString = entry.ingredients as string;
    const ingredients: Ingredient[] = legacyString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map((name, index) => ({
        id: `migrated-${Date.now()}-${index}`,
        name: name,
        quantity: 1, // Default to 1
        unit: 'un'   // Default to unit
      }));

    return {
      dishName: entry.dishName,
      ingredients: ingredients,
      preparationMethod: entry.notes || '' // Migrate notes to preparation method
    };
  }
  return entry;
};

export const loadData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Migration Logic for Plan
      const migratedPlan: Record<string, MealEntry> = {};
      if (parsed.plan) {
        Object.keys(parsed.plan).forEach(key => {
          migratedPlan[key] = migrateEntry(parsed.plan[key]);
        });
      }

      return {
        categories: parsed.categories || DEFAULT_CATEGORIES,
        plan: migratedPlan
      };
    }
  } catch (e) {
    console.error("Failed to load data", e);
  }
  return {
    categories: DEFAULT_CATEGORIES,
    plan: {}
  };
};

export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

export const clearData = () => {
  localStorage.removeItem(STORAGE_KEY);
  return {
    categories: DEFAULT_CATEGORIES,
    plan: {}
  };
};