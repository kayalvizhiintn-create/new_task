import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Settings, FolderTree, Shield, MapPin, AlertTriangle, Activity, Plus, Trash2, ChevronRight, BarChart2, Edit2, Check, X, Users, Menu, RefreshCcw } from 'lucide-react';
import EmployeeList from './EmployeeList';
import { categoryService } from '../services/categoryService';
import { subcategoryService } from '../services/subcategoryService';
import { roleService } from '../services/roleService';
import { enumService } from '../services/enumService';
import { privilegeService } from '../services/privilegeService';
import Swal from 'sweetalert2';


// Helper to extract string value from either a string or an object {name: '...'} or {_id: '...', name: '...'}
const getItemName = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.name || item.title || item.value || item.categoryName || item.subcategoryName || item.subCategoryName || item.taskDesc || item.roleName || item.priorityName || item.statusName || item.empName || item.employeeName || item.menuName || item.MenuName || 'Unknown';
};

const getItemId = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.id || item._id || item.value || item.subcategoryId || item.subCategoryId || item.categoryId || item.taskId || item.roleId || item.priorityId || item.statusId || item.empId || item.menuId || item.MenuId || JSON.stringify(item);
};

const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (typeof data === 'object') {
    return Object.keys(data).map(k => ({ id: k, name: k, value: k }));
  }
  return [];
};

const SimpleListManager = ({ title, fetchFn, addFn, updateFn, deleteFn, readOnly = false }) => {
  const { isDarkMode } = useStore();
  const [data, setData] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      if (fetchFn) {
        const res = await fetchFn();
        setData(ensureArray(res));
      }
    } catch (error) {
      console.error(`Error fetching ${title}`, error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 15-minute background refresh interval
    const intervalId = setInterval(async () => {
      setIsRefreshing(true);
      await loadData(true);
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchFn]);

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditValue(getItemName(item));
  };

  const handleSaveEdit = async (oldItem) => {
    if (editValue.trim() && updateFn) {
      try {
        const id = getItemId(oldItem);
        await updateFn(id, { name: editValue.trim(), value: editValue.trim() });
        await loadData();
      } catch (error) {
        console.error("Error updating", error);
      }
    }
    setEditingItem(null);
  };
  
  const handleDelete = async (item) => {
    if (deleteFn) {
      const itemName = getItemName(item);
      Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete "${itemName}"? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const id = getItemId(item);
            await deleteFn(id);
            await loadData();
            Swal.fire({
              title: 'Deleted!',
              text: `"${itemName}" has been deleted successfully.`,
              icon: 'success',
              confirmButtonColor: '#3b82f6',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
            });
          } catch (error) {
            console.error("Error deleting", error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to delete the item.',
              icon: 'error',
              confirmButtonColor: '#3b82f6',
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
            });
          }
        }
      });
    }
  };

  return (
    <div className={cn("p-6 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
      <h3 className={cn("text-xl font-bold mb-6", isDarkMode ? "text-white" : "text-slate-900")}>{title}</h3>
      
      {!readOnly && (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const input = e.target.elements.newItem.value.trim();
          if (input && addFn) {
            try {
              await addFn({ name: input, value: input });
              e.target.reset();
              await loadData();
            } catch (error) {
              console.error("Error adding", error);
            }
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
      )}

      {loading ? (
        <div className="text-center p-4 text-slate-500 font-medium">Loading...</div>
      ) : (
        <div className="space-y-3">
          {data.map((item, idx) => {
            const itemId = getItemId(item) || idx;
            const itemName = getItemName(item);
            
            return (
            <div key={itemId} className={cn("flex items-center justify-between p-4 rounded-xl border", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
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
                  <span className="font-bold">{itemName}</span>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )})}
          {data.length === 0 && (
            <div className="text-center p-4 text-slate-500 font-medium">No items found.</div>
          )}
        </div>
      )}

      {isRefreshing && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-indigo-600 text-white text-sm font-black tracking-wide animate-bounce">
          <RefreshCcw className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}
    </div>
  );
};

export default function Masters() {
  const { isDarkMode, places, dashboardMetrics, addMasterItem, editMasterItem, removeMasterItem, userPrivileges, currentUser } = useStore(); 
          
  const [activeTab, setActiveTab] = useState('categories');
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');

  const [categoriesData, setCategoriesData] = useState([]);
  const [subCategoriesData, setSubCategoriesData] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [editSubCategoryValue, setEditSubCategoryValue] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');

  const TABS = [
    { id: 'categories', label: 'Categories & Subs', icon: FolderTree },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'places', label: 'Work Places', icon: MapPin }, // Fallback to local
    { id: 'priorities', label: 'Priorities', icon: AlertTriangle },
    { id: 'statuses', label: 'Task Statuses', icon: Activity },
    { id: 'metrics', label: 'Dashboard Metrics', icon: BarChart2 }, // Fallback to local
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'menus', label: 'Menus', icon: Menu },
  ];

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadCategories = async (isBackground = false) => {
    if (!isBackground) setLoadingCategories(true);
    try {
      const catRes = await categoryService.getAllCategories();
      const subRes = await subcategoryService.getAllSubcategories();
      
      setCategoriesData(ensureArray(catRes));
      setSubCategoriesData(ensureArray(subRes));
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      if (!isBackground) setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      loadCategories();
    }
  }, [activeTab]);

  useEffect(() => {
    // 15-minute background refresh interval
    const intervalId = setInterval(async () => {
      if (activeTab === 'categories') {
        setIsRefreshing(true);
        await loadCategories(true);
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [activeTab]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      try {
        await categoryService.createCategory({ 
          categoryId: 0, 
          categoryName: newCatName.trim() 
        });
        setNewCatName('');
        await loadCategories();
      } catch (error) {
        console.error("Failed to add category", error);
      }
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (selectedCatForSub && newSubCatName.trim()) {
      try {
        await subcategoryService.createSubcategory({ 
          subCategoryId: 0, 
          categoryId: parseInt(selectedCatForSub, 10), 
          subCategoryName: newSubCatName.trim() 
        });
        setNewSubCatName('');
        await loadCategories();
      } catch (error) {
        console.error("Failed to add subcategory", error);
      }
    }
  };

  // Organize subcategories by category ID
  const subsByCat = {};
  categoriesData.forEach(cat => {
    const catId = getItemId(cat);
    subsByCat[catId] = subCategoriesData.filter(sub => {
      // Trying common ways relational data is linked
      return sub.categoryId === catId || sub.category_id === catId || sub.category === catId || sub.category?.id === catId || sub.category?._id === catId;
    });
  });

  const mastersPermissions = userPrivileges['masters settings'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';
  const canAccess = isAdmin || mastersPermissions.canView === 1;

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-[pulse_2s_infinite]">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Access Denied</h2>
        <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          You do not have the required permissions to access Masters Settings. Please contact your system administrator.
        </p>
        <Link to="/dashboard" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4">
        <div className={cn("p-4 rounded-2xl", isDarkMode ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600")}>
          <Settings className="w-8 h-8" />
        </div>
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Masters Settings</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Manage all dynamic dropdown data directly from the Database.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className={cn("w-full md:w-64 shrink-0 flex flex-col gap-2 p-4 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
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

                {loadingCategories ? (
                  <div className="text-center p-8 text-slate-500">Loading categories from database...</div>
                ) : (
                  <div className="space-y-4">
                    {categoriesData.map(cat => {
                      const catId = getItemId(cat);
                      const catName = getItemName(cat);
                      
                      return (
                      <div key={catId} className={cn("p-5 rounded-2xl border", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100")}>
                        <div className="flex justify-between items-center mb-4 border-b pb-4 border-slate-200 dark:border-slate-700">
                          {editingCategory === catId ? (
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
                              <button onClick={async () => {
                                if(editCategoryValue.trim()) {
                                  try {
                                    await categoryService.updateCategory(catId, { 
                                      categoryId: parseInt(catId, 10), 
                                      categoryName: editCategoryValue.trim() 
                                    });
                                    await loadCategories();
                                  } catch(e) { console.error(e); }
                                }
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
                              <span className="font-extrabold text-lg text-indigo-600 dark:text-indigo-400">{catName}</span>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingCategory(catId);
                                    setEditCategoryValue(catName);
                                  }}
                                  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors text-sm font-bold flex items-center gap-1.5"
                                >
                                  <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button 
                                  onClick={() => {
                                    Swal.fire({
                                      title: 'Are you sure?',
                                      text: `Do you want to delete category "${catName}"? This will delete all its sub-categories.`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#ef4444',
                                      cancelButtonColor: '#64748b',
                                      confirmButtonText: 'Yes, delete it!',
                                      background: isDarkMode ? '#1e293b' : '#ffffff',
                                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                                    }).then(async (result) => {
                                      if (result.isConfirmed) {
                                        try {
                                          await categoryService.deleteCategory(catId);
                                          await loadCategories();
                                          Swal.fire({
                                            title: 'Deleted!',
                                            text: `Category "${catName}" has been deleted.`,
                                            icon: 'success',
                                            confirmButtonColor: '#3b82f6',
                                            background: isDarkMode ? '#1e293b' : '#ffffff',
                                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                                          });
                                        } catch(e) {
                                          console.error(e);
                                          Swal.fire({
                                            title: 'Error!',
                                            text: 'Failed to delete category.',
                                            icon: 'error',
                                            confirmButtonColor: '#3b82f6',
                                            background: isDarkMode ? '#1e293b' : '#ffffff',
                                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                                          });
                                        }
                                      }
                                    });
                                  }}
                                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-bold flex items-center gap-1.5"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(subsByCat[catId] || []).map(sub => {
                            const subId = getItemId(sub);
                            const subName = getItemName(sub);
                            
                            return (
                            <div key={subId} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold", isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white border text-slate-700 shadow-sm")}>
                              {editingSubCategory === subId ? (
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
                                  <button onClick={async () => {
                                    if(editSubCategoryValue.trim()) {
                                      try {
                                        await subcategoryService.updateSubcategory(subId, { 
                                          subCategoryId: parseInt(subId, 10), 
                                          categoryId: parseInt(catId, 10),
                                          subCategoryName: editSubCategoryValue.trim() 
                                        });
                                        await loadCategories();
                                      } catch(e) { console.error(e); }
                                    }
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
                                  {subName}
                                  <button onClick={() => {
                                    setEditingSubCategory(subId);
                                    setEditSubCategoryValue(subName);
                                  }} className="text-blue-400 hover:text-blue-600 ml-1">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => {
                                    Swal.fire({
                                      title: 'Are you sure?',
                                      text: `Do you want to delete sub-category "${subName}"?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonColor: '#ef4444',
                                      cancelButtonColor: '#64748b',
                                      confirmButtonText: 'Yes, delete it!',
                                      background: isDarkMode ? '#1e293b' : '#ffffff',
                                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                                    }).then(async (result) => {
                                      if (result.isConfirmed) {
                                        try {
                                          await subcategoryService.deleteSubcategory(subId);
                                          await loadCategories();
                                          Swal.fire({
                                            title: 'Deleted!',
                                            text: `Sub-category "${subName}" has been deleted.`,
                                            icon: 'success',
                                            confirmButtonColor: '#3b82f6',
                                            background: isDarkMode ? '#1e293b' : '#ffffff',
                                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                                          });
                                        } catch(e) {
                                          console.error(e);
                                          Swal.fire({
                                            title: 'Error!',
                                            text: 'Failed to delete sub-category.',
                                            icon: 'error',
                                            confirmButtonColor: '#3b82f6',
                                            background: isDarkMode ? '#1e293b' : '#ffffff',
                                            color: isDarkMode ? '#f8fafc' : '#0f172a',
                                          });
                                        }
                                      }
                                    });
                                  }} className="text-rose-400 hover:text-rose-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )})}
                          {(subsByCat[catId] || []).length === 0 && <span className="text-sm text-slate-400 italic">No sub-categories</span>}
                        </div>

                        <form 
                          onSubmit={handleAddSubCategory}
                          className="flex gap-2"
                        >
                          <input 
                            type="text" 
                            placeholder="New sub-category..."
                            value={selectedCatForSub === catId ? newSubCatName : ''}
                            onChange={(e) => {
                              setSelectedCatForSub(catId);
                              setNewSubCatName(e.target.value);
                            }}
                            className={cn("flex-1 px-3 py-2 rounded-lg border outline-none text-sm font-medium",
                              isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200"
                            )}
                          />
                          <button 
                            type="submit" 
                            disabled={selectedCatForSub !== catId || !newSubCatName.trim()} 
                            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 dark:text-indigo-300 rounded-lg font-bold text-sm transition-colors"
                          >
                            Add Sub
                          </button>
                        </form>
                      </div>
                    )})}
                    {categoriesData.length === 0 && (
                      <div className="text-center p-8 text-slate-500 font-medium">No categories found in Database.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <SimpleListManager 
              title="Roles" 
              fetchFn={roleService.getAllRoles} 
              addFn={async (item) => roleService.createRole({ roleId: 0, roleName: item.name })}
              updateFn={async (id, item) => roleService.updateRole({ roleId: parseInt(id, 10), roleName: item.name })}
              deleteFn={roleService.deleteRole}
            />
          )}
          
          {activeTab === 'places' && (
            <SimpleListManager 
              title="Work Places" 
              fetchFn={async () => places.map(p => ({ id: p, name: p }))}
              addFn={async (item) => addMasterItem('places', item.name)}
              updateFn={async (id, item) => editMasterItem('places', id, item.name)}
              deleteFn={async (id) => removeMasterItem('places', id)}
            />
          )}
          
          {activeTab === 'priorities' && (
            <SimpleListManager 
              title="Priorities" 
              fetchFn={enumService.getPriorityDropdown} 
              readOnly={true} // Priority enum API is GET only
            />
          )}
          
          {activeTab === 'statuses' && (
            <SimpleListManager 
              title="Task Statuses" 
              fetchFn={enumService.getStatusDropdown} 
              readOnly={true} // Status enum API is GET only
            />
          )}
          
          {activeTab === 'metrics' && (
            <SimpleListManager 
              title="Dashboard Metrics" 
              fetchFn={async () => dashboardMetrics.map(m => ({ id: m, name: m }))}
              addFn={async (item) => addMasterItem('dashboardMetrics', item.name)}
              updateFn={async (id, item) => editMasterItem('dashboardMetrics', id, item.name)}
              deleteFn={async (id) => removeMasterItem('dashboardMetrics', id)}
            />
          )}
          
          {activeTab === 'employees' && (
            <div className="mt-[-24px]">
              <EmployeeList />
            </div>
          )}

          {activeTab === 'menus' && (
            <SimpleListManager 
              title="Menus" 
              fetchFn={privilegeService.getAllMenus} 
              addFn={async (item) => {
                return privilegeService.createMenu({
                  menuId: 0,
                  parentId: 0,
                  menuName: item.name,
                  orderId: 0
                });
              }}
              updateFn={async (id, item) => {
                return privilegeService.updateMenu({
                  menuId: parseInt(id, 10),
                  parentId: 0,
                  menuName: item.name,
                  orderId: 0
                });
              }}
              deleteFn={privilegeService.deleteMenu}
            />
          )}
        </div>
      </div>

      {isRefreshing && activeTab === 'categories' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-indigo-600 text-white text-sm font-black tracking-wide animate-bounce">
          <RefreshCcw className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}
    </div>
  );
}
