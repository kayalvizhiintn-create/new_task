import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import {
  ArrowLeft, Calendar, Clock, BarChart3, Lock, CheckCircle2, AlertTriangle,
  MessageSquare, Paperclip, Plus, Trash2, Edit2, User, Play, AlertCircle, FileText
} from 'lucide-react';
import { projectService } from '../services/projectService';
import projectWorkflowService from '../services/projectWorkflowService';
import { employeeService } from '../services/employeeService';
import SearchableSelect from '../components/SearchableSelect';
import Swal from 'sweetalert2';
import { calculateStageStatus, calculateTaskStatus, TIMELINE_STATUS } from '../utils/timelineStatus';
//iyo iyo sir pakkuraru ilana adichiruvaru one write 
// Reusable Stage Timeline Component for Task Context
const TaskStageTimeline = ({ projectStages, activeStageId }) => {
  const sorted = [...projectStages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const activeIdx = sorted.findIndex(s => s.projectStageId === activeStageId);

  return (
    <div className="w-full flex items-center justify-between gap-1 overflow-x-auto pb-3 pt-2 border-b dark:border-slate-800 border-slate-100 mb-2">
      {sorted.map((stage, idx) => {
        const isActive = stage.projectStageId === activeStageId;
        const stageTasks = stage.tasks || stage.projectTasks || [];
        const stageStatus = calculateStageStatus(stageTasks, stage.deadlineDate);

        return (
          <React.Fragment key={stage.projectStageId}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div 
                className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-300",
                  stageStatus.twClass,
                  isActive && "ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-blue-500 scale-105"
                )}
                title={`Status: ${stageStatus.status}`}
              >
                {stage.sequence}
              </div>
              <span className={cn("text-[9px] font-black tracking-wide truncate max-w-[65px]",
                isActive ? "text-blue-500" : "text-slate-500 dark:text-slate-400"
              )}>
                {stage.stageName}
              </span>
            </div>
            {idx < sorted.length - 1 && (
              <div className={cn("h-0.5 flex-1 min-w-[15px] rounded-full transition-colors duration-300",
                stageStatus.status === TIMELINE_STATUS.NOT_STARTED ? "bg-slate-200 dark:bg-slate-800" : stageStatus.twClass.split(' ')[0]
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default function ProjectTimelineDetails() {
  const { id } = useParams();
  const { isDarkMode, currentUser } = useStore();

  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedStageId, setExpandedStageId] = useState(null);

  // Detail Drawer/Modal for Task
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Simulated File upload states
  const [mockFileName, setMockFileName] = useState('');

  // Task add/edit forms
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formStageId, setFormStageId] = useState(null);
  const [formTaskId, setFormTaskId] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskStatus, setTaskStatus] = useState('Pending');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);

  useEffect(() => {
    loadProjectDetails();
    loadEmployees();
  }, [id]);

  const loadProjectDetails = async () => {
    setLoading(true);
    try {
      const res = await projectService.getProjectById(id);
      if (res.isSuccess && res.data && res.data.length > 0) {
        setProject(res.data[0]);
        const stages = res.data[0].projectStages || [];
        const activeStage = stages.find(s => s.status !== 'Locked');
        if (activeStage) {
          setExpandedStageId(activeStage.projectStageId);
        } else if (stages.length > 0) {
          setExpandedStageId(stages[0].projectStageId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await employeeService.getAllEmployees();
      if (res.isSuccess) {
        setEmployees(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTaskForm = (stageId, task = null) => {
    setFormStageId(stageId);
    if (task) {
      setFormTaskId(task.projectTaskId);
      setTaskName(task.taskName);
      setTaskDesc(task.description);
      setTaskAssignee(task.assignedUserId ? String(task.assignedUserId) : '');
      setTaskPriority(task.priority);
      setTaskStatus(task.status);
      setTaskDeadline(task.deadline ? task.deadline.split('T')[0] : '');
      setTaskProgress(task.progress || 0);
    } else {
      setFormTaskId(null);
      setTaskName('');
      setTaskDesc('');
      setTaskAssignee('');
      setTaskPriority('Medium');
      setTaskStatus('Pending');
      setTaskDeadline('');
      setTaskProgress(0);
    }
    setShowTaskForm(true);
  };

  const handleProgressSliderChange = (val) => {
    const num = Math.min(100, Math.max(0, Number(val)));
    setTaskProgress(num);
    if (num === 100) {
      setTaskStatus('Completed');
    } else if (taskStatus === 'Completed' && num < 100) {
      setTaskStatus('In Progress');
    }
  };

  const handleStatusSelectChange = (val) => {
    setTaskStatus(val);
    if (val === 'Completed') {
      setTaskProgress(100);
    } else if (val !== 'Completed' && taskProgress === 100) {
      setTaskProgress(0);
    }
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    try {
      const payload = {
        projectTaskId: formTaskId || 0,
        projectStageId: formStageId,
        taskName: taskName.trim(),
        description: taskDesc.trim(),
        assignedUserId: taskAssignee ? parseInt(taskAssignee, 10) : null,
        priority: taskPriority,
        status: taskStatus,
        deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
        progress: Number(taskProgress),
        remarks: ''
      };

      const res = formTaskId
        ? await projectWorkflowService.updateTask(payload)
        : await projectWorkflowService.createTask(payload);

      if (res.isSuccess) {
        Swal.fire({
          title: 'Success',
          text: formTaskId ? 'Task updated successfully' : 'Task added successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        setShowTaskForm(false);
        loadProjectDetails();
      } else {
        Swal.fire('Error', res.message, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirm = await Swal.fire({
      title: 'Delete Task?',
      text: 'This will delete the task permanently!',
      icon: 'warning',
      showCancelButton: true
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await projectWorkflowService.deleteTask(taskId);
      if (res.isSuccess) {
        loadProjectDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const res = await projectWorkflowService.updateTaskStatus(taskId, newStatus, 'Status changed from board');
      if (res.isSuccess) {
        loadProjectDetails();
        if (selectedTask && selectedTask.projectTaskId === taskId) {
          refreshTaskDetails(taskId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskAssigneeChange = async (taskId, newAssigneeId) => {
    try {
      const res = await projectWorkflowService.assignTask(taskId, newAssigneeId ? parseInt(newAssigneeId, 10) : null);
      if (res.isSuccess) {
        loadProjectDetails();
        if (selectedTask && selectedTask.projectTaskId === taskId) {
          refreshTaskDetails(taskId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTaskDetails = async (task) => {
    setSelectedTask(task);
    setNewCommentText('');
    setMockFileName('');
    await refreshTaskDetails(task.projectTaskId);
  };

  const refreshTaskDetails = async (taskId) => {
    try {
      const taskRes = await projectWorkflowService.getTaskById(taskId);
      if (taskRes.isSuccess) {
        setSelectedTask(taskRes.data);
        setComments(taskRes.data.comments || []);
        setAttachments(taskRes.data.attachments || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;
    try {
      const payload = {
        projectTaskId: selectedTask.projectTaskId,
        text: newCommentText.trim()
      };
      const res = await projectWorkflowService.addComment(payload);
      if (res.isSuccess) {
        setNewCommentText('');
        refreshTaskDetails(selectedTask.projectTaskId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!mockFileName.trim() || !selectedTask) return;
    try {
      const payload = {
        projectTaskId: selectedTask.projectTaskId,
        fileName: mockFileName.trim(),
        filePath: `/uploads/mock_${Date.now()}_${mockFileName.trim()}`
      };
      const res = await projectWorkflowService.addAttachment(payload);
      if (res.isSuccess) {
        setMockFileName('');
        refreshTaskDetails(selectedTask.projectTaskId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStageColorConfig = (stage) => {
    const today = new Date();
    const deadline = stage.deadlineDate ? new Date(stage.deadlineDate) : null;
    const completed = stage.completedDate ? new Date(stage.completedDate) : null;

    if (stage.status === 'Completed') {
      if (deadline && completed && completed <= deadline) {
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/20 text-emerald-500',
          indicator: 'bg-emerald-500 shadow-emerald-500/50',
          label: 'Completed On Time'
        };
      }
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/10 border-amber-500/30 dark:border-amber-500/20 text-amber-500',
        indicator: 'bg-amber-500 shadow-amber-500/50',
        label: 'Completed Late'
      };
    } else if (stage.status === 'In Progress') {
      if (deadline && today > deadline) {
        return {
          bg: 'bg-rose-600/10 dark:bg-rose-600/10 border-rose-600/30 dark:border-rose-600/20 text-rose-500 dark:text-rose-450',
          indicator: 'bg-rose-600 animate-pulse shadow-rose-600/50',
          label: 'Overdue'
        };
      }
      return {
        bg: 'bg-orange-500/10 dark:bg-orange-500/10 border-orange-500/30 dark:border-orange-500/20 text-orange-500',
        indicator: 'bg-orange-500 shadow-orange-500/50',
        label: 'In Progress'
      };
    } else if (stage.status === 'On Hold') {
      return {
        bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
        indicator: 'bg-indigo-500',
        label: 'On Hold'
      };
    } else if (stage.status === 'Cancelled') {
      return {
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
        indicator: 'bg-rose-500',
        label: 'Cancelled'
      };
    } else {
      return {
        bg: 'bg-slate-500/5 border-slate-200 dark:border-slate-700/50 text-slate-400 dark:text-slate-500',
        indicator: 'bg-slate-350 dark:bg-slate-700',
        label: 'Locked Gateway'
      };
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'High': return 'bg-rose-500/10 text-rose-500';
      case 'Critical': return 'bg-rose-600/20 text-rose-600 border border-rose-600/20';
      case 'Low': return 'bg-slate-500/10 text-slate-400';
      default: return 'bg-blue-500/10 text-blue-500';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const inputClass = cn(
    "w-full px-4 py-2.5 rounded-xl border outline-none transition text-sm font-semibold",
    isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-900"
  );

  if (loading || !project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Loading project timeline...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out] relative">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className={cn("p-3 rounded-2xl transition border shadow-sm",
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h1 className={cn("text-3xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
                {project.projectName}
              </h1>
              <p className={cn("text-sm mt-1 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                {project.description || "No description provided."}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Start: {formatDate(project.startDate)}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> End: {formatDate(project.expectedEndDate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress and Timeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Progress Card */}
        <div className={cn("p-6 rounded-3xl border flex flex-col justify-between shadow-sm",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}>
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" /> Overall Progress
            </h3>
            <div className="text-4xl font-black text-blue-500 mt-4">{project.progress}%</div>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-6">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        {/* Timeline Roadmap Flow */}
        <div className={cn("p-6 rounded-3xl border lg:col-span-3 shadow-sm",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Workflow Roadmap (Sequential Checkpoints)
          </h3>

          <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 overflow-x-auto pb-2">
            {project.projectStages.map((stage) => {
              const config = getStageColorConfig(stage);
              const isExpanded = expandedStageId === stage.projectStageId;

              return (
                <div
                  key={stage.projectStageId}
                  onClick={() => stage.status !== 'Locked' && setExpandedStageId(stage.projectStageId)}
                  className={cn("flex-1 p-4 rounded-2xl border transition-all duration-300 relative select-none",
                    stage.status === 'Locked' ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:shadow-md",
                    isExpanded ? "ring-2 ring-blue-500" : "",
                    config.bg
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-500/10 rounded">
                      Seq {stage.sequence}
                    </span>
                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", config.indicator)} />
                  </div>

                  <h4 className="font-extrabold text-sm mt-3 truncate">{stage.stageName}</h4>

                  <div className="mt-4 flex flex-col gap-1 text-[10px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start: {formatDate(stage.startDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {formatDate(stage.deadlineDate)}</span>
                  </div>

                  <div className="mt-4 flex justify-between items-center text-[10px] font-bold">
                    <span className="uppercase tracking-wider">{config.label}</span>
                    <span className="text-blue-500">{stage.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Stage details - Task Board / Kanban */}
      {expandedStageId && (
        <div className="space-y-6">
          {(() => {
            const curStage = project.projectStages.find(s => s.projectStageId === expandedStageId);
            if (!curStage) return null;

            const columns = [
              { id: 'Pending', label: 'To Do', border: 'border-t-slate-400' },
              { id: 'In Progress', label: 'In Progress', border: 'border-t-blue-500' },
              { id: 'Review', label: 'Review', border: 'border-t-amber-500' },
              { id: 'Completed', label: 'Done', border: 'border-t-emerald-500' },
              { id: 'Blocked', label: 'Blocked', border: 'border-t-rose-500' }
            ];

            return (
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black flex items-center gap-2">
                      {curStage.stageName}
                      <span className="text-sm font-bold text-slate-400 ml-2">({curStage.progress}% Complete)</span>
                    </h2>
                    
                    {(() => {
                      const curStageTasks = curStage.tasks || curStage.projectTasks || [];
                      const finalStageStatus = calculateStageStatus(curStageTasks, curStage.deadlineDate);
                      return (
                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("px-2.5 py-1 text-xs font-bold rounded-lg border", finalStageStatus.twClass)}>
                            {finalStageStatus.status}
                          </span>
                          <p className="text-xs text-slate-400 font-semibold">
                            Gateway timeline: {formatDate(curStage.startDate)} to {formatDate(curStage.deadlineDate)}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {curStage.status !== 'Locked' && (
                    <button
                      onClick={() => handleOpenTaskForm(curStage.projectStageId)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs transition"
                    >
                      <Plus className="w-4 h-4" /> Add Stage Task
                    </button>
                  )}
                </div>

                {/* Columns Container */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {columns.map(col => {
                    const colTasks = (curStage.tasks || []).filter(t => t.status === col.id);

                    return (
                      <div
                        key={col.id}
                        className={cn("p-4 rounded-2xl border-t-4 border min-h-[350px] flex flex-col gap-4",
                          isDarkMode ? "bg-slate-800/20 border-slate-750" : "bg-slate-50/50 border-slate-200",
                          col.border
                        )}
                      >
                        <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
                          <span>{col.label}</span>
                          <span className="px-2 py-0.5 bg-slate-500/10 rounded">{colTasks.length}</span>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          {colTasks.map(task => {
                            const tStatus = calculateTaskStatus(task, curStage.deadlineDate);
                            return (
                              <div
                                key={task.projectTaskId}
                                onClick={() => handleOpenTaskDetails(task)}
                                className={cn("p-4 rounded-xl border-l-[6px] border-y border-r transition duration-300 hover:shadow-md cursor-pointer space-y-3",
                                  isDarkMode ? "bg-slate-900/60 border-y-slate-750 border-r-slate-750 hover:bg-slate-900" : "bg-white border-y-slate-200 border-r-slate-200 hover:bg-slate-50"
                                )}
                                style={{ borderLeftColor: tStatus.color }}
                              >
                              <div className="flex justify-between items-start gap-2">
                                <h5 className="font-bold text-sm line-clamp-2">{task.taskName}</h5>
                                <span className={cn("px-1.5 py-0.5 text-[9px] font-black uppercase rounded", getPriorityBadge(task.priority))}>
                                  {task.priority}
                                </span>
                              </div>

                              <p className={cn("text-xs line-clamp-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                                {task.description || "No description provided."}
                              </p>

                              {/* Task Progress Tracker Indicator */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-400">Task Progress</span>
                                  <span className="text-blue-500 font-extrabold">{task.progress || 0}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress || 0}%` }} />
                                </div>
                              </div>

                              {/* Footer information */}
                              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 pt-1">
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(task.deadline)}</span>
                                <div className="flex items-center gap-3">
                                  {task.comments && task.comments.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-slate-400"><MessageSquare className="w-3 h-3" /> {task.comments.length}</span>
                                  )}
                                  {task.attachments && task.attachments.length > 0 && (
                                    <span className="flex items-center gap-0.5 text-slate-400"><Paperclip className="w-3 h-3" /> {task.attachments.length}</span>
                                  )}
                                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-750 flex items-center justify-center font-bold text-slate-500 text-[9px]">
                                    {task.assignedUserName ? task.assignedUserName[0].toUpperCase() : '?'}
                                  </div>
                                </div>
                              </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Task Drawer / Sidebar */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className={cn("w-full max-w-lg h-full p-8 overflow-y-auto shadow-2xl flex flex-col justify-between animate-[slideIn_0.3s_ease-out]",
            isDarkMode ? "bg-slate-900 border-l border-slate-700 text-white" : "bg-white border-l border-slate-200 text-slate-900"
          )}>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase rounded", getPriorityBadge(selectedTask.priority))}>
                    {selectedTask.priority} Priority
                  </span>
                  <h3 className="text-xl font-extrabold mt-2">{selectedTask.taskName}</h3>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition font-bold"
                >
                  Close
                </button>
              </div>

              {/* Sequential Process Stepper Timeline */}
              <TaskStageTimeline
                projectStages={project.projectStages}
                activeStageId={selectedTask.projectStageId}
              />

              {/* Edit / Delete quick controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleOpenTaskForm(selectedTask.projectStageId, selectedTask);
                  }}
                  className="px-3 py-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Details
                </button>
                <button
                  onClick={() => {
                    handleDeleteTask(selectedTask.projectTaskId);
                    setSelectedTask(null);
                  }}
                  className="px-3 py-1.5 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Task
                </button>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Description</h4>
                  <p className="text-sm mt-1 font-medium">{selectedTask.description || "No description provided."}</p>
                </div>

                {/* Progress Visualizer */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Task Progress Meter</h4>
                    <span className="text-xs font-black text-blue-500">{selectedTask.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" style={{ width: `${selectedTask.progress || 0}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Assignee</label>
                    <select
                      value={selectedTask.assignedUserId || ''}
                      onChange={(e) => handleTaskAssigneeChange(selectedTask.projectTaskId, e.target.value)}
                      className={cn("mt-1.5 py-1.5", inputClass)}
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 tracking-wider">Status</label>
                    <select
                      value={selectedTask.status}
                      onChange={(e) => handleTaskStatusChange(selectedTask.projectTaskId, e.target.value)}
                      className={cn("mt-1.5 py-1.5", inputClass)}
                    >
                      <option value="Pending">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                {selectedTask.remarks && (
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Remarks</h4>
                    <p className="text-sm mt-1 italic text-slate-400 font-semibold">{selectedTask.remarks}</p>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-500" /> Collaboration ({comments.length})
                </h4>

                <div className="max-h-[180px] overflow-y-auto space-y-3 pr-2">
                  {comments.map(c => (
                    <div key={c.commentId} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-xs">
                      <div className="flex justify-between items-center font-bold text-slate-400 mb-1">
                        <span className="text-blue-400">{c.userName || 'Unknown'}</span>
                        <span>{new Date(c.createdTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-semibold text-slate-200">{c.text}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-xs italic text-slate-400 text-center py-4 font-semibold">No comments posted yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Type collaboration note..."
                    className={cn("flex-1 text-xs py-2 px-3", inputClass)}
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs">
                    Post
                  </button>
                </form>
              </div>

              {/* Attachments Section */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-indigo-500" /> Attachments ({attachments.length})
                </h4>

                <div className="max-h-[140px] overflow-y-auto space-y-2">
                  {attachments.map(a => (
                    <div key={a.attachmentId} className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-xs">
                      <span className="font-bold flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-450" /> {a.fileName}</span>
                      <a href="#" className="text-blue-400 hover:underline">Download</a>
                    </div>
                  ))}
                  {attachments.length === 0 && (
                    <p className="text-xs italic text-slate-400 text-center py-4 font-semibold">No files attached yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddAttachment} className="flex gap-2">
                  <input
                    type="text"
                    value={mockFileName}
                    onChange={(e) => setMockFileName(e.target.value)}
                    placeholder="Enter mock file name to attach (e.g. spec.pdf)..."
                    className={cn("flex-1 text-xs py-2 px-3", inputClass)}
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs">
                    Attach
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveTask} className={cn("w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6 animate-[fadeIn_0.2s_ease-out]",
            isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div className="border-b dark:border-slate-800 pb-2">
              <h3 className="text-xl font-bold">{formTaskId ? 'Edit Stage Task' : 'Add Task to Stage'}</h3>
            </div>

            {/* Sequential Process Stepper Timeline inside Creation/Edit Modal */}
            <TaskStageTimeline
              projectStages={project.projectStages}
              activeStageId={formStageId}
            />

            <div>
              <label className="block text-xs font-bold uppercase mb-2">Task Name</label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Conduct requirement analysis"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-2">Description</label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                className={cn(inputClass, "resize-none")}
                rows={3}
                placeholder="Detail expectations, check items, or resources."
              />
            </div>

            {/* Progress Slider Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase">Task Progress Tracker</label>
                <span className="text-xs font-black text-blue-500">{taskProgress}%</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={taskProgress}
                  onChange={(e) => handleProgressSliderChange(e.target.value)}
                  className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taskProgress}
                  onChange={(e) => handleProgressSliderChange(e.target.value)}
                  className={cn(inputClass, "w-20 text-center py-1.5 px-2")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Assignee</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>{emp.employeeName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-2">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className={inputClass}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => handleStatusSelectChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="Pending">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-2">Deadline Date</label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowTaskForm(false)}
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
