import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Plus, Trash2, Calendar, FolderKanban, ArrowUpRight, BarChart3, Clock } from 'lucide-react';
import { projectService } from '../services/projectService';
import Swal from 'sweetalert2';

export default function ProjectsList() {
  const { isDarkMode } = useStore();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getAllProjects();
      if (res.isSuccess) {
        setProjects(res.data || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "All stage deadlines, tasks, and attachments will be deleted permanently!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await projectService.deleteProject(id);
      if (res.isSuccess) {
        Swal.fire('Deleted!', 'Project deleted successfully.', 'success');
        loadProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'On Hold': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
            Enterprise Projects
          </h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Manage and track project execution lifecycles and stage checkpoints.
          </p>
        </div>
        <Link
          to="/projects/new"
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-md shadow-blue-600/30"
        >
          <Plus className="w-5 h-5" /> Create Project
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>Loading projects...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map(proj => (
              <div 
                key={proj.projectId}
                onClick={() => navigate(`/projects/${proj.projectId}`)}
                className={cn("p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer flex flex-col justify-between relative group",
                  isDarkMode ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60" : "bg-white border-slate-200 hover:bg-slate-50/50"
                )}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={cn("p-3 rounded-xl", isDarkMode ? "bg-slate-700 text-indigo-400" : "bg-indigo-50/50 text-indigo-600")}>
                      <FolderKanban className="w-6 h-6" />
                    </div>
                    <span className={cn("px-2.5 py-1 text-xs font-bold border rounded-full uppercase tracking-wider", getStatusColor(proj.status))}>
                      {proj.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg group-hover:text-blue-500 transition-colors">{proj.projectName}</h3>
                    <p className={cn("text-sm mt-1 line-clamp-2", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                      {proj.description || "No description provided."}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5 text-blue-500" /> Progress</span>
                      <span className="text-blue-500">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-750 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 rounded-full" 
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center text-xs font-semibold text-slate-400">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Start: {formatDate(proj.startDate)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due: {formatDate(proj.expectedEndDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(proj.projectId, e)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-550/10 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 border dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-blue-500 dark:text-blue-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={cn("col-span-full p-12 text-center border-2 border-dashed rounded-3xl", 
              isDarkMode ? "border-slate-700 text-slate-400" : "border-slate-300 text-slate-500"
            )}>
              <FolderKanban className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-bold">No projects created yet</h3>
              <p className="text-sm mt-1 mb-6">Standardize and orchestrate your timelines using templates.</p>
              <Link
                to="/projects/new"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-sm"
              >
                Create First Project
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
