import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Briefcase, Calendar, AlignLeft, Edit, CheckCircle2, Clock, Users, Building, FileText, Phone, Mail, FileCheck, AlertCircle, Layers, GitMerge } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { taskService } from '../services/taskService';
import { formatDateToDDMMYYYY } from '../utils/dateFormatter';
import ProjectFlow from '../components/ProjectFlow';


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
  const { isDarkMode } = useStore();

  const [task, setTask] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showProjectFlow, setShowProjectFlow] = React.useState(false);

  React.useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await taskService.getTaskById(id);
        const taskData = Array.isArray(res?.data) ? res.data[0] : (Array.isArray(res) ? res[0] : (res?.data || res));
        setTask(taskData);
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

          <button
            onClick={() => setShowProjectFlow(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            <GitMerge className="w-4 h-4" /> Project Flow
          </button>

          {((task.categoryName || task.category) === 'Development' &&
            (task.subCategoryName || task.subCategory) === 'Software Development') && (
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
          {(task.categoryName || task.category) === 'Visits' && task.visitorDetails && (
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

          {(task.categoryName || task.category) === 'Visits' && task.referrerDetails && (
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

          {(task.categoryName || task.category) === 'Visits' && task.meetingPersonDetails && (
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
