import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/cn';
import { Settings, FolderTree, Shield, MapPin, AlertTriangle, Activity, Plus, Trash2, ChevronRight, BarChart2, Edit2, Check, X, Users, Menu, RefreshCcw, Briefcase, GripVertical, Layers, ChevronDown, ChevronUp, AlignLeft } from 'lucide-react';
import EmployeeList from './EmployeeList';
import WorkflowTemplates from './WorkflowTemplates';
import { categoryService } from '../services/categoryService';
import workflowService from '../services/workflowService';
import { developmentService } from '../services/developmentService';
import { supportService } from '../services/supportService';
import { hardwareOthersService } from '../services/hardwareOthersService';
import { roleService } from '../services/roleService';
import { enumService } from '../services/enumService';
import { privilegeService } from '../services/privilegeService';
import { projectService } from '../services/projectService';
import Swal from 'sweetalert2';


// Helper to extract string value from either a string or an object {name: '...'} or {_id: '...', name: '...'}
const getItemName = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.name || item.projectName || item.ProjectName || item.title || item.value || item.categoryName || item.subcategoryName || item.subCategoryName || item.taskDesc || item.roleName || item.priorityName || item.statusName || item.empName || item.employeeName || item.menuName || item.MenuName || 'Unknown';
};

const cleanCatName = (name) => {
  if (!name) return '';
  return name.replace(/\s*\((project|development|support|hardware\s*&\s*others)\)/i, '').trim();
};

const getItemId = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.id || item.projectId || item.ProjectId || item._id || item.value || item.subcategoryId || item.subCategoryId || item.categoryId || item.taskId || item.roleId || item.priorityId || item.statusId || item.empId || item.menuId || item.MenuId || JSON.stringify(item);
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
        const errMsg = error.response?.data?.message || error.response?.data?.Message || "Failed to update item.";
        Swal.fire({
          title: 'Duplicate/Error!',
          text: errMsg,
          icon: 'error',
          confirmButtonColor: '#3b82f6',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
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
              const errMsg = error.response?.data?.message || error.response?.data?.Message || "Failed to add item.";
              Swal.fire({
                title: 'Duplicate/Error!',
                text: errMsg,
                icon: 'error',
                confirmButtonColor: '#3b82f6',
                background: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#f8fafc' : '#0f172a',
              });
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
            )
          })}
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
  const { isDarkMode, places, dashboardMetrics, addMasterItem, editMasterItem, removeMasterItem, userPrivileges, currentUser, permissionCodes = {} } = useStore();

  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || location.state?.activeTab || 'categories';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') || location.state?.activeTab;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location, activeTab]);
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');

  const [categoriesData, setCategoriesData] = useState([]);
  const [subCategoriesData, setSubCategoriesData] = useState([]);
  const [templates, setTemplates] = useState([]);
  
  // Dedicated Workflow Assignment / Creation states
  const [expandedWorkflows, setExpandedWorkflows] = useState({}); // { [templateId]: boolean }

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateModalSubId, setTemplateModalSubId] = useState(null);
  const [templateModalEditId, setTemplateModalEditId] = useState(null);
  const [templateModalName, setTemplateModalName] = useState('');
  const [templateModalDesc, setTemplateModalDesc] = useState('');

  // Stage modal state
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageModalTemplateId, setStageModalTemplateId] = useState(null);
  const [stageModalEditId, setStageModalEditId] = useState(null);
  const [stageModalName, setStageModalName] = useState('');
  const [stageModalSeq, setStageModalSeq] = useState(1);
  const [stageModalDeadline, setStageModalDeadline] = useState(5);

  // Task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalStageId, setTaskModalStageId] = useState(null);
  const [taskModalEditId, setTaskModalEditId] = useState(null);
  const [taskModalName, setTaskModalName] = useState('');
  const [taskModalDesc, setTaskModalDesc] = useState('');

  const [devSubs, setDevSubs] = useState([]);
  const [supportSubs, setSupportSubs] = useState([]);
  const [hardwareOthersSubs, setHardwareOthersSubs] = useState([]);
  const [activeMasterSection, setActiveMasterSection] = useState('development');
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryValue, setEditCategoryValue] = useState('');

  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [editSubCategoryValue, setEditSubCategoryValue] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState('');

  const [editingProject, setEditingProject] = useState(null);
  const [editProjectValue, setEditProjectValue] = useState('');

  // Drag-and-drop order (persisted in localStorage)
  const [catOrderMap, setCatOrderMap] = useState(() => {
    try {
      const sections = ['development', 'support', 'hardwareOthers', 'projects'];
      const map = {};
      sections.forEach(sec => {
        const saved = localStorage.getItem(`masters_cat_order_${sec}`);
        if (saved) map[sec] = JSON.parse(saved);
      });
      return map;
    } catch { return {}; }
  });
  const [subOrderMap, setSubOrderMap] = useState({});
  const [dragCat, setDragCat] = useState(null); // { section, idx }
  const [dragSub, setDragSub] = useState(null); // { catId, idx }

  const TABS = [
    { id: 'categories', label: 'Categories & Subs', icon: FolderTree },
    { id: 'workflows', label: 'Workflow Templates', icon: Layers },
    { id: 'assignWorkflows', label: 'Subcategory Workflows', icon: Settings },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'places', label: 'Work Places', icon: MapPin }, // Fallback to local
    { id: 'priorities', label: 'Priorities', icon: AlertTriangle },
    { id: 'statuses', label: 'Task Statuses', icon: Activity },
    { id: 'metrics', label: 'Dashboard Metrics', icon: BarChart2 }, // Fallback to local
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'menus', label: 'Menus', icon: Menu },
  ];

  const [isRefreshing, setIsRefreshing] = useState(false);

  const safeGetAll = async (fetchFn) => {
    try {
      const res = await fetchFn();
      return ensureArray(res);
    } catch {
      return [];
    }
  };

  const loadCategories = async (isBackground = false) => {
    if (!isBackground) setLoadingCategories(true);
    try {
      const catRes = await categoryService.getAllCategories();
      const cats = ensureArray(catRes);
      setCategoriesData(cats);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
    // Always load subs independently — they return 400 when empty, which is not fatal
    const [devArr, supArr, hwArr, templatesRes] = await Promise.all([
      safeGetAll(developmentService.getAll),
      safeGetAll(supportService.getAll),
      safeGetAll(hardwareOthersService.getAll),
      workflowService.getAllTemplates().catch(() => null)
    ]);
    setDevSubs(devArr);
    setSupportSubs(supArr);
    setHardwareOthersSubs(hwArr);
    setSubCategoriesData([...devArr, ...supArr, ...hwArr]);
    if (templatesRes && templatesRes.isSuccess) {
      setTemplates(templatesRes.data || []);
    }
    if (!isBackground) setLoadingCategories(false);
  };

  const [projectsData, setProjectsData] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const loadProjects = async (isBackground = false) => {
    if (!isBackground) setLoadingProjects(true);
    try {
      const res = await projectService.getAllProjects();
      setProjectsData(ensureArray(res));
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories' || activeTab === 'assignWorkflows') {
      loadCategories();
    } else if (activeTab === 'projects') {
      loadCategories(true); // Need subcategories loaded silently
      loadProjects();
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

  const getServiceForCat = (catId) => {
    const cat = categoriesData.find(c => String(getItemId(c)) === String(catId));
    const name = (cat ? getItemName(cat) : '').toLowerCase();
    if (name.includes('development')) return developmentService;
    if (name.includes('support')) return supportService;
    // Projects categories also use hardwareOthersService under the hood for sub-categories
    return hardwareOthersService;
  };

  const handleAssignWorkflow = async (subId, templateId) => {
    try {
      // 1. Find all templates currently associated with this subcategory and clear them (if not the selected one)
      const currentAssigned = templates.filter(t => t.subCategoryId === subId);
      for (const t of currentAssigned) {
        if (t.templateId !== templateId) {
          await workflowService.updateTemplate({
            templateId: t.templateId,
            templateName: t.templateName,
            description: t.description,
            subCategoryId: null
          });
        }
      }

      // 2. Associate the selected template with this subcategory
      if (templateId) {
        const targetTmpl = templates.find(t => t.templateId === templateId);
        if (targetTmpl) {
          await workflowService.updateTemplate({
            templateId: targetTmpl.templateId,
            templateName: targetTmpl.templateName,
            description: targetTmpl.description,
            subCategoryId: subId
          });
        }
      }

      // Reload categories and templates
      await loadCategories();

      Swal.fire({
        title: 'Success!',
        text: 'Workflow template assigned successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    } catch (error) {
      console.error("Failed to assign workflow template", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to assign workflow template.',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    }
  };

  const handleCreateOrUpdateTemplate = async (e) => {
    e.preventDefault();
    if (!templateModalName.trim()) return;
    try {
      const payload = {
        templateId: templateModalEditId || 0,
        templateName: templateModalName.trim(),
        description: templateModalDesc.trim(),
        subCategoryId: templateModalSubId ? parseInt(templateModalSubId, 10) : null
      };
      const res = templateModalEditId 
        ? await workflowService.updateTemplate(payload)
        : await workflowService.createTemplate(payload);

      if (res.isSuccess) {
        Swal.fire({
          title: 'Success',
          text: templateModalEditId ? 'Workflow updated successfully' : 'Workflow created successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
        setShowTemplateModal(false);
        setTemplateModalName('');
        setTemplateModalDesc('');
        setTemplateModalSubId(null);
        setTemplateModalEditId(null);
        await loadCategories();
      } else {
        Swal.fire({
          title: 'Error',
          text: res.message || 'Operation failed',
          icon: 'error',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.Message || 'Operation failed';
      Swal.fire({
        title: 'Error',
        text: errMsg,
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    }
  };

  const handleDeleteTemplate = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "All associated stages and predefined tasks will be deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      background: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#0f172a',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await workflowService.deleteTemplate(id);
      if (res.isSuccess) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Workflow template deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
        await loadCategories();
      } else {
        Swal.fire({
          title: 'Error',
          text: res.message || 'Failed to delete template',
          icon: 'error',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete template',
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    }
  };

  const handleCreateOrUpdateStage = async (e) => {
    e.preventDefault();
    if (!stageModalName.trim()) return;
    try {
      const payload = {
        stageId: stageModalEditId || 0,
        templateId: stageModalTemplateId,
        stageName: stageModalName.trim(),
        sequence: parseInt(stageModalSeq, 10),
        defaultDeadlineDays: parseInt(stageModalDeadline, 10)
      };
      const res = stageModalEditId
        ? await workflowService.updateStage(payload)
        : await workflowService.createStage(payload);

      if (res.isSuccess) {
        Swal.fire({
          title: 'Success',
          text: stageModalEditId ? 'Stage updated successfully' : 'Stage added successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
        setShowStageModal(false);
        setStageModalName('');
        setStageModalSeq(1);
        setStageModalDeadline(5);
        setStageModalEditId(null);
        setStageModalTemplateId(null);
        await loadCategories();
      } else {
        Swal.fire({
          title: 'Error',
          text: res.message || 'Operation failed',
          icon: 'error',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.Message || 'Operation failed';
      Swal.fire({
        title: 'Error',
        text: errMsg,
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    }
  };

  const handleDeleteStage = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete Stage?',
      text: 'Predefined tasks inside will also be removed!',
      icon: 'warning',
      showCancelButton: true,
      background: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#0f172a',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await workflowService.deleteStage(id);
      if (res.isSuccess) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Stage deleted.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
        await loadCategories();
      } else {
        Swal.fire({
          title: 'Error',
          text: res.message || 'Failed to delete stage',
          icon: 'error',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete stage',
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    }
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    if (!taskModalName.trim()) return;
    try {
      const payload = {
        taskId: taskModalEditId || 0,
        stageId: taskModalStageId,
        taskName: taskModalName.trim(),
        description: taskModalDesc.trim()
      };
      const res = taskModalEditId
        ? await workflowService.updateTask(payload)
        : await workflowService.createTask(payload);

      if (res.isSuccess) {
        Swal.fire({
          title: 'Success',
          text: taskModalEditId ? 'Task updated successfully' : 'Predefined task added successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
        setShowTaskModal(false);
        setTaskModalName('');
        setTaskModalDesc('');
        setTaskModalEditId(null);
        setTaskModalStageId(null);
        await loadCategories();
      } else {
        Swal.fire({
          title: 'Error',
          text: res.message || 'Operation failed',
          icon: 'error',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.Message || 'Operation failed';
      Swal.fire({
        title: 'Error',
        text: errMsg,
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    }
  };

  const handleDeleteTask = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete Predefined Task?',
      text: 'Are you sure you want to remove this task?',
      icon: 'warning',
      showCancelButton: true,
      background: isDarkMode ? '#1e293b' : '#ffffff',
      color: isDarkMode ? '#f8fafc' : '#0f172a',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await workflowService.deleteTask(id);
      if (res.isSuccess) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Predefined task removed.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
        await loadCategories();
      } else {
        Swal.fire({
          title: 'Error',
          text: res.message || 'Failed to delete task',
          icon: 'error',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete task',
        icon: 'error',
        background: isDarkMode ? '#1e293b' : '#ffffff',
        color: isDarkMode ? '#f8fafc' : '#0f172a',
      });
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      let suffix = '';
      if (activeMasterSection === 'projects') suffix = ' (Project)';
      else if (activeMasterSection === 'development') suffix = ' (Development)';
      else if (activeMasterSection === 'support') suffix = ' (Support)';
      else if (activeMasterSection === 'hardwareOthers') suffix = ' (Hardware & Others)';

      const finalName = newCatName.trim() + suffix;

      try {
        await categoryService.createCategory({
          categoryId: 0,
          categoryName: finalName
        });
        setNewCatName('');
        await loadCategories();
      } catch (error) {
        console.error("Failed to add category", error);
        const errMsg = error.response?.data?.message || error.response?.data?.Message || "Failed to add category.";
        Swal.fire({
          title: 'Duplicate/Error!',
          text: errMsg,
          icon: 'error',
          confirmButtonColor: '#3b82f6',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (selectedCatForSub && newSubCatName.trim()) {
      const catId = parseInt(selectedCatForSub, 10);
      const service = getServiceForCat(catId);
      try {
        await service.create({
          subCategoryId: 0,
          categoryId: catId,
          subCategoryName: newSubCatName.trim()
        });
        setNewSubCatName('');
        await loadCategories();
      } catch (error) {
        console.error("Failed to add subcategory", error);
        const errMsg = error.response?.data?.message || error.response?.data?.Message || "Failed to add sub-category.";
        Swal.fire({
          title: 'Duplicate/Error!',
          text: errMsg,
          icon: 'error',
          confirmButtonColor: '#3b82f6',
          background: isDarkMode ? '#1e293b' : '#ffffff',
          color: isDarkMode ? '#f8fafc' : '#0f172a',
        });
      }
    }
  };

  // Organize subcategories by category ID — matched by category name keyword
  const getCatSection = (cat) => {
    const name = getItemName(cat).toLowerCase();
    if (name.includes('project') || name.includes('iot') || (name.includes('hardware') && name.includes('development'))) {
      return 'projects';
    }
    if (name.includes('development')) return 'development';
    if (name.includes('support')) return 'support';
    return 'hardwareOthers';
  };

  const subsByCat = {};
  categoriesData.forEach(cat => {
    const catId = getItemId(cat);
    const cid = parseInt(catId, 10);
    const section = getCatSection(cat);
    const sourceSubs = section === 'development'
      ? devSubs
      : section === 'support'
        ? supportSubs
        : hardwareOthersSubs; // projects also uses hardwareOthersSubs under the hood

    subsByCat[catId] = sourceSubs.filter(sub => {
      return sub.categoryId === cid || sub.category_id === cid || sub.category === cid || sub.category?.id === cid;
    });
  });

  const getCategoriesForSection = () => {
    return categoriesData.filter(cat => getCatSection(cat) === activeMasterSection);
  };

  // ── Ordered helpers ────────────────────────────────────────────
  const getOrderedCategoriesForSection = () => {
    const cats = getCategoriesForSection();
    const savedOrder = catOrderMap[activeMasterSection];
    if (!savedOrder || savedOrder.length === 0) return cats;
    return [...cats].sort((a, b) => {
      const aIdx = savedOrder.indexOf(String(getItemId(a)));
      const bIdx = savedOrder.indexOf(String(getItemId(b)));
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  };

  const getOrderedSubs = (catId) => {
    const subs = subsByCat[catId] || [];
    const catIdStr = String(catId);
    let savedOrder = subOrderMap[catIdStr];
    if (!savedOrder) {
      try {
        const stored = localStorage.getItem(`masters_sub_order_${catIdStr}`);
        if (stored) savedOrder = JSON.parse(stored);
      } catch { }
    }
    if (!savedOrder || savedOrder.length === 0) return subs;
    return [...subs].sort((a, b) => {
      const aIdx = savedOrder.indexOf(String(getItemId(a)));
      const bIdx = savedOrder.indexOf(String(getItemId(b)));
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  };

  // ── Drag handlers ────────────────────────────────────────────────
  const handleCatDragStart = (idx) => setDragCat({ section: activeMasterSection, idx });

  const handleCatDrop = (dropIdx) => {
    if (!dragCat || dragCat.section !== activeMasterSection) return;
    const orderedCats = getOrderedCategoriesForSection();
    const newCats = [...orderedCats];
    const [moved] = newCats.splice(dragCat.idx, 1);
    newCats.splice(dropIdx, 0, moved);
    const newOrder = newCats.map(c => String(getItemId(c)));
    setCatOrderMap(prev => ({ ...prev, [activeMasterSection]: newOrder }));
    localStorage.setItem(`masters_cat_order_${activeMasterSection}`, JSON.stringify(newOrder));
    setDragCat(null);
  };

  const handleSubDragStart = (catId, idx) => setDragSub({ catId: String(catId), idx });

  const handleSubDrop = (catId, dropIdx) => {
    const catIdStr = String(catId);
    if (!dragSub || dragSub.catId !== catIdStr) return;
    const orderedSubs = getOrderedSubs(catId);
    const newSubs = [...orderedSubs];
    const [moved] = newSubs.splice(dragSub.idx, 1);
    newSubs.splice(dropIdx, 0, moved);
    const newOrder = newSubs.map(s => String(getItemId(s)));
    setSubOrderMap(prev => ({ ...prev, [catIdStr]: newOrder }));
    localStorage.setItem(`masters_sub_order_${catIdStr}`, JSON.stringify(newOrder));
    setDragSub(null);
  };

  const _mastersPagePerm = permissionCodes['masterssettings.page'] ?? 'Deny';
  const canAccess = _mastersPagePerm !== 'Deny' && _mastersPagePerm !== 'Hidden';

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
          {activeTab === 'workflows' && (
            <WorkflowTemplates />
          )}
          {activeTab === 'assignWorkflows' && (
            <div className="space-y-6">
              <div className={cn("p-6 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
                <h3 className={cn("text-xl font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>Subcategory Workflows</h3>
                <p className={cn("text-sm font-medium mb-6", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                  Create, configure and manage custom workflow stages and predefined tasks directly for each subcategory.
                </p>

                {loadingCategories ? (
                  <div className="text-center p-8 text-slate-500">Loading subcategories...</div>
                ) : (
                  <div className="space-y-8">
                    {categoriesData.map(cat => {
                      const catId = getItemId(cat);
                      const catName = getItemName(cat);
                      const catSubs = subsByCat[catId] || [];

                      if (catSubs.length === 0) return null;

                      return (
                        <div key={catId} className="space-y-4">
                          <h4 className={cn("text-lg font-extrabold pb-2 border-b", isDarkMode ? "text-indigo-400 border-slate-700" : "text-indigo-600 border-slate-200")}>
                            {cleanCatName(catName)}
                          </h4>
                          <div className="space-y-4">
                            {catSubs.map(sub => {
                              const subId = getItemId(sub);
                              const subName = getItemName(sub);
                              const mappedTmpl = templates.find(t => String(t.subCategoryId) === String(subId));
                              const isExpanded = mappedTmpl ? expandedWorkflows[mappedTmpl.templateId] : false;

                              return (
                                <div key={subId} className={cn("p-4 rounded-2xl border transition-all duration-300", 
                                  isDarkMode ? "bg-slate-900/40 border-slate-850 hover:border-slate-700" : "bg-slate-50/50 border-slate-200 hover:border-slate-350 shadow-sm")}>
                                  
                                  {/* Subcategory Row Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                      <span className="font-extrabold text-slate-900 dark:text-white text-base">{subName}</span>
                                      {mappedTmpl && (
                                        <div className="mt-1 flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                              Workflow: {mappedTmpl.templateName}
                                            </span>
                                            <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/15">
                                              Active Workflow
                                            </span>
                                          </div>
                                          {mappedTmpl.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{mappedTmpl.description}</p>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 self-start sm:self-auto">
                                      {mappedTmpl ? (
                                        <>
                                          <button
                                            onClick={() => {
                                              setExpandedWorkflows(prev => ({
                                                ...prev,
                                                [mappedTmpl.templateId]: !prev[mappedTmpl.templateId]
                                              }));
                                            }}
                                            className={cn("p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5",
                                              isDarkMode ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-white text-slate-700 shadow-sm"
                                            )}
                                          >
                                            {isExpanded ? (
                                              <>
                                                <ChevronUp className="w-4 h-4" /> Hide Stages
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="w-4 h-4" /> Show Stages ({mappedTmpl.stages?.length || 0})
                                              </>
                                            )}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setTemplateModalEditId(mappedTmpl.templateId);
                                              setTemplateModalName(mappedTmpl.templateName);
                                              setTemplateModalDesc(mappedTmpl.description);
                                              setTemplateModalSubId(subId);
                                              setShowTemplateModal(true);
                                            }}
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition"
                                            title="Edit Workflow Details"
                                          >
                                            <Edit2 className="w-4.5 h-4.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTemplate(mappedTmpl.templateId)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition"
                                            title="Delete Workflow"
                                          >
                                            <Trash2 className="w-4.5 h-4.5" />
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setTemplateModalSubId(subId);
                                            setTemplateModalEditId(null);
                                            setTemplateModalName(`${subName} Workflow`);
                                            setTemplateModalDesc(`Default workflow stages for ${subName}`);
                                            setShowTemplateModal(true);
                                          }}
                                          className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 shadow-sm"
                                        >
                                          <Plus className="w-4 h-4 stroke-[3]" /> Add Workflow
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded Stages Layout */}
                                  {isExpanded && mappedTmpl && (
                                    <div className="mt-4 pt-4 border-t border-slate-205 dark:border-slate-800 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                                      <div className="flex justify-between items-center">
                                        <h5 className="font-extrabold text-sm flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                          <Layers className="w-4.5 h-4.5" /> Workflow Stages
                                        </h5>
                                        <button
                                          onClick={() => {
                                            setStageModalTemplateId(mappedTmpl.templateId);
                                            setStageModalEditId(null);
                                            setStageModalName('');
                                            setStageModalSeq((mappedTmpl.stages?.length || 0) + 1);
                                            setStageModalDeadline(5);
                                            setShowStageModal(true);
                                          }}
                                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                                        >
                                          <Plus className="w-3.5 h-3.5" /> Add Stage
                                        </button>
                                      </div>

                                      <div className="space-y-3">
                                        {(mappedTmpl.stages || []).map((stg) => (
                                          <div 
                                            key={stg.stageId} 
                                            className={cn("p-4 rounded-xl border",
                                              isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                                            )}
                                          >
                                            <div className="flex justify-between items-start gap-2">
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <span className="px-2 py-0.5 text-xs font-black bg-slate-200 dark:bg-slate-800 rounded-md">
                                                    #{stg.sequence}
                                                  </span>
                                                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{stg.stageName}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 font-bold">
                                                  Default Deadline: {stg.defaultDeadlineDays} Days
                                                </p>
                                              </div>

                                              <div className="flex gap-1.5 shrink-0">
                                                <button
                                                  onClick={() => {
                                                    setTaskModalStageId(stg.stageId);
                                                    setTaskModalEditId(null);
                                                    setTaskModalName('');
                                                    setTaskModalDesc('');
                                                    setShowTaskModal(true);
                                                  }}
                                                  className="px-2.5 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black rounded-lg transition flex items-center gap-0.5"
                                                >
                                                  <Plus className="w-3 h-3" /> Task
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setStageModalTemplateId(mappedTmpl.templateId);
                                                    setStageModalEditId(stg.stageId);
                                                    setStageModalName(stg.stageName);
                                                    setStageModalSeq(stg.sequence);
                                                    setStageModalDeadline(stg.defaultDeadlineDays);
                                                    setShowStageModal(true);
                                                  }}
                                                  className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteStage(stg.stageId)}
                                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </div>

                                            {/* Predefined tasks */}
                                            <div className="mt-3 pl-4 border-l-2 border-indigo-500/30 space-y-2">
                                              {stg.predefinedTasks && stg.predefinedTasks.length > 0 ? (
                                                stg.predefinedTasks.map((tsk) => (
                                                  <div 
                                                    key={tsk.taskId}
                                                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border dark:border-slate-800/40"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                                                      <div>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{tsk.taskName}</span>
                                                        {tsk.description && <span className="text-slate-400 ml-2 font-medium">- {tsk.description}</span>}
                                                      </div>
                                                    </div>

                                                    <div className="flex gap-1.5">
                                                      <button
                                                        onClick={() => {
                                                          setTaskModalStageId(stg.stageId);
                                                          setTaskModalEditId(tsk.taskId);
                                                          setTaskModalName(tsk.taskName);
                                                          setTaskModalDesc(tsk.description);
                                                          setShowTaskModal(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-indigo-500 rounded transition"
                                                      >
                                                        <Edit2 className="w-3 h-3" />
                                                      </button>
                                                      <button
                                                        onClick={() => handleDeleteTask(tsk.taskId)}
                                                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))
                                              ) : (
                                                <p className="text-[11px] text-slate-400 font-bold italic">No predefined tasks assigned to this stage.</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                        {(!mappedTmpl.stages || mappedTmpl.stages.length === 0) && (
                                          <p className="text-xs text-slate-400 italic font-semibold text-center py-2">No stages defined yet. Click "Add Stage" above to create some stages.</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {categoriesData.length === 0 && (
                      <div className="text-center p-6 text-slate-500">No categories or subcategories found in database.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div className={cn("p-6 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h3 className={cn("text-xl font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Categories & Sub-Categories</h3>

                  {/* Master Sub-tabs */}
                  <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border dark:border-slate-800 border-slate-200">
                    {[
                      { id: 'development',    label: 'Development' },
                      { id: 'support',        label: 'Support' },
                      { id: 'hardwareOthers', label: 'Hardware & Others' },
                      { id: 'projects',       label: 'Projects' }
                    ].map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setActiveMasterSection(sec.id);
                          setSelectedCatForSub('');
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                          activeMasterSection === sec.id
                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600"
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                </div>

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
                    {getOrderedCategoriesForSection().map((cat, catIdx) => {
                      const catId = getItemId(cat);
                      const catName = getItemName(cat);
                      const orderedSubs = getOrderedSubs(catId);

                      return (
                        <div
                          key={catId}
                          draggable
                          onDragStart={() => handleCatDragStart(catIdx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleCatDrop(catIdx)}
                          className={cn("p-5 rounded-2xl border transition-opacity",
                            dragCat?.idx === catIdx && dragCat?.section === activeMasterSection ? "opacity-40" : "",
                            isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-100"
                          )}
                        >
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
                                  if (editCategoryValue.trim()) {
                                    const cat = categoriesData.find(c => String(getItemId(c)) === String(catId));
                                    const oldName = getItemName(cat);
                                    const match = oldName.match(/\s*\((project|development|support|hardware\s*&\s*others)\)/i);
                                    const suffix = match ? match[0] : '';
                                    const finalName = editCategoryValue.trim() + suffix;

                                    try {
                                      await categoryService.updateCategory(catId, {
                                        categoryId: parseInt(catId, 10),
                                        categoryName: finalName
                                      });
                                      await loadCategories();
                                    } catch (error) {
                                      console.error(error);
                                      const errMsg = error.response?.data?.message || error.response?.data?.Message || "Failed to update category.";
                                      Swal.fire({
                                        title: 'Duplicate/Error!',
                                        text: errMsg,
                                        icon: 'error',
                                        confirmButtonColor: '#3b82f6',
                                        background: isDarkMode ? '#1e293b' : '#ffffff',
                                        color: isDarkMode ? '#f8fafc' : '#0f172a',
                                      });
                                    }
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
                                <div className="flex items-center gap-3 flex-1">
                                  <GripVertical className="w-5 h-5 text-slate-400 cursor-grab shrink-0" title="Drag to reorder" />
                                  <span className="font-extrabold text-lg text-indigo-600 dark:text-indigo-400">{cleanCatName(catName)}</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(catId);
                                      setEditCategoryValue(cleanCatName(catName));
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
                                          } catch (e) {
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
                            {orderedSubs.map((sub, subIdx) => {
                              const subId = getItemId(sub);
                              const subName = getItemName(sub);

                              return (
                                <div
                                  key={subId}
                                  draggable
                                  onDragStart={() => handleSubDragStart(catId, subIdx)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => handleSubDrop(catId, subIdx)}
                                  className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-opacity",
                                    dragSub?.catId === String(catId) && dragSub?.idx === subIdx ? "opacity-40" : "",
                                    isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white border text-slate-700 shadow-sm"
                                  )}
                                >
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
                                        if (editSubCategoryValue.trim()) {
                                          try {
                                            const service = getServiceForCat(catId);
                                            await service.update(subId, {
                                              subCategoryId: parseInt(subId, 10),
                                              categoryId: parseInt(catId, 10),
                                              subCategoryName: editSubCategoryValue.trim()
                                            });
                                            await loadCategories();
                                          } catch (error) {
                                            console.error(error);
                                            const errMsg = error.response?.data?.message || error.response?.data?.Message || "Failed to update sub-category.";
                                            Swal.fire({
                                              title: 'Duplicate/Error!',
                                              text: errMsg,
                                              icon: 'error',
                                              confirmButtonColor: '#3b82f6',
                                              background: isDarkMode ? '#1e293b' : '#ffffff',
                                              color: isDarkMode ? '#f8fafc' : '#0f172a',
                                            });
                                          }
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
                                      <GripVertical className="w-3 h-3 text-slate-400 cursor-grab shrink-0" title="Drag to reorder" />
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
                                              const service = getServiceForCat(catId);
                                              await service.delete(subId);
                                              await loadCategories();
                                              Swal.fire({
                                                title: 'Deleted!',
                                                text: `Sub-category "${subName}" has been deleted.`,
                                                icon: 'success',
                                                confirmButtonColor: '#3b82f6',
                                                background: isDarkMode ? '#1e293b' : '#ffffff',
                                                color: isDarkMode ? '#f8fafc' : '#0f172a',
                                              });
                                            } catch (e) {
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
                              );
                            })}
                            {orderedSubs.length === 0 && <span className="text-sm text-slate-400 italic">No sub-categories</span>}
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
                      );
                    })}
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

          {activeTab === 'projects' && (
            <div className="space-y-8">
              <div className={cn("p-6 rounded-3xl border shadow-sm", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
                <h3 className={cn("text-xl font-bold mb-6", isDarkMode ? "text-white" : "text-slate-900")}>Projects by Sub-Category</h3>
                {loadingProjects ? (
                  <div className="text-center p-8 text-slate-500">Loading projects...</div>
                ) : (
                  <div className="space-y-10">
                    {categoriesData.map(cat => {
                      const catId = String(getItemId(cat));
                      const catName = getItemName(cat);
                      const catSubs = subCategoriesData.filter(sub => {
                        const subCatId = String(sub.categoryId || sub.category_id || sub.category?.id || sub.category?._id || sub.category || '');
                        return subCatId === catId;
                      });

                      if (catSubs.length === 0) return null;

                      return (
                        <div key={catId} className="space-y-4">
                          <h4 className={cn("text-lg font-extrabold pb-2 border-b", isDarkMode ? "text-indigo-400 border-slate-700" : "text-indigo-600 border-slate-200")}>
                            {cleanCatName(catName)}
                          </h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {catSubs.map(sub => {
                              const subId = String(getItemId(sub));
                              const subName = getItemName(sub);
                              const subProjs = projectsData.filter(p => String(p.subCategoryId || p.subCategory?.id || p.subCategory_id) === subId);
                              return (
                                <div key={subId} className={cn("p-4 rounded-2xl border flex flex-col", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200")}>
                                  <h5 className={cn("font-bold mb-4", isDarkMode ? "text-slate-300" : "text-slate-700")}>{cleanCatName(subName)}</h5>
                                  <div className="space-y-2 mb-4 flex-1">
                                    {subProjs.map(proj => {
                                      const isEditing = editingProject === proj.projectId;
                                      return (
                                        <div key={proj.projectId} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm gap-2">
                                          {isEditing ? (
                                            <>
                                              <input
                                                type="text"
                                                value={editProjectValue}
                                                onChange={(e) => setEditProjectValue(e.target.value)}
                                                className={cn("flex-1 px-2.5 py-1 text-sm rounded-lg border outline-none font-semibold",
                                                  isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300"
                                                )}
                                                autoFocus
                                              />
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={async () => {
                                                    if (editProjectValue.trim()) {
                                                      try {
                                                        await projectService.updateProject(proj.projectId, {
                                                          ...proj,
                                                          projectName: editProjectValue.trim()
                                                        });
                                                        setEditingProject(null);
                                                        loadProjects();
                                                      } catch (err) {
                                                        Swal.fire({
                                                          title: 'Error',
                                                          text: 'Failed to update project name',
                                                          icon: 'error',
                                                          background: isDarkMode ? '#1e293b' : '#ffffff',
                                                          color: isDarkMode ? '#f8fafc' : '#0f172a'
                                                        });
                                                      }
                                                    }
                                                  }}
                                                  className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                >
                                                  <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => setEditingProject(null)}
                                                  className="p-1.5 text-slate-500 hover:bg-slate-500/10 rounded-lg transition-colors"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <span className="font-semibold text-sm">{proj.projectName}</span>
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={() => {
                                                    setEditingProject(proj.projectId);
                                                    setEditProjectValue(proj.projectName);
                                                  }}
                                                  className="p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                >
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    Swal.fire({
                                                      title: 'Are you sure?',
                                                      text: `Delete project "${proj.projectName}"?`,
                                                      icon: 'warning',
                                                      showCancelButton: true,
                                                      confirmButtonText: 'Delete',
                                                      confirmButtonColor: '#ef4444',
                                                      background: isDarkMode ? '#1e293b' : '#ffffff',
                                                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                                                    }).then(res => {
                                                      if(res.isConfirmed) {
                                                        projectService.deleteProject(proj.projectId).then(() => loadProjects());
                                                      }
                                                    })
                                                  }}
                                                  className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {subProjs.length === 0 && <p className="text-sm text-slate-500 italic py-2">No projects added yet.</p>}
                                  </div>
                                  <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const val = e.target.elements.newProj.value.trim();
                                    if(val) {
                                      try {
                                        await projectService.createProject({ projectId: 0, projectName: val, subCategoryId: parseInt(subId, 10) });
                                        e.target.reset();
                                        await loadProjects();
                                      } catch(err) {
                                        Swal.fire({ title: 'Error', text: 'Failed to add project', icon: 'error', background: isDarkMode ? '#1e293b' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a' });
                                      }
                                    }
                                  }} className="flex gap-2 mt-auto pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                    <input name="newProj" placeholder="Add new project..." className={cn("flex-1 px-3 py-2 text-sm rounded-xl border outline-none", isDarkMode ? "bg-slate-950 border-slate-700 text-white" : "bg-white border-slate-300")} />
                                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm transition-colors">
                                      <Plus className="w-4 h-4" /> Add
                                    </button>
                                  </form>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isRefreshing && activeTab === 'categories' && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg bg-indigo-600 text-white text-sm font-black tracking-wide animate-bounce">
          <RefreshCcw className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrUpdateTemplate} className={cn("w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6 animate-[fadeIn_0.2s_ease-out]",
            isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <h3 className="text-xl font-bold">{templateModalEditId ? 'Edit Workflow' : 'Create Workflow'}</h3>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Workflow Name</label>
              <input 
                type="text" 
                value={templateModalName}
                onChange={(e) => setTemplateModalName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="e.g. Code Review Process"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Description</label>
              <textarea 
                value={templateModalDesc}
                onChange={(e) => setTemplateModalDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="Provide standard description of the workflow"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateModalName('');
                  setTemplateModalDesc('');
                  setTemplateModalSubId(null);
                  setTemplateModalEditId(null);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stage Modal */}
      {showStageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrUpdateStage} className={cn("w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6 animate-[fadeIn_0.2s_ease-out]",
            isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <h3 className="text-xl font-bold">{stageModalEditId ? 'Edit Stage' : 'New Stage'}</h3>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Stage Name</label>
              <input 
                type="text" 
                value={stageModalName}
                onChange={(e) => setStageModalName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="e.g. Planning, Testing"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Sequence Number</label>
                <input 
                  type="number" 
                  value={stageModalSeq}
                  onChange={(e) => setStageModalSeq(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Default Deadline (Days)</label>
                <input 
                  type="number" 
                  value={stageModalDeadline}
                  onChange={(e) => setStageModalDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowStageModal(false);
                  setStageModalName('');
                  setStageModalSeq(1);
                  setStageModalDeadline(5);
                  setStageModalEditId(null);
                  setStageModalTemplateId(null);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrUpdateTask} className={cn("w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6 animate-[fadeIn_0.2s_ease-out]",
            isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <h3 className="text-xl font-bold">{taskModalEditId ? 'Edit Predefined Task' : 'New Predefined Task'}</h3>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Task Name</label>
              <input 
                type="text" 
                value={taskModalName}
                onChange={(e) => setTaskModalName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="e.g. Fill requirements document"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Description</label>
              <textarea 
                value={taskModalDesc}
                onChange={(e) => setTaskModalDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="Provide standard description of the task"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowTaskModal(false);
                  setTaskModalName('');
                  setTaskModalDesc('');
                  setTaskModalEditId(null);
                  setTaskModalStageId(null);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold border hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
