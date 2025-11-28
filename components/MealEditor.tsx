import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { MealEntry, Ingredient, UNITS } from '../types';
import { suggestIngredients } from '../services/geminiService';

interface MealEditorProps {
  initialData?: MealEntry;
  dayName: string;
  categoryName: string;
  onSave: (data: MealEntry) => void;
  onCancel: () => void;
}

export const MealEditor: React.FC<MealEditorProps> = ({ 
  initialData, 
  dayName, 
  categoryName, 
  onSave, 
  onCancel 
}) => {
  const [dishName, setDishName] = useState(initialData?.dishName || '');
  const [preparationMethod, setPreparationMethod] = useState(initialData?.preparationMethod || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialData?.ingredients || []);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setDishName(initialData.dishName);
      setIngredients(initialData.ingredients || []);
      setPreparationMethod(initialData.preparationMethod || '');
    }
  }, [initialData]);

  const handleGenerateIngredients = async () => {
    if (!dishName) return;
    setIsGenerating(true);
    try {
      const suggestions = await suggestIngredients(dishName);
      if (suggestions && suggestions.length > 0) {
        // Append new suggestions to existing list
        setIngredients(prev => [...prev, ...suggestions]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { id: `manual-${Date.now()}`, name: '', quantity: 1, unit: 'un' }
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, [field]: value } : ing
    ));
  };

  const handleSave = () => {
    onSave({ dishName, ingredients, preparationMethod });
  };

  return (
    <div className="space-y-5">
      <div className="text-sm text-gray-500 mb-2">
        Editando: <span className="font-semibold text-gray-700">{dayName} - {categoryName}</span>
      </div>

      {/* Dish Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome do Prato
        </label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white text-gray-900"
          placeholder="Ex: Lasanha de Berinjela"
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          autoFocus
        />
      </div>

      {/* Ingredients Table */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Ingredientes
          </label>
          <button
            onClick={handleGenerateIngredients}
            disabled={!dishName || isGenerating}
            className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
              !dishName || isGenerating 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Sugerir
          </button>
        </div>

        <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 max-h-60 overflow-y-auto custom-scrollbar">
          {ingredients.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              Nenhum ingrediente. Clique em + ou use a IA.
            </div>
          )}
          <div className="space-y-2">
            {ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Qtd"
                  className="w-14 sm:w-16 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none bg-white text-gray-900"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                />
                <select
                  className="w-20 sm:w-24 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none bg-white text-gray-900"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Nome"
                  className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none bg-white text-gray-900 min-w-0"
                  value={ing.name}
                  onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                />
                <button 
                  onClick={() => removeIngredient(ing.id)}
                  className="text-red-400 hover:text-red-600 p-2 shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={addIngredientRow}
          className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 p-1"
        >
          <Plus size={18} /> Adicionar ingrediente
        </button>
      </div>

      {/* Preparation Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Modo de Preparo
        </label>
        <textarea
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none h-24 bg-white text-gray-900 resize-none"
          placeholder="Ex: Corte as berinjelas em fatias finas..."
          value={preparationMethod}
          onChange={(e) => setPreparationMethod(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-emerald-600 flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          Salvar
        </button>
      </div>
    </div>
  );
};
