import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Plus, Edit2, Trash2, FolderKanban, Settings, ChevronDown, ChevronUp, AlignLeft, Layers } from 'lucide-react';
import workflowService from '../services/workflowService';
import { developmentService } from '../services/developmentService';
import { supportService } from '../services/supportService';
import { hardwareOthersService } from '../services/hardwareOthersService';
import Swal from 'sweetalert2';

const getItemName = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.subCategoryName || item.subcategoryName || item.subCategory?.name || item.name || 'Unknown';
};

const getItemId = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.subCategoryId || item.subcategoryId || item.id || item._id || JSON.stringify(item);
};

export default function WorkflowTemplates() {
  const { isDarkMode } = useStore();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState(null);

  // Form states
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [editTemplateId, setEditTemplateId] = useState(null);

  // Subcategory data states
  const [subCategories, setSubCategories] = useState([]);

  // Stage form states
  const [showAddStage, setShowAddStage] = useState(false);
  const [stageName, setStageName] = useState('');
  const [stageSequence, setStageSequence] = useState(1);
  const [stageDeadline, setStageDeadline] = useState(5);
  const [editStageId, setEditStageId] = useState(null);

  // Task form states
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);

  const loadSubCategories = async () => {
    try {
      const safeGetAll = async (fetchFn) => {
        try {
          const res = await fetchFn();
          if (!res) return [];
          if (Array.isArray(res)) return res;
          if (Array.isArray(res.data)) return res.data;
          if (Array.isArray(res.items)) return res.items;
          return [];
        } catch {
          return [];
        }
      };
      const [devArr, supArr, hwArr] = await Promise.all([
        safeGetAll(developmentService.getAll),
        safeGetAll(supportService.getAll),
        safeGetAll(hardwareOthersService.getAll),
      ]);
      setSubCategories([...devArr, ...supArr, ...hwArr]);
    } catch (e) {
      console.error("Failed to load subcategories", e);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await workflowService.getAllTemplates();
      if (res.isSuccess) {
        setTemplates(res.data || []);
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadSubCategories();
  }, []);

  const handleCreateOrUpdateTemplate = async (e) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    try {
      const payload = {
        templateId: editTemplateId || 0,
        templateName: templateName.trim(),
        description: templateDesc.trim(),
        subCategoryId: selectedSubCategoryId ? parseInt(selectedSubCategoryId, 10) : null
      };
      const res = editTemplateId 
        ? await workflowService.updateTemplate(payload)
        : await workflowService.createTemplate(payload);

      if (res.isSuccess) {
        Swal.fire('Success', editTemplateId ? 'Template updated' : 'Template created', 'success');
        setShowAddTemplate(false);
        setTemplateName('');
        setTemplateDesc('');
        setSelectedSubCategoryId('');
        setEditTemplateId(null);
        loadTemplates();
      } else {
        Swal.fire('Error', res.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.Message || 'Operation failed';
      Swal.fire('Error', errMsg, 'error');
    }
  };

  const handleDeleteTemplate = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "All associated stages and predefined tasks will be deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await workflowService.deleteTemplate(id);
      if (res.isSuccess) {
        Swal.fire('Deleted!', 'Template deleted.', 'success');
        loadTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrUpdateStage = async (e) => {
    e.preventDefault();
    if (!stageName.trim()) return;
    try {
      const payload = {
        stageId: editStageId || 0,
        templateId: expandedTemplate.templateId,
        stageName: stageName.trim(),
        sequence: parseInt(stageSequence, 10),
        defaultDeadlineDays: parseInt(stageDeadline, 10)
      };
      const res = editStageId
        ? await workflowService.updateStage(payload)
        : await workflowService.createStage(payload);

      if (res.isSuccess) {
        Swal.fire('Success', editStageId ? 'Stage updated' : 'Stage added', 'success');
        setShowAddStage(false);
        setStageName('');
        setStageSequence(1);
        setStageDeadline(5);
        setEditStageId(null);
        loadTemplates();
        // Refresh expanded template data
        const fresh = await workflowService.getTemplateById(expandedTemplate.templateId);
        if (fresh.isSuccess) setExpandedTemplate(fresh.data);
      } else {
        Swal.fire('Error', res.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.Message || 'Operation failed';
      Swal.fire('Error', errMsg, 'error');
    }
  };

  const handleDeleteStage = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete Stage?',
      text: 'Predefined tasks inside will also be removed!',
      icon: 'warning',
      showCancelButton: true
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await workflowService.deleteStage(id);
      if (res.isSuccess) {
        loadTemplates();
        const fresh = await workflowService.getTemplateById(expandedTemplate.templateId);
        if (fresh.isSuccess) setExpandedTemplate(fresh.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    try {
      const payload = {
        taskId: editTaskId || 0,
        stageId: selectedStageId,
        taskName: taskName.trim(),
        description: taskDesc.trim()
      };
      const res = editTaskId
        ? await workflowService.updateTask(payload)
        : await workflowService.createTask(payload);

      if (res.isSuccess) {
        Swal.fire('Success', editTaskId ? 'Task updated' : 'Predefined task added', 'success');
        setShowAddTask(false);
        setTaskName('');
        setTaskDesc('');
        setEditTaskId(null);
        loadTemplates();
        const fresh = await workflowService.getTemplateById(expandedTemplate.templateId);
        if (fresh.isSuccess) setExpandedTemplate(fresh.data);
      } else {
        Swal.fire('Error', res.message || 'Operation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.response?.data?.Message || 'Operation failed';
      Swal.fire('Error', errMsg, 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const res = await workflowService.deleteTask(id);
      if (res.isSuccess) {
        loadTemplates();
        const fresh = await workflowService.getTemplateById(expandedTemplate.templateId);
        if (fresh.isSuccess) setExpandedTemplate(fresh.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const textClass = isDarkMode ? "text-slate-200" : "text-slate-800";
  const bgCardClass = isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200";

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
            Workflow Templates
          </h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Define standardized stage-gates and task roadmaps for projects.
          </p>
        </div>
        <button
          onClick={() => {
            setEditTemplateId(null);
            setTemplateName('');
            setTemplateDesc('');
            setSelectedSubCategoryId('');
            setShowAddTemplate(true);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-md shadow-blue-600/30"
        >
          <Plus className="w-5 h-5" /> New Template
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Loading templates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {templates.map(tmpl => {
            const isExpanded = expandedTemplate?.templateId === tmpl.templateId;
            return (
              <div 
                key={tmpl.templateId}
                className={cn("p-6 rounded-2xl border transition-all duration-300", bgCardClass)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", isDarkMode ? "bg-slate-700 text-blue-400" : "bg-blue-50 text-blue-600")}>
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lg">{tmpl.templateName}</h3>
                        {tmpl.subCategoryId && (
                          <span className="px-2.5 py-0.5 text-xs font-black bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                            Sub-Category: {getItemName(subCategories.find(s => String(getItemId(s)) === String(tmpl.subCategoryId))) || `ID ${tmpl.subCategoryId}`}
                          </span>
                        )}
                      </div>
                      <p className={cn("text-sm", isDarkMode ? "text-slate-450" : "text-slate-500")}>
                        {tmpl.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (isExpanded) {
                          setExpandedTemplate(null);
                        } else {
                          const details = await workflowService.getTemplateById(tmpl.templateId);
                          if (details.isSuccess) setExpandedTemplate(details.data);
                        }
                      }}
                      className={cn("p-2 rounded-xl border hover:bg-slate-100 dark:hover:bg-slate-700 transition",
                        isDarkMode ? "border-slate-700" : "border-slate-200"
                      )}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditTemplateId(tmpl.templateId);
                        setTemplateName(tmpl.templateName);
                        setTemplateDesc(tmpl.description);
                        setSelectedSubCategoryId(tmpl.subCategoryId ? String(tmpl.subCategoryId) : '');
                        setShowAddTemplate(true);
                      }}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.templateId)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-md flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-500" /> Stages & Gateways
                      </h4>
                      <button
                        onClick={() => {
                          setEditStageId(null);
                          setStageName('');
                          setStageSequence(expandedTemplate.stages.length + 1);
                          setStageDeadline(5);
                          setShowAddStage(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                      >
                        <Plus className="w-4 h-4" /> Add Stage
                      </button>
                    </div>

                    <div className="space-y-4">
                      {expandedTemplate.stages.map((stg) => (
                        <div 
                          key={stg.stageId} 
                          className={cn("p-4 rounded-xl border",
                            isDarkMode ? "bg-slate-900/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-xs font-bold bg-slate-200 dark:bg-slate-700 rounded">
                                  #{stg.sequence}
                                </span>
                                <span className="font-bold">{stg.stageName}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 font-semibold">
                                Default Deadline: {stg.defaultDeadlineDays} Days
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedStageId(stg.stageId);
                                  setEditTaskId(null);
                                  setTaskName('');
                                  setTaskDesc('');
                                  setShowAddTask(true);
                                }}
                                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add Task
                              </button>
                              <button
                                onClick={() => {
                                  setEditStageId(stg.stageId);
                                  setStageName(stg.stageName);
                                  setStageSequence(stg.sequence);
                                  setStageDeadline(stg.defaultDeadlineDays);
                                  setShowAddStage(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStage(stg.stageId)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Predefined tasks inside the stage */}
                          <div className="mt-4 pl-4 border-l-2 border-slate-350 dark:border-slate-700 space-y-2">
                            {stg.predefinedTasks && stg.predefinedTasks.length > 0 ? (
                              stg.predefinedTasks.map((tsk) => (
                                <div 
                                  key={tsk.taskId}
                                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-white dark:bg-slate-800 border dark:border-slate-700/50"
                                >
                                  <div className="flex items-center gap-2">
                                    <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                                    <div>
                                      <span className="font-bold">{tsk.taskName}</span>
                                      {tsk.description && <span className="text-slate-400 ml-2 font-medium">- {tsk.description}</span>}
                                    </div>
                                  </div>

                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        setSelectedStageId(stg.stageId);
                                        setEditTaskId(tsk.taskId);
                                        setTaskName(tsk.taskName);
                                        setTaskDesc(tsk.description);
                                        setShowAddTask(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-indigo-500 rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(tsk.taskId)}
                                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 font-semibold italic">No predefined tasks.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Templates Modals */}
      {showAddTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrUpdateTemplate} className={cn("w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6",
            isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <h3 className="text-xl font-bold">{editTemplateId ? 'Edit Template' : 'New Template'}</h3>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Template Name</label>
              <input 
                type="text" 
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="e.g. Agile Development Workflow"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Related Sub-Category (Optional)</label>
              <select 
                value={selectedSubCategoryId}
                onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="">-- None (General Template) --</option>
                {subCategories.map(sub => (
                  <option key={getItemId(sub)} value={String(getItemId(sub))}>
                    {getItemName(sub)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Description</label>
              <textarea 
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="Provide standard description of the workflow template"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddTemplate(false)}
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
      {showAddStage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrUpdateStage} className={cn("w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6",
            isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <h3 className="text-xl font-bold">{editStageId ? 'Edit Stage' : 'New Stage'}</h3>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Stage Name</label>
              <input 
                type="text" 
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="e.g. Planning, Requirement Gathering"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Sequence Number</label>
                <input 
                  type="number" 
                  value={stageSequence}
                  onChange={(e) => setStageSequence(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Default Deadline (Days)</label>
                <input 
                  type="number" 
                  value={stageDeadline}
                  onChange={(e) => setStageDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddStage(false)}
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
      {showAddTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrUpdateTask} className={cn("w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6",
            isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <h3 className="text-xl font-bold">{editTaskId ? 'Edit Predefined Task' : 'New Predefined Task'}</h3>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Task Name</label>
              <input 
                type="text" 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="e.g. Conduct kickoff meeting"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Description</label>
              <textarea 
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border dark:border-slate-700 dark:bg-slate-800 outline-none text-sm font-semibold"
                placeholder="Detailed tasks, guidelines, or checklists"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddTask(false)}
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
