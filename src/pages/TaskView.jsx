import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Briefcase, Calendar, AlignLeft, Edit, CheckCircle2, Clock, Users, Building, FileText, Phone, Mail, FileCheck, AlertCircle, Layers, GitMerge, Plus, Trash2 } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { taskService } from '../services/taskService';
import { formatDateToDDMMYYYY } from '../utils/dateFormatter';
import ProjectFlow from '../components/ProjectFlow';
import WaterfallFlow from '../components/WaterfallFlow';
import workflowService from '../services/workflowService';
import { taskChangeStatusService } from '../services/taskChangeStatusService';
import Swal from 'sweetalert2';


const getPriorityColor = (priority, isDarkMode) => {
  switch (priority) {
    case 'Critical': return isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'High': return isDarkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'Medium': return isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Low': return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
    default: return isDarkMode ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-slate-50 text-slate-700 border border-slate-200';
  }
};

const getStatusColor = (status, isDarkMode) => {
  switch (status) {
    case 'Completed': return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
    case 'In Progress': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
    case 'New Task': return isDarkMode ? 'text-amber-400' : 'text-amber-600';
    case 'Pending': return isDarkMode ? 'text-purple-400' : 'text-purple-600';
    case 'On Hold': return isDarkMode ? 'text-slate-400' : 'text-slate-600';
    case 'Cancelled': return isDarkMode ? 'text-rose-400' : 'text-rose-600';
    default: return isDarkMode ? 'text-slate-400' : 'text-slate-600';
  }
};

const isNoProject = (val) => {
  if (!val) return true;
  const clean = val.toLowerCase().trim();
  return clean === 'no' || clean === 'no project' || clean === 'noproject' || clean === 'no_project' || clean === 'none';
};

const isNoAgent = (val) => {
  if (!val) return true;
  const clean = val.toLowerCase().trim();
  return clean === 'no' || clean === 'no agent' || clean === 'noagent' || clean === 'none';
};

const StatusBadge = ({ status, isDarkMode }) => (
  <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-sm", isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-200")}>
    <div className={cn("w-2.5 h-2.5 rounded-full", getStatusColor(status, isDarkMode).replace('text-', 'bg-'))} />
    <span className={cn("font-bold text-sm tracking-wide", isDarkMode ? "text-slate-200" : "text-slate-700")}>{status}</span>
  </div>
);

const DetailItem = ({ label, value, isDarkMode }) => (
  <div className={cn("p-4 rounded-2xl border transition-colors", isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60" : "bg-slate-50 border-slate-100 hover:bg-slate-100")}>
    <p className={cn("text-xs font-bold uppercase tracking-wider mb-1.5", isDarkMode ? "text-slate-400" : "text-slate-500")}>{label}</p>
    <p className={cn("font-semibold text-base", isDarkMode ? "text-slate-200" : "text-slate-800")}>{value || 'N/A'}</p>
  </div>
);

const getDueTimeText = (dueDateStr) => {
  if (!dueDateStr) return '';
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate)) return '';

  // Set due date to end of the day for accurate remaining time
  dueDate.setHours(23, 59, 59, 999);

  const distance = formatDistanceToNow(dueDate, { addSuffix: false });
  if (isPast(dueDate)) {
    return `${distance} overdue`;
  } else {
    return `${distance} to go`;
  }
};

export default function TaskView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, currentUser } = useStore();
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';

  const [task, setTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showProjectFlow, setShowProjectFlow] = React.useState(false);
  const [workflowTemplates, setWorkflowTemplates] = React.useState([]);

  const getSortedStages = () => {
    const defaultStages = ['Planning', 'Requirement Gathering', 'Design', 'Development', 'Testing'];
    if (!task || !task.stageDeadlines || Object.keys(task.stageDeadlines).length === 0) {
      return defaultStages;
    }
    const deadlineKeys = Object.keys(task.stageDeadlines);
    const matchingTemplate = workflowTemplates.find(t => {
      if (!t.stages || t.stages.length === 0) return false;
      const templateStageNames = t.stages.map(s => s.stageName);
      return deadlineKeys.every(k => templateStageNames.includes(k));
    });

    if (matchingTemplate) {
      const sorted = [...matchingTemplate.stages]
        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
        .map(s => s.stageName)
        .filter(name => deadlineKeys.includes(name));
      return sorted;
    }

    return deadlineKeys;
  };

  const isTaskVisits = task && ((task.categoryName || task.category) === 'Visits');
  const isTaskSupportVisits = task && ((task.categoryName || task.category) === 'Support' && (task.subCategoryName || task.subCategory) === 'Visits');

  const handleUpdateStage = async (newStage) => {
    try {
      const updated = { ...task, stage: newStage };
      await taskService.updateTask(task.taskId || task.id, updated);
      setTask(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateDeadline = async (stageName, date) => {
    try {
      const updatedDeadlines = { ...(task.stageDeadlines || {}), [stageName]: date };
      const updated = { ...task, stageDeadlines: updatedDeadlines };
      await taskService.updateTask(task.taskId || task.id, updated);
      setTask(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const [viewingStage, setViewingStage] = React.useState('');
  const [showAddSubtaskModal, setShowAddSubtaskModal] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [newSubtaskDesc, setNewSubtaskDesc] = React.useState('');
  const [editingSubtask, setEditingSubtask] = React.useState(null);

  // Initialize viewingStage once task is loaded
  React.useEffect(() => {
    if (task) {
      const list = getSortedStages();
      setViewingStage(prev => prev || task.stage || list[0]);
    }
  }, [task, workflowTemplates]);

  // (Removed aggressive auto-advance effect that skipped empty stages to the end)

  const generateUUID = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !viewingStage) return;

    const activeStage = task.stage || getSortedStages()[0];
    if (viewingStage !== activeStage && !isAdmin) {
      Swal.fire({
        title: 'Stage Restriction',
        text: `You can only add tasks to the active stage: "${activeStage}"!`,
        icon: 'warning'
      });
      return;
    }

    try {
      const newSub = {
        id: generateUUID(),
        title: newSubtaskTitle.trim(),
        description: newSubtaskDesc.trim(),
        isCompleted: false
      };

      const updatedStageTasks = { ...(task.stageTasks || {}) };
      if (!updatedStageTasks[viewingStage]) {
        updatedStageTasks[viewingStage] = [];
      }
      updatedStageTasks[viewingStage].push(newSub);

      const updatedTask = { ...task, stageTasks: updatedStageTasks };
      await taskService.updateTask(task.taskId || task.id, updatedTask);
      setTask(updatedTask);

      // Reset
      setShowAddSubtaskModal(false);
      setNewSubtaskTitle('');
      setNewSubtaskDesc('');
      Swal.fire('Added', 'Task added to stage timeline!', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to add task to stage', 'error');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const activeStage = task.stage || getSortedStages()[0];
      if (viewingStage !== activeStage && !isAdmin) {
        Swal.fire({
          title: 'Stage Restriction',
          text: `You can only complete tasks in the active stage: "${activeStage}". Please complete stages in order!`,
          icon: 'warning'
        });
        return;
      }

      const subtasks = task.stageTasks[viewingStage] || [];
      const currentSub = subtasks.find(s => s.id === subtaskId);
      if (!currentSub) return;

      const willComplete = !currentSub.isCompleted;
      let completionDescription = currentSub.description || "";

      if (willComplete) {
        // Show Swal input modal to collect completion description
        const { value: text, isConfirmed } = await Swal.fire({
          title: 'Completion Details',
          input: 'textarea',
          inputLabel: 'Describe how this task was completed:',
          inputPlaceholder: 'Enter details here...',
          showCancelButton: true,
          showCloseButton: true,
          confirmButtonText: 'Submit & Complete',
          cancelButtonText: 'Cancel',
          inputValidator: (value) => {
            if (!value || !value.trim()) {
              return 'You must enter a description to complete this task!';
            }
          }
        });

        if (!isConfirmed) {
          // React controlled inputs will reset the visual checkbox automatically
          return;
        }
        completionDescription = text.trim();
      }

      const updatedStageTasks = { ...(task.stageTasks || {}) };
      let toggledSub = null;
      if (updatedStageTasks[viewingStage]) {
        updatedStageTasks[viewingStage] = updatedStageTasks[viewingStage].map(sub => {
          if (sub.id === subtaskId) {
            toggledSub = { 
              ...sub, 
              isCompleted: willComplete,
              description: completionDescription
            };
            return toggledSub;
          }
          return sub;
        });
      }

      // Check if all subtasks in this stage are now completed
      const allCompleted = updatedStageTasks[viewingStage] && 
                           updatedStageTasks[viewingStage].length > 0 &&
                           updatedStageTasks[viewingStage].every(sub => sub.isCompleted);

      let nextStage = task.stage;
      if (allCompleted) {
        const stageList = getSortedStages();
        const currentIndex = stageList.indexOf(viewingStage);
        if (currentIndex !== -1 && currentIndex < stageList.length - 1) {
          const targetNext = stageList[currentIndex + 1];

          // Ask for stage completion reason
          const { value: stageReason, isConfirmed: stageConfirmed } = await Swal.fire({
            title: `Complete Stage: ${viewingStage}`,
            input: 'textarea',
            inputLabel: `All tasks finished! Enter stage completion reason/details:`,
            inputPlaceholder: 'Enter completion reason here...',
            showCancelButton: true,
            showCloseButton: true,
            confirmButtonText: 'Advance Stage',
            cancelButtonText: 'Keep in Current Stage',
            inputValidator: (value) => {
              if (!value || !value.trim()) {
                return 'You must enter a reason to complete this stage!';
              }
            }
          });

          if (stageConfirmed) {
            nextStage = targetNext;
          } else {
            nextStage = task.stage;
          }
        }
      }

      const updatedTask = { 
        ...task, 
        stageTasks: updatedStageTasks,
        stage: nextStage
      };
      await taskService.updateTask(task.taskId || task.id, updatedTask);
      setTask(updatedTask);
      if (nextStage !== task.stage) {
        setViewingStage(nextStage);
        Swal.fire({
          title: 'Stage Advanced!',
          text: `All tasks completed. Advanced to next stage: "${nextStage}"`,
          icon: 'success',
          timer: 2000
        });
      } else if (willComplete) {
        Swal.fire({
          title: 'Completed',
          text: 'Task marked as completed.',
          icon: 'success',
          timer: 1500
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to toggle subtask', 'error');
    }
  };

  const handleManualAdvanceStage = async () => {
    const stageList = getSortedStages();
    const currentIndex = stageList.indexOf(viewingStage);
    
    if (currentIndex !== -1 && currentIndex < stageList.length - 1) {
      const nextStage = stageList[currentIndex + 1];

      const { value: stageReason, isConfirmed: stageConfirmed } = await Swal.fire({
        title: `Complete Stage: ${viewingStage}`,
        input: 'textarea',
        inputLabel: `Enter stage completion reason/details:`,
        inputPlaceholder: 'Enter completion reason here...',
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: 'Advance Stage',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return 'You must enter a reason to complete this stage!';
          }
        }
      });

      if (stageConfirmed) {
        try {
          const updatedTask = { ...task, stage: nextStage };
          await taskService.updateTask(task.taskId || task.id, updatedTask);
          setTask(updatedTask);
          setViewingStage(nextStage);
          Swal.fire({
            title: 'Stage Advanced!',
            text: `Advanced to next stage: "${nextStage}"`,
            icon: 'success',
            timer: 2000
          });
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Failed to advance stage', 'error');
        }
      }
    } else if (currentIndex === stageList.length - 1) {
       Swal.fire({
          title: 'Last Stage',
          text: 'This is the last stage. Use the "Fully Completed" button at the top to complete the entire project.',
          icon: 'info'
       });
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    const activeStage = task.stage || getSortedStages()[0];
    if (viewingStage !== activeStage && !isAdmin) {
      Swal.fire({
        title: 'Stage Restriction',
        text: `You can only remove tasks from the active stage: "${activeStage}"!`,
        icon: 'warning'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Remove Task?',
      text: 'Are you sure you want to remove this task from the stage?',
      icon: 'warning',
      showCancelButton: true
    });
    if (!confirm.isConfirmed) return;

    try {
      const updatedStageTasks = { ...(task.stageTasks || {}) };
      if (updatedStageTasks[viewingStage]) {
        updatedStageTasks[viewingStage] = updatedStageTasks[viewingStage].filter(sub => sub.id !== subtaskId);
      }

      const updatedTask = { ...task, stageTasks: updatedStageTasks };
      await taskService.updateTask(task.taskId || task.id, updatedTask);
      setTask(updatedTask);
      Swal.fire('Removed', 'Task removed successfully.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const areAllStagesAndTasksCompleted = React.useMemo(() => {
    if (!task) return false;
    const stages = getSortedStages();
    if (stages.length === 0) return false;
    return stages.every(stageName => {
      const subtasks = (task.stageTasks || {})[stageName] || [];
      return subtasks.every(s => s.isCompleted);
    });
  }, [task, workflowTemplates]);

  const isTaskCompleted = task && ((task.statusName || task.status) === 'Completed' || (task.statusName || task.status) === '6');

  const hasWorkflowSetup = task && task.stageDeadlines && Object.keys(task.stageDeadlines).length > 0;

  const isOnLastStage = React.useMemo(() => {
    if (!task) return false;
    const stages = getSortedStages();
    if (stages.length === 0) return false;
    const currentActiveStage = task.stage || stages[0];
    const lastStage = stages[stages.length - 1];
    return currentActiveStage === lastStage;
  }, [task, workflowTemplates]);

  const showFullyCompletedButton = hasWorkflowSetup &&
                                    isOnLastStage &&
                                    areAllStagesAndTasksCompleted && 
                                    !isTaskCompleted;

  const handleMarkWorkflowCompleted = async () => {
    if (task.dueDate && !isAdmin) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(23, 59, 59, 999);
      if (dueDate < new Date()) {
        Swal.fire({
          title: 'Cannot Complete Project',
          text: 'This project/task has passed its due date and cannot be marked as Completed!',
          icon: 'error'
        });
        return;
      }
    }

    const { value: reasonText, isConfirmed } = await Swal.fire({
      title: 'Complete Project Workflow',
      input: 'textarea',
      inputLabel: 'Provide final comments or completion reasoning:',
      inputPlaceholder: 'Enter completion details...',
      showCancelButton: true,
      confirmButtonText: 'Submit & Complete',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'You must enter a reason to complete the project!';
        }
      }
    });

    if (!isConfirmed) return;

    try {
      const empId = currentUser?.employeeId || currentUser?.id || currentUser?.empId || currentUser?.emp_id || 0;
      const realTaskId = task.taskId || task.id;

      try {
        const payload = {
          taskChangeId: 0,
          taskId: parseInt(realTaskId, 10) || 0,
          statusId: 6, // Completed
          changedBy: parseInt(empId, 10) || 0,
          changeReason: reasonText.trim()
        };
        await taskChangeStatusService.createChange(payload);
      } catch (e) {
        console.warn("Failed to log status change, but continuing", e);
      }

      const updatedTask = {
        ...task,
        status: 6,
        statusName: 'Completed'
      };
      await taskService.updateTask(realTaskId, updatedTask);
      setTask(updatedTask);

      Swal.fire({
        title: 'Project Completed!',
        text: 'Your project flow is done.',
        icon: 'success',
        timer: 2000
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to complete workflow', 'error');
    }
  };

  const handleSaveEditSubtask = async (e) => {
    e.preventDefault();
    if (!editingSubtask || !editingSubtask.title?.trim()) return;

    try {
      const updatedStageTasks = { ...(task.stageTasks || {}) };
      if (updatedStageTasks[viewingStage]) {
        updatedStageTasks[viewingStage] = updatedStageTasks[viewingStage].map(sub => 
          sub.id === editingSubtask.id ? editingSubtask : sub
        );
      }

      const updatedTask = { ...task, stageTasks: updatedStageTasks };
      await taskService.updateTask(task.taskId || task.id, updatedTask);
      setTask(updatedTask);
      setEditingSubtask(null);
      Swal.fire('Updated', 'Task updated successfully.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        const [taskRes, templatesRes] = await Promise.all([
          taskService.getTaskById(id),
          workflowService.getAllTemplates().catch(() => ({ data: [] }))
        ]);
        const taskData = Array.isArray(taskRes?.data) ? taskRes.data[0] : (Array.isArray(taskRes) ? taskRes[0] : (taskRes?.data || taskRes));
        setTask(taskData);
        setWorkflowTemplates(templatesRes?.data || templatesRes || []);
      } catch (error) {
        console.error("Failed to load task details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-slate-500">
        Loading task details from database...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Task Not Found</h2>
        <p className="mt-2 text-slate-500">The task you are looking for does not exist or has been deleted.</p>
        <button onClick={() => navigate('/tasks')} className="mt-6 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">Go Back</button>
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
      <div className={cn("p-2.5 rounded-xl shadow-sm", isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600 border border-blue-100")}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className={cn("text-xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{title}</h2>
    </div>
  );

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out] max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className={cn("p-3 rounded-2xl transition-all duration-300 shadow-sm hover:-translate-y-0.5", isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide", getPriorityColor(task.priorityName || task.priority, isDarkMode))}>
                {task.priorityName || task.priority} Priority
              </span>
            </div>
            <h1 className={cn("text-3xl md:text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{task.taskUid || task.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={task.statusName || task.status} isDarkMode={isDarkMode} />

          {showFullyCompletedButton && (
            <button
              onClick={handleMarkWorkflowCompleted}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 animate-pulse"
            >
              <CheckCircle2 className="w-5 h-5" /> Fully Completed
            </button>
          )}

          <button
            onClick={() => setShowProjectFlow(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <GitMerge className="w-4 h-4" /> Project Flow
          </button>

          {(((task.categoryName || task.category) === 'Development' &&
             (task.subCategoryName || task.subCategory) === 'Software Development') ||
            (task.stageDeadlines && Object.keys(task.stageDeadlines).length > 0)) && (
              <Link
                to={`/tasks/waterfall/${task.taskId || task.id}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <Layers className="w-4 h-4" /> Project Details
              </Link>
            )}

          <Link
            to={`/tasks/edit/${task.taskId || task.id}`}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <Edit className="w-4 h-4" /> Edit Task
          </Link>
        </div>
      </div>

      <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300",
        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
      )}>
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4">
          Workflow Timeline Progress
        </h3>
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
          <WaterfallFlow 
            currentStage={task.stage || 'Planning'} 
            deadlines={task.stageDeadlines || {}}
            stages={getSortedStages()}
            readOnly={true}
            activeViewingStage={viewingStage}
            onSelectStage={setViewingStage}
            stageTasks={task.stageTasks || {}}
            taskStatusName={task.statusName || task.status}
          />
        </div>
      </div>

      {/* Sub-tasks Stage Timeline Manager */}
      {(!isTaskCompleted || (task.stageTasks?.[viewingStage]?.length > 0)) && (
        <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700/50">
            <div>
              <div className="flex items-center gap-3">
                <h3 className={cn("font-extrabold text-lg tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
                  Tasks for "{viewingStage}" Stage
                </h3>
                {viewingStage !== (task.stage || getSortedStages()[0]) && isAdmin && (
                  <button
                    onClick={() => handleUpdateStage(viewingStage)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 active:scale-95 transition-all ml-2"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Set as Active Stage
                  </button>
                )}
              </div>
              <p className="text-xs font-bold text-slate-450 mt-1 uppercase tracking-wider">
                Manage deliverables for this timeline processing stage
              </p>
            </div>
            
            {!isTaskCompleted && ((viewingStage === (task.stage || getSortedStages()[0])) || isAdmin) && (
              <div className="flex items-center gap-2">
                {(!task.stageTasks || !task.stageTasks[viewingStage] || task.stageTasks[viewingStage].length === 0) && (
                  <button
                    type="button"
                    onClick={handleManualAdvanceStage}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md shadow-emerald-500/20 active:scale-95 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> Complete Stage
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddSubtaskModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-md shadow-blue-500/20 active:scale-95 text-sm"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" /> Add Stage Task
                </button>
              </div>
            )}
          </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {(!task.stageTasks || !task.stageTasks[viewingStage] || task.stageTasks[viewingStage].length === 0) ? (
            <div className="py-8 text-center text-slate-450 text-sm font-semibold border-2 border-dashed dark:border-slate-800/60 border-slate-200 rounded-2xl">
              No tasks added to the "{viewingStage}" stage yet. Click "Add Stage Task" to start!
            </div>
          ) : (
            task.stageTasks[viewingStage].map(sub => (
              <div 
                key={sub.id}
                className={cn("p-4 rounded-2xl border flex items-center justify-between gap-4 transition hover:-translate-y-0.5",
                  isDarkMode ? "bg-slate-950/40 border-slate-805 hover:bg-slate-950/60" : "bg-slate-50 border-slate-100 hover:bg-slate-100/70"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input 
                    type="checkbox"
                    checked={sub.isCompleted}
                    onChange={() => handleToggleSubtask(sub.id)}
                    disabled={viewingStage !== (task.stage || getSortedStages()[0]) && !isAdmin}
                    className="w-5 h-5 rounded-lg border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div 
                    onClick={() => setEditingSubtask(sub)}
                    className="cursor-pointer flex-1 min-w-0"
                    title="Click to view details"
                  >
                    <h5 className={cn("font-bold text-sm truncate",
                      sub.isCompleted ? "line-through text-slate-450 font-normal" : isDarkMode ? "text-slate-250" : "text-slate-800"
                    )}>
                      {sub.title}
                    </h5>
                    {sub.description && (
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-450 truncate mt-0.5">
                        {sub.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSubtask(sub)}
                    className={cn("p-2 rounded-xl transition text-slate-400 hover:text-blue-500",
                      isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-200"
                    )}
                    title="View / Edit details"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  {((viewingStage === (task.stage || getSortedStages()[0])) || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="p-2 rounded-xl transition text-rose-500 hover:bg-rose-500/10"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )}

      {/* Add Subtask Modal */}
      {showAddSubtaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 animate-[fadeIn_0.2s_ease-out]">
          <div className={cn("p-6 rounded-2xl w-full max-w-md shadow-2xl border transform scale-100",
            isDarkMode ? "bg-slate-900 border-slate-700/60 text-white" : "bg-white border-slate-200 text-slate-800"
          )}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-slate-800">
              <h3 className="text-lg font-bold">Add Task to "{viewingStage}" Stage</h3>
              <button type="button" onClick={() => setShowAddSubtaskModal(false)} className="text-slate-450 hover:text-slate-200 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleAddSubtask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Task Title *</label>
                <input 
                  type="text" 
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="e.g. Prepare system architectural draft"
                  className={cn("w-full px-4 py-2.5 rounded-xl border font-semibold outline-none transition text-sm focus:ring-2 focus:ring-blue-500/20",
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Description</label>
                <textarea 
                  value={newSubtaskDesc}
                  onChange={(e) => setNewSubtaskDesc(e.target.value)}
                  placeholder="Detailed notes or checklists..."
                  rows="3"
                  className={cn("w-full px-4 py-2.5 rounded-xl border font-semibold outline-none resize-none transition text-sm focus:ring-2 focus:ring-blue-500/20",
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                <button type="button" onClick={() => setShowAddSubtaskModal(false)} className={cn("px-4 py-2 font-bold rounded-lg transition-colors text-sm", isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100")}>Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / View Subtask Details Modal */}
      {editingSubtask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 animate-[fadeIn_0.2s_ease-out]">
          <div className={cn("p-6 rounded-2xl w-full max-w-md shadow-2xl border transform scale-100",
            isDarkMode ? "bg-slate-900 border-slate-700/60 text-white" : "bg-white border-slate-200 text-slate-800"
          )}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b dark:border-slate-800">
              <h3 className="text-lg font-bold">Task Details - {viewingStage} Stage</h3>
              <button type="button" onClick={() => setEditingSubtask(null)} className="text-slate-455 hover:text-slate-200 text-lg font-bold">&times;</button>
            </div>
            <form onSubmit={handleSaveEditSubtask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Task Title *</label>
                <input 
                  type="text" 
                  value={editingSubtask.title || ''}
                  onChange={(e) => setEditingSubtask({ ...editingSubtask, title: e.target.value })}
                  className={cn("w-full px-4 py-2.5 rounded-xl border font-semibold outline-none transition text-sm focus:ring-2 focus:ring-blue-500/20",
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Description</label>
                <textarea 
                  value={editingSubtask.description || ''}
                  onChange={(e) => setEditingSubtask({ ...editingSubtask, description: e.target.value })}
                  rows="3"
                  className={cn("w-full px-4 py-2.5 rounded-xl border font-semibold outline-none resize-none transition text-sm focus:ring-2 focus:ring-blue-500/20",
                    isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>
              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox"
                  id="editSubtaskCompleted"
                  checked={editingSubtask.isCompleted}
                  onChange={(e) => setEditingSubtask({ ...editingSubtask, isCompleted: e.target.checked })}
                  className="w-5 h-5 rounded-lg border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                />
                <label htmlFor="editSubtaskCompleted" className={cn("text-sm font-bold cursor-pointer", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                  Mark as Completed
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                <button type="button" onClick={() => setEditingSubtask(null)} className={cn("px-4 py-2 font-bold rounded-lg transition-colors text-sm", isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100")}>Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <div className="md:col-span-2 space-y-6 lg:space-y-8">

          {/* Main Details */}
          <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={Briefcase} title="Core Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-8">
              <DetailItem label="Category" value={task.categoryName || task.category || task.categoryId} isDarkMode={isDarkMode} />
              <DetailItem label="Sub Category" value={task.subCategoryName || task.subCategory || task.subCategoryId} isDarkMode={isDarkMode} />
              <DetailItem label="Assigned By" value={task.assignByName || task.assignedBy || task.assignBy} isDarkMode={isDarkMode} />
              <DetailItem label="Assigned To" value={task.assignToName || task.assignedTo || 'Unassigned'} isDarkMode={isDarkMode} />
              <DetailItem label="Due Date" value={formatDateToDDMMYYYY(task.dueDate)} isDarkMode={isDarkMode} />
              {task.project && !isNoProject(task.project) && (
                <DetailItem label="Project" value={task.project} isDarkMode={isDarkMode} />
              )}
            </div>

            <div className="space-y-6">
              <div>
                <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>Description</p>
                <div className={cn("p-5 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap font-medium", isDarkMode ? "bg-slate-900/50 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
                  {task.taskDesc || task.description || 'No description provided.'}
                </div>
              </div>
              {task.notes && (
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>Internal Notes</p>
                  <div className={cn("p-5 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap font-medium", isDarkMode ? "bg-amber-500/5 border-amber-500/20 text-slate-300" : "bg-amber-50 border-amber-100 text-slate-700")}>
                    {task.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Visitor Details if present */}
          {isTaskVisits && task.visitorDetails && (
            <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
              <SectionHeader icon={Users} title="Visitor Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <DetailItem label="Visitor Name" value={task.visitorDetails.name} isDarkMode={isDarkMode} />
                <DetailItem label="Company" value={task.visitorDetails.company} isDarkMode={isDarkMode} />
                <DetailItem label="Email" value={task.visitorDetails.email} isDarkMode={isDarkMode} />
                <DetailItem label="Mobile" value={task.visitorDetails.mobile} isDarkMode={isDarkMode} />
                <DetailItem label="Expected Count" value={task.visitorDetails.expectedCount} isDarkMode={isDarkMode} />
                <DetailItem label="Visit Date" value={formatDateToDDMMYYYY(task.visitorDetails.date)} isDarkMode={isDarkMode} />
              </div>
            </div>
          )}

          {/* Visit Details for "Visit" Subcategory */}
          {isTaskSupportVisits && task.visitDetails && (
            <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
              <SectionHeader icon={Briefcase} title="Visit Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6">
                <DetailItem label="Company Name" value={task.visitDetails.companyName} isDarkMode={isDarkMode} />
                <DetailItem label="Person to Meet" value={task.visitDetails.personToMeet} isDarkMode={isDarkMode} />
              </div>
              <div className="space-y-6">
                {task.visitDetails.visitorAccompaniedBy && (
                  <div>
                    <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>Visitor Accompanied By (or Person Accompanied)</p>
                    <div className={cn("p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-medium", isDarkMode ? "bg-slate-900/50 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
                      {task.visitDetails.visitorAccompaniedBy}
                    </div>
                  </div>
                )}
                {task.visitDetails.purposeOfVisit && (
                  <div>
                    <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>Purpose of Visit</p>
                    <div className={cn("p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-medium", isDarkMode ? "bg-slate-900/50 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
                      {task.visitDetails.purposeOfVisit}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visitors Details for "Visit" Subcategory */}
          {isTaskSupportVisits && task.visitorsDetails && (
            <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
              <SectionHeader icon={Users} title="Visitors Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6">
                <DetailItem label="Name" value={task.visitorsDetails.name} isDarkMode={isDarkMode} />
                <DetailItem label="Company Name" value={task.visitorsDetails.companyName} isDarkMode={isDarkMode} />
                <DetailItem label="Mobile" value={task.visitorsDetails.mobile} isDarkMode={isDarkMode} />
                <DetailItem label="Email" value={task.visitorsDetails.email} isDarkMode={isDarkMode} />
              </div>
              {task.visitorsDetails.details && (
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>Details</p>
                  <div className={cn("p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-medium", isDarkMode ? "bg-slate-900/50 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
                    {task.visitorsDetails.details}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extra Members if present */}
          {task.visitorDetails?.extraMembers?.length > 0 && (
            <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
              <SectionHeader icon={Users} title="Extra Members" />
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className={cn("border-b", isDarkMode ? "bg-slate-900/50 border-slate-700/50" : "bg-slate-50 border-slate-200")}>
                    <tr>
                      <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Name</th>
                      <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Role / Company</th>
                      <th className={cn("px-4 py-3 font-bold uppercase tracking-wider text-xs", isDarkMode ? "text-slate-400" : "text-slate-500")}>Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {task.visitorDetails.extraMembers.map((member, idx) => (
                      <tr key={idx} className={isDarkMode ? "bg-slate-800/20" : "bg-white"}>
                        <td className={cn("px-4 py-4 font-semibold", isDarkMode ? "text-slate-200" : "text-slate-800")}>{member.name}</td>
                        <td className="px-4 py-4">
                          <p className={cn("font-medium", isDarkMode ? "text-slate-300" : "text-slate-700")}>{member.role}</p>
                          <p className={cn("text-xs mt-0.5", isDarkMode ? "text-slate-500" : "text-slate-500")}>{member.company}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className={cn("font-medium", isDarkMode ? "text-slate-300" : "text-slate-700")}>{member.email}</p>
                          <p className={cn("text-xs mt-0.5", isDarkMode ? "text-slate-500" : "text-slate-500")}>{member.mobile}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:space-y-8">
          <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={Calendar} title="Timeline" />
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="mt-1"><Clock className={cn("w-5 h-5", isDarkMode ? "text-slate-400" : "text-slate-400")} /></div>
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Created At</p>
                  <div className="flex flex-col gap-1.5">
                    <p className={cn("font-semibold text-sm", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                      {(() => {
                        const c = task.createdAt || task.createdTime || task.CreatedTime || task.createdDate || task.dateCreated;
                        return c ? `${formatDateToDDMMYYYY(c)} ${new Date(c).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A';
                      })()}
                    </p>
                    {(() => {
                      const c = task.createdAt || task.createdTime || task.CreatedTime || task.createdDate || task.dateCreated;
                      if (!c) return null;
                      return (
                        <p className={cn("text-[11px] font-bold px-2 py-1 rounded-md inline-block self-start uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400")}>
                          {formatDistanceToNow(new Date(c), { addSuffix: true })}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="mt-1"><AlertCircle className={cn("w-5 h-5", isDarkMode ? "text-rose-400" : "text-rose-500")} /></div>
                <div>
                  <p className={cn("text-xs font-bold uppercase tracking-wider mb-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Due Date</p>
                  <div className="flex flex-col gap-1.5">
                    <p className={cn("font-semibold text-sm", isDarkMode ? "text-slate-200" : "text-slate-800")}>{formatDateToDDMMYYYY(task.dueDate, 'N/A')}</p>
                    {task.dueDate && (
                      <p className={cn("text-[11px] font-bold px-2 py-1 rounded-md inline-block self-start uppercase tracking-wider",
                        isPast(new Date(new Date(task.dueDate).setHours(23, 59, 59, 999)))
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                      )}>
                        {getDueTimeText(task.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isTaskVisits && task.referrerDetails && (
            <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
              <SectionHeader icon={FileCheck} title="Reference Details" />
              <div className="space-y-4">
                <DetailItem label="Referrer Name" value={task.referrerDetails.name} isDarkMode={isDarkMode} />
                <DetailItem label="Referrer Type" value={task.referrerDetails.type} isDarkMode={isDarkMode} />
                {task.referrerDetails.description && (
                  <div>
                    <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>Description</p>
                    <div className={cn("p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-medium", isDarkMode ? "bg-slate-900/50 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
                      {task.referrerDetails.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isTaskVisits && task.meetingPersonDetails && (
            <div className={cn("p-6 md:p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
              <SectionHeader icon={Users} title="Meeting With" />
              <div className="space-y-4">
                <DetailItem label="Employee Name" value={task.meetingPersonDetails.name} isDarkMode={isDarkMode} />
                {task.meetingPersonDetails.description && (
                  <div>
                    <p className={cn("text-xs font-bold uppercase tracking-wider mb-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>Description</p>
                    <div className={cn("p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap font-medium", isDarkMode ? "bg-slate-900/50 border-slate-700/50 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700")}>
                      {task.meetingPersonDetails.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      {showProjectFlow && (
        <ProjectFlow
          task={task}
          onClose={() => setShowProjectFlow(false)}
        />
      )}
    </div>
  );
}
