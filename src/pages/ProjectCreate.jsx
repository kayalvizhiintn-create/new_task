import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Save, Briefcase, Calendar, AlignLeft, Clock } from 'lucide-react';
import workflowService from '../services/workflowService';
import { projectService } from '../services/projectService';
import SearchableSelect from '../components/SearchableSelect';
import Swal from 'sweetalert2';

export default function ProjectCreate() {
  const { isDarkMode } = useStore();
  const navigate = useNavigate();

  // Basic project fields
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Workflow template details
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [stageDeadlines, setStageDeadlines] = useState({}); // { stageSequence: 'YYYY-MM-DD' }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Recalculate estimated stage dates when template or project startDate changes
  useEffect(() => {
    if (selectedTemplate && startDate) {
      const deadlines = {};
      let baseDate = new Date(startDate);
      const sorted = [...selectedTemplate.stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      sorted.forEach(stg => {
        baseDate = new Date(baseDate.getTime() + stg.defaultDeadlineDays * 24 * 60 * 60 * 1000);
        deadlines[stg.sequence] = baseDate.toISOString().split('T')[0];
      });
      setStageDeadlines(deadlines);
    }
  }, [selectedTemplate, startDate]);

  const fetchTemplates = async () => {
    try {
      const res = await workflowService.getAllTemplates();
      if (res.isSuccess) {
        setTemplates(res.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTemplateChange = (e) => {
    const val = e.target.value;
    setSelectedTemplateId(val);
    if (!val) {
      setSelectedTemplate(null);
      setStageDeadlines({});
      return;
    }
    const template = templates.find(t => String(t.templateId) === String(val));
    if (template) {
      setSelectedTemplate(template);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !startDate || !expectedEndDate || !selectedTemplateId) {
      Swal.fire('Error', 'Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Calculate sequence durations based on chosen calendar dates
      const sorted = [...selectedTemplate.stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      const projectStagesPayload = [];
      let lastDate = new Date(startDate);

      for (const stg of sorted) {
        const selectedStageDate = stageDeadlines[stg.sequence] 
          ? new Date(stageDeadlines[stg.sequence]) 
          : new Date(lastDate.getTime() + stg.defaultDeadlineDays * 24 * 60 * 60 * 1000);
        
        let diffMs = selectedStageDate - lastDate;
        let days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        
        projectStagesPayload.push({
          stageName: stg.stageName,
          sequence: stg.sequence,
          deadlineDays: days
        });

        lastDate = selectedStageDate;
      }

      const payload = {
        projectName: projectName.trim(),
        description: description.trim(),
        startDate: new Date(startDate).toISOString(),
        expectedEndDate: new Date(expectedEndDate).toISOString(),
        templateId: parseInt(selectedTemplateId, 10),
        projectStages: projectStagesPayload
      };

      const res = await projectService.createProject(payload);
      if (res.isSuccess) {
        Swal.fire({
          title: 'Success',
          text: 'Project created and workflow copied!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        navigate('/projects');
      } else {
        Swal.fire('Error', res.message, 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    "w-full px-4 py-3 rounded-xl border outline-none transition-all duration-300 text-sm font-semibold shadow-sm",
    isDarkMode 
      ? "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10" 
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
  );
  
  const labelClass = cn("block text-xs font-bold mb-2 tracking-wide uppercase", isDarkMode ? "text-slate-400" : "text-slate-500");
  const bgCardClass = isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200";

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4">
        <Link 
          to="/projects" 
          className={cn("p-3 rounded-2xl transition border shadow-sm", 
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
            New Project Timeline
          </h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Initialize an enterprise roadmap and customize stage deadlines.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Metadata Card */}
        <div className={cn("p-8 rounded-3xl border shadow-sm", bgCardClass)}>
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-5 h-5 text-blue-500" />
            <h2 className="font-extrabold text-lg">Project Scope & Schedule</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Project Name <span className="text-rose-500">*</span></label>
              <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Q3 System Migration"
                className={inputClass}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Project Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level objectives, guidelines, resources, and scope boundaries."
                className={cn(inputClass, "resize-y")}
                rows={3}
              />
            </div>

            <div>
              <label className={labelClass}>Start Date <span className="text-rose-500">*</span></label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Expected End Date <span className="text-rose-500">*</span></label>
              <input 
                type="date" 
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>

        {/* Workflow Template Selector */}
        <div className={cn("p-8 rounded-3xl border shadow-sm", bgCardClass)}>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h2 className="font-extrabold text-lg">Workflow Template Mappings</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className={labelClass}>Select Workflow Template <span className="text-rose-500">*</span></label>
              <SearchableSelect
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                options={templates.map(t => ({
                  value: String(t.templateId),
                  label: t.templateName
                }))}
                placeholder="Choose standard workflow blueprint..."
                isDarkMode={isDarkMode}
              />
            </div>

            {selectedTemplate && startDate && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="border-t dark:border-slate-700/50 pt-6">
                  <h3 className="font-extrabold text-sm mb-4 uppercase tracking-wide text-slate-400">
                    Configure Stage Deadlines (Choose Target Calendar Dates)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedTemplate.stages.map(stg => (
                      <div 
                        key={stg.stageId}
                        className={cn("p-4 rounded-2xl border flex items-center justify-between gap-4",
                          isDarkMode ? "bg-slate-900/30 border-slate-700/50" : "bg-slate-50 border-slate-200"
                        )}
                      >
                        <div>
                          <span className="px-2 py-0.5 text-xs font-extrabold bg-blue-500/10 text-blue-500 rounded uppercase">
                            Stage {stg.sequence}
                          </span>
                          <h4 className="font-bold text-sm mt-1">{stg.stageName}</h4>
                        </div>

                        <div className="w-48">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deadline Date</label>
                          <input 
                            type="date" 
                            value={stageDeadlines[stg.sequence] || ''}
                            onChange={(e) => {
                              setStageDeadlines(prev => ({
                                ...prev,
                                [stg.sequence]: e.target.value
                              }));
                            }}
                            className={cn(inputClass, "py-2 px-3 text-xs")}
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to="/projects"
            className={cn("px-6 py-3 rounded-xl font-bold border transition-all duration-300 shadow-sm",
              isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            )}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save & Build Roadmap'}
          </button>
        </div>
      </form>
    </div>
  );
}
