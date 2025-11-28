import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CalendarDays, 
  ShoppingCart, 
  Settings, 
  Trash2, 
  Download, 
  Plus, 
  ChefHat,
  GripHorizontal,
  Copy
} from 'lucide-react';
import { AppData, DAYS_OF_WEEK, MealEntry } from './types';
import { loadData, saveData, clearData } from './services/storageService';
import { generatePDF } from './services/pdfService';
import { Modal } from './components/Modal';
import { MealEditor } from './components/MealEditor';

enum ViewState {
  PLANNER = 'PLANNER',
  SHOPPING = 'SHOPPING',
  SETTINGS = 'SETTINGS'
}

function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.PLANNER);
  
  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{dayIndex: number, categoryId: string} | null>(null);

  // Drag and Drop State (Mouse & Touch)
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [activeTouchSource, setActiveTouchSource] = useState<string | null>(null);

  // Auto-save effect
  useEffect(() => {
    saveData(data);
  }, [data]);

  // --- Actions ---

  const handleClearAll = () => {
    if (confirm("Tem certeza que deseja apagar todo o planejamento?")) {
      setData(clearData());
    }
  };

  const handleUpdateCategory = (index: number, newName: string) => {
    const newCategories = [...data.categories];
    newCategories[index].name = newName;
    setData(prev => ({ ...prev, categories: newCategories }));
  };

  const handleAddCategory = () => {
    const id = `cat-${Date.now()}`;
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, { id, name: 'Nova Refeição' }]
    }));
  };

  const handleRemoveCategory = (id: string) => {
    if (data.categories.length <= 1) return;
    
    // Also cleanup plan data associated with this category to keep storage clean
    const newPlan = { ...data.plan };
    DAYS_OF_WEEK.forEach((_, i) => {
        delete newPlan[`${i}-${id}`];
    });

    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      plan: newPlan
    }));
  };

  const openEditor = (dayIndex: number, categoryId: string) => {
    setEditingCell({ dayIndex, categoryId });
    setIsModalOpen(true);
  };

  const handleSaveMeal = (entry: MealEntry) => {
    if (!editingCell) return;
    
    const key = `${editingCell.dayIndex}-${editingCell.categoryId}`;
    setData(prev => ({
      ...prev,
      plan: {
        ...prev.plan,
        [key]: entry
      }
    }));
    setIsModalOpen(false);
  };

  // --- Drag and Drop Logic (Shared) ---

  const executeMealCopy = (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;

    const sourceData = data.plan[sourceKey];
    if (!sourceData) return;

    // Deep copy ingredients to avoid reference issues
    const copiedIngredients = sourceData.ingredients.map(i => ({...i, id: `copied-${Date.now()}-${i.id}`}));

    setData(prev => ({
      ...prev,
      plan: {
        ...prev.plan,
        [targetKey]: { 
          dishName: sourceData.dishName,
          ingredients: copiedIngredients,
          preparationMethod: sourceData.preparationMethod
        }
      }
    }));
  };

  // --- Mouse Drag Events ---

  const handleDragStart = (e: React.DragEvent, dayIndex: number, categoryId: string) => {
    const key = `${dayIndex}-${categoryId}`;
    e.dataTransfer.setData('sourceKey', key);
    e.dataTransfer.effectAllowed = 'copy'; 
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number, categoryId: string) => {
    e.preventDefault(); 
    const key = `${dayIndex}-${categoryId}`;
    if (dragOverCell !== key) {
      setDragOverCell(key);
    }
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, targetDayIndex: number, targetCategoryId: string) => {
    e.preventDefault();
    setDragOverCell(null);

    const sourceKey = e.dataTransfer.getData('sourceKey');
    if (!sourceKey) return;

    const targetKey = `${targetDayIndex}-${targetCategoryId}`;
    executeMealCopy(sourceKey, targetKey);
  };

  // --- Touch Drag Events (Mobile) ---

  const handleTouchStart = (e: React.TouchEvent, dayIndex: number, categoryId: string) => {
    const key = `${dayIndex}-${categoryId}`;
    // Only allow dragging if there is content
    if (!data.plan[key]?.dishName) return;

    setActiveTouchSource(key);
    // Optional: Haptic feedback
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeTouchSource) return;

    // Prevent scrolling while dragging a meal
    if (e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    // Find the element under the finger
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the closest parent that is a cell (has data-cell-key)
    const cell = targetElement?.closest('[data-cell-key]');
    
    if (cell) {
      const targetKey = cell.getAttribute('data-cell-key');
      if (targetKey && targetKey !== dragOverCell) {
        setDragOverCell(targetKey);
      }
    } else {
      setDragOverCell(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!activeTouchSource) return;

    // Prevent ghost clicks/modals
    if (e.cancelable) e.preventDefault();

    // Strategy 1: Try to find the element directly under the finger upon release (High precision)
    const touch = e.changedTouches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = targetElement?.closest('[data-cell-key]');
    let targetKey = cell?.getAttribute('data-cell-key');

    // Strategy 2: Fallback to last known dragOverCell if direct hit failed 
    // (This handles cases where the finger might be slightly off due to slow movement)
    if (!targetKey && dragOverCell) {
      targetKey = dragOverCell;
    }

    if (targetKey && targetKey !== activeTouchSource) {
      executeMealCopy(activeTouchSource, targetKey);
    }

    setActiveTouchSource(null);
    setDragOverCell(null);
  };

  // --- Shopping List Logic (With Aggregation) ---

  const shoppingList = useMemo(() => {
    interface AggregatedItem {
      name: string;
      quantity: number;
      unit: string;
    }
    
    const map = new Map<string, AggregatedItem>();

    Object.values(data.plan).forEach((meal: unknown) => {
        const m = meal as MealEntry;
        if (m.ingredients && Array.isArray(m.ingredients)) {
            m.ingredients.forEach(ing => {
              if (!ing.name) return;
              
              // Key for grouping: unit + name (lowercase)
              const key = `${ing.unit.toLowerCase()}-${ing.name.trim().toLowerCase()}`;
              
              if (!map.has(key)) {
                map.set(key, { 
                  name: ing.name.trim(), 
                  quantity: 0, 
                  unit: ing.unit 
                });
              }
              
              const current = map.get(key)!;
              current.quantity += ing.quantity;
            });
        }
    });

    const list = Array.from(map.values()).map(item => {
      if (item.unit === 'a gosto') return `${item.name} (a gosto)`;
      return `${parseFloat(item.quantity.toFixed(2))} ${item.unit} - ${item.name}`;
    });

    return list.sort();
  }, [data.plan]);

  const handleDownloadPDF = () => {
    generatePDF(data, shoppingList);
  };

  // --- Render Helpers ---

  const renderPlanner = () => (
    <div className="overflow-x-auto pb-20 select-none touch-pan-x">
      <div className="min-w-[800px]">
        {/* Header Row */}
        <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `100px repeat(${data.categories.length}, 1fr)` }}>
          <div className="font-bold text-gray-400 p-2 flex items-end justify-center">
            <span className="text-xs uppercase tracking-wider">Dia</span>
          </div>
          {data.categories.map(cat => (
            <div key={cat.id} className="bg-emerald-100 text-emerald-800 font-bold p-3 rounded-t-lg text-center shadow-sm">
              {cat.name}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DAYS_OF_WEEK.map((day, dayIndex) => (
          <div key={day} className="grid gap-2 mb-2" style={{ gridTemplateColumns: `100px repeat(${data.categories.length}, 1fr)` }}>
            <div className="font-bold text-gray-600 p-3 flex items-center justify-end bg-gray-100 rounded-l-lg">
              {day}
            </div>
            {data.categories.map(cat => {
              const key = `${dayIndex}-${cat.id}`;
              const entry = data.plan[key];
              const isDragOver = dragOverCell === key;
              const hasContent = !!entry?.dishName;
              const isTouchSource = activeTouchSource === key;

              return (
                <div 
                  key={key}
                  data-cell-key={key} // Critical for Touch detection
                  
                  // Mouse Events
                  draggable={hasContent}
                  onDragStart={(e) => hasContent && handleDragStart(e, dayIndex, cat.id)}
                  onDragOver={(e) => handleDragOver(e, dayIndex, cat.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dayIndex, cat.id)}
                  
                  // Touch Events
                  onTouchStart={(e) => handleTouchStart(e, dayIndex, cat.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  
                  onClick={() => openEditor(dayIndex, cat.id)}
                  
                  className={`
                    min-h-[120px] p-3 border rounded-lg cursor-pointer transition-all duration-200 flex flex-col relative group select-none
                    ${isDragOver ? 'border-2 border-emerald-500 bg-emerald-50 scale-[1.02] z-10 shadow-lg' : ''}
                    ${isTouchSource ? 'opacity-70 ring-2 ring-emerald-400' : ''}
                    ${!isDragOver && hasContent ? 'bg-white border-emerald-200 hover:border-emerald-400 shadow-sm' : ''}
                    ${!isDragOver && !hasContent ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 border-dashed' : ''}
                  `}
                >
                  {hasContent ? (
                    <>
                      <div className="flex justify-between items-start mb-1 pointer-events-none">
                        <div className="font-bold text-gray-800 line-clamp-2 leading-tight pr-4">{entry.dishName}</div>
                        {/* Drag Handle Indicator */}
                        <div className="text-gray-300 group-hover:text-emerald-500">
                           <GripHorizontal size={16} />
                        </div>
                      </div>
                      
                      {/* Description / Preparation Method Preview */}
                      <div className="text-xs text-gray-500 line-clamp-3 italic mt-1 flex-1 pointer-events-none">
                        {entry.preparationMethod || "Sem modo de preparo"}
                      </div>
                      
                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                         <div className="text-[10px] text-gray-400 flex items-center gap-1">
                           <Copy size={10} />
                           <span>Copiar</span>
                         </div>
                         <div className="bg-emerald-100 p-1 rounded-full text-emerald-600">
                           <ChefHat size={14} />
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-300 pointer-events-none">
                      <Plus size={24} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderShoppingList = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lista de Compras</h2>
          <p className="text-emerald-100 text-sm mt-1">{shoppingList.length} itens a comprar (Agrupados)</p>
        </div>
        <ShoppingCart className="w-8 h-8 opacity-80" />
      </div>
      <div className="p-6">
        {shoppingList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Nenhum ingrediente adicionado ainda.</p>
            <p className="text-sm mt-2">Adicione pratos com ingredientes no calendário.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shoppingList.map((item, idx) => (
              <label key={idx} className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-colors group">
                <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition duration-150 ease-in-out" />
                <span className="ml-3 text-gray-700 group-hover:text-gray-900 select-none font-medium">{item}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Configuração de Refeições
      </h2>
      <p className="text-sm text-gray-500 mb-6">Defina quantas e quais refeições você faz por dia.</p>
      
      <div className="space-y-3">
        {data.categories.map((cat, index) => (
          <div key={cat.id} className="flex items-center gap-2">
            <input
              type="text"
              value={cat.name}
              onChange={(e) => handleUpdateCategory(index, e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-gray-900"
            />
            <button
              onClick={() => handleRemoveCategory(cat.id)}
              disabled={data.categories.length <= 1}
              className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleAddCategory}
        className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-md hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Adicionar Categoria
      </button>

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Zona de Perigo</h3>
        <button
          onClick={handleClearAll}
          className="w-full py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={18} />
          Limpar Tudo (Resetar)
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Navbar */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 text-white p-2 rounded-lg">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">
              Planejador de Refeições
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
             {/* View Toggles */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView(ViewState.PLANNER)}
                className={`p-2 rounded-md transition-all ${currentView === ViewState.PLANNER ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                title="Calendário"
              >
                <CalendarDays size={20} />
              </button>
              <button
                onClick={() => setCurrentView(ViewState.SHOPPING)}
                className={`p-2 rounded-md transition-all ${currentView === ViewState.SHOPPING ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                title="Lista de Compras"
              >
                <ShoppingCart size={20} />
              </button>
              <button
                onClick={() => setCurrentView(ViewState.SETTINGS)}
                className={`p-2 rounded-md transition-all ${currentView === ViewState.SETTINGS ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                title="Configurações"
              >
                <Settings size={20} />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-2 hidden sm:block"></div>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exportar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {currentView === ViewState.PLANNER && renderPlanner()}
        {currentView === ViewState.SHOPPING && renderShoppingList()}
        {currentView === ViewState.SETTINGS && renderSettings()}
      </main>

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCell ? `${DAYS_OF_WEEK[editingCell.dayIndex]} - ${data.categories.find(c => c.id === editingCell.categoryId)?.name}` : 'Editar'}
      >
        {editingCell && (
          <MealEditor
            dayName={DAYS_OF_WEEK[editingCell.dayIndex]}
            categoryName={data.categories.find(c => c.id === editingCell.categoryId)?.name || ''}
            initialData={data.plan[`${editingCell.dayIndex}-${editingCell.categoryId}`]}
            onSave={handleSaveMeal}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </Modal>

    </div>
  );
}

export default App;
