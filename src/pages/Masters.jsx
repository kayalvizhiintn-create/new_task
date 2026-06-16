import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Settings, FolderTree, Shield, MapPin, AlertTriangle, Activity, Plus, Trash2, ChevronRight, BarChart2, Edit2, Check, X } from 'lucide-react';

const SimpleListManager = ({ title, listName, data }) => {
  const { isDarkMode, addMasterItem, removeMasterItem, editMasterItem } = useStore();
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditValue(item);
  };

  const handleSaveEdit = (oldItem) => {
    if (editValue.trim()) {
      editMasterItem(listName, oldItem, editValue.trim());
    }
    setEditingItem(null);
  };
  
  return (
    <div className={cn("p-6 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
      <h3 className={cn("text-xl font-bold mb-6", isDarkMode ? "text-white" : "text-slate-900")}>{title}</h3>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.target.elements.newItem.value.trim();
        if (input) {
          addMasterItem(listName, input);
          e.target.reset();
        }
      }} className="flex gap-3 mb-6">
        <input 
          name="newItem"
          type="text" 
          placeholder={`Add new ${title.toLowerCase()}...`}
          className={cn("flex-1 px-4 py-2.5 rounded-xl border outline-none font-medium",
            isDarkMode ? "bg-slate-900/50 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"
          )}
        />
        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>

      <div className="space-y-3">
        {data.map(item => (
          <div key={item} className={cn("flex items-center justify-between p-4 rounded-xl border", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
            {editingItem === item ? (
              <div className="flex items-center gap-2 flex-1 mr-4">
                <input 
                  type="text" 
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={cn("flex-1 px-3 py-1.5 rounded-lg border outline-none text-sm font-semibold",
                    isDarkMode ? "bg-slate-800 border-slate-600 text-slate-100" : "bg-white border-slate-300"
                  )}
                  autoFocus
                />
                <button onClick={() => handleSaveEdit(item)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingItem(null)} className="p-1.5 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="font-bold">{item}</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeMasterItem(listName, item)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-center p-4 text-slate-500 font-medium">No items found.</div>
        )}
      </div>
    </div>
  );
};

export default function Masters() {
  const { isDarkMode, categories, priorities, statuses, roles, places, dashboardMetrics,
          addMasterCategory, addMasterSubCategory, removeMasterCategory, removeMasterSubCategory,
          editMasterCategory, editMasterSubCategory } = useStore();
          
  const [activeTab, setActiveTab] = useState('categories');
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');

  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [editSubCategoryValue, setEditSubCategoryValue] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');

  const TABS = [
    { id: 'categories', label: 'Categories & Subs', icon: FolderTree },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'places', label: 'Work Places', icon: MapPin },
    { id: 'priorities', label: 'Priorities', icon: AlertTriangle },
    { id: 'statuses', label: 'Task Statuses', icon: Activity },
    { id: 'metrics', label: 'Dashboard Metrics', icon: BarChart2 },
  ];

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCatName.trim() && !categories[newCatName.trim()]) {
      addMasterCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  const handleAddSubCategory = (e) => {
    e.preventDefault();
    if (selectedCatForSub && newSubCatName.trim()) {
      addMasterSubCategory(selectedCatForSub, newSubCatName.trim());
      setNewSubCatName('');
    }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4">
        <div className={cn("p-4 rounded-2xl", isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600")}>
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Masters Settings</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Manage all dynamic dropdown data across the application.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className={cn("w-full lg:w-64 shrink-0 flex flex-col gap-2 p-4 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn("flex items-center justify-between w-full p-3.5 rounded-xl font-bold transition-all duration-200 text-left",
                  isActive 
                    ? (isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-700") 
                    : (isDarkMode ? "hover:bg-slate-700/50 text-slate-400" : "hover:bg-slate-50 text-slate-600")
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </div>
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            )
          })}
        </div>

        <div className="flex-1">
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div className={cn("p-6 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
                <h3 className={cn("text-xl font-bold mb-6", isDarkMode ? "text-white" : "text-slate-900")}>Categories & Sub-Categories</h3>
                
                <form onSubmit={handleAddCategory} className="flex gap-3 mb-8">
                  <input 
                    type="text" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Add a new main category..."
                    className={cn("flex-1 px-4 py-2.5 rounded-xl border outline-none font-medium",
                      isDarkMode ? "bg-slate-900/50 border-slate-700 text-slate-100" : "bg-slate-50 border-slate-200"
                    )}
                  />
                  <button type="submit" disabled={!newCatName.trim()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Category
                  </button>
                </form>

                <div className="space-y-4">
                  {Object.keys(categories).map(cat => (
                    <div key={cat} className={cn("p-5 rounded-2xl border", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
                      <div className="flex justify-between items-center mb-4 border-b pb-4 border-slate-200 dark:border-slate-700">
                        {editingCategory === cat ? (
                          <div className="flex items-center gap-2 flex-1 mr-4">
                            <input 
                              type="text" 
                              value={editCategoryValue}
                              onChange={(e) => setEditCategoryValue(e.target.value)}
                              className={cn("flex-1 px-3 py-1.5 rounded-lg border outline-none text-sm font-semibold",
                                isDarkMode ? "bg-slate-800 border-slate-600 text-slate-100" : "bg-white border-slate-300"
                              )}
                              autoFocus
                            />
                            <button onClick={() => {
                              if(editCategoryValue.trim()) editMasterCategory(cat, editCategoryValue.trim());
                              setEditingCategory(null);
                            }} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors">
                              <Check className="w-5 h-5" />
                            </button>
                            <button onClick={() => setEditingCategory(null)} className="p-1.5 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-extrabold text-lg text-indigo-600 dark:text-indigo-400">{cat}</span>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setEditCategoryValue(cat);
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-bold flex items-center gap-1.5"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button 
                                onClick={() => removeMasterCategory(cat)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-bold flex items-center gap-1.5"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {categories[cat].map(sub => (
                          <div key={sub} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold", isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white border text-slate-700 shadow-sm")}>
                            {editingSubCategory?.cat === cat && editingSubCategory?.sub === sub ? (
                              <div className="flex items-center gap-1">
                                <input 
                                  type="text" 
                                  value={editSubCategoryValue}
                                  onChange={(e) => setEditSubCategoryValue(e.target.value)}
                                  className={cn("w-24 px-2 py-0.5 rounded border outline-none text-xs",
                                    isDarkMode ? "bg-slate-700 border-slate-600 text-slate-100" : "bg-slate-50 border-slate-300 text-slate-900"
                                  )}
                                  autoFocus
                                />
                                <button onClick={() => {
                                  if(editSubCategoryValue.trim()) editMasterSubCategory(cat, sub, editSubCategoryValue.trim());
                                  setEditingSubCategory(null);
                                }} className="text-emerald-500 hover:text-emerald-600">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingSubCategory(null)} className="text-slate-400 hover:text-slate-600">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                {sub}
                                <button onClick={() => {
                                  setEditingSubCategory({cat, sub});
                                  setEditSubCategoryValue(sub);
                                }} className="text-blue-400 hover:text-blue-600 ml-1">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => removeMasterSubCategory(cat, sub)} className="text-rose-400 hover:text-rose-600">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                        {categories[cat].length === 0 && <span className="text-sm text-slate-400 italic">No sub-categories</span>}
                      </div>

                      <form 
                        onSubmit={handleAddSubCategory}
                        className="flex gap-2"
                      >
                        <input 
                          type="text" 
                          placeholder="New sub-category..."
                          value={selectedCatForSub === cat ? newSubCatName : ''}
                          onChange={(e) => {
                            setSelectedCatForSub(cat);
                            setNewSubCatName(e.target.value);
                          }}
                          className={cn("flex-1 px-3 py-2 rounded-lg border outline-none text-sm font-medium",
                            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200"
                          )}
                        />
                        <button 
                          type="submit" 
                          disabled={selectedCatForSub !== cat || !newSubCatName.trim()} 
                          className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 rounded-lg font-bold text-sm transition-colors"
                        >
                          Add Sub
                        </button>
                      </form>
                    </div>
                  ))}
                  {Object.keys(categories).length === 0 && (
                    <div className="text-center p-8 text-slate-500 font-medium">No categories found.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && <SimpleListManager title="Roles" listName="roles" data={roles} />}
          {activeTab === 'places' && <SimpleListManager title="Work Places" listName="places" data={places} />}
          {activeTab === 'priorities' && <SimpleListManager title="Priorities" listName="priorities" data={priorities} />}
          {activeTab === 'statuses' && <SimpleListManager title="Task Statuses" listName="statuses" data={statuses} />}
          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SimpleListManager title="Dashboard Metrics" listName="dashboardMetrics" data={dashboardMetrics || []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
