import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { Users, Plus, UserCircle, Crown, Trash2, AlertTriangle, X } from 'lucide-react';
import DiscussionForum from '../components/DiscussionForum';

export default function TeamManagement() {
  const { isDarkMode, teams, employees, tasks, createTeam, deleteTeam } = useStore();
  
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLead, setNewTeamLead] = useState('');
  const [newTeamMembers, setNewTeamMembers] = useState([]);
  
  const [selectedTeamId, setSelectedTeamId] = useState(teams.length > 0 ? teams[0].id : null);
  const [showErrorPopup, setShowErrorPopup] = useState({ show: false, message: '' });

  const handleCreateTeam = (e) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamLead || newTeamMembers.length === 0) {
      setShowErrorPopup({ show: true, message: "Please provide a project name, lead, and at least one member." });
      return;
    }

    if (teams.some(t => t.name === newTeamName)) {
      setShowErrorPopup({ show: true, message: "You have already created a team for this project!" });
      return;
    }
    
    createTeam({
      name: newTeamName,
      lead: newTeamLead,
      members: newTeamMembers
    });
    
    setNewTeamName('');
    setNewTeamLead('');
    setNewTeamMembers([]);
  };

  const toggleMember = (empName) => {
    if (newTeamMembers.includes(empName)) {
      setNewTeamMembers(newTeamMembers.filter(m => m !== empName));
    } else {
      setNewTeamMembers([...newTeamMembers, empName]);
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 text-sm font-semibold",
    isDarkMode 
      ? "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10" 
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
  );
  
  const labelClasses = cn("block text-sm font-bold mb-2 tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-700");

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out] relative">
      
      {/* Sweet Alert Popup */}
      {showErrorPopup.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className={cn("relative w-full max-w-sm p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center animate-[scaleIn_0.3s_ease-out]", 
            isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-white border border-slate-200"
          )}>
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className={cn("text-xl font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>Wait a minute!</h3>
            <p className={cn("text-sm font-medium mb-6", isDarkMode ? "text-slate-300" : "text-slate-600")}>
              {showErrorPopup.message}
            </p>
            <button 
              onClick={() => setShowErrorPopup({ show: false, message: '' })}
              className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Okay, Got it
            </button>
            <button 
              onClick={() => setShowErrorPopup({ show: false, message: '' })}
              className={cn("absolute top-4 right-4 p-1.5 rounded-full transition-colors", isDarkMode ? "hover:bg-slate-700 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Team Management</h1>
        <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          Create and manage teams, assign projects, and collaborate in dedicated discussion forums.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Create Team & Team List */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Create Team Form */}
          <div className={cn("p-6 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <div className="flex items-center gap-3 mb-6">
              <div className={cn("p-2 rounded-xl", isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600")}>
                <Plus className="w-5 h-5" />
              </div>
              <h2 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Create New Team</h2>
            </div>
            
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className={labelClasses}>Project Name</label>
                <select 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className={cn(inputClasses, "appearance-none cursor-pointer")}
                >
                  <option value="">Select Project</option>
                  {tasks.map(task => (
                    <option key={task.id} value={task.title}>{task.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={labelClasses}>Team Lead</label>
                <select 
                  value={newTeamLead}
                  onChange={(e) => setNewTeamLead(e.target.value)}
                  className={cn(inputClasses, "appearance-none cursor-pointer")}
                >
                  <option value="">Select Team Lead</option>
                  {employees.map(emp => (
                    <option key={`lead-${emp.id}`} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClasses}>Team Members</label>
                <div className={cn("max-h-40 overflow-y-auto p-2 border rounded-xl space-y-1 custom-scrollbar", isDarkMode ? "border-slate-700 bg-slate-900/30" : "border-slate-200 bg-slate-50")}>
                  {employees.filter(e => e.name !== newTeamLead).map(emp => (
                    <label key={`member-${emp.id}`} className={cn("flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors", 
                      isDarkMode ? "hover:bg-slate-800" : "hover:bg-white"
                    )}>
                      <input 
                        type="checkbox" 
                        checked={newTeamMembers.includes(emp.name)}
                        onChange={() => toggleMember(emp.name)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className={cn("text-sm font-semibold", isDarkMode ? "text-slate-300" : "text-slate-700")}>{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5"
              >
                Create Team
              </button>
            </form>
          </div>

          {/* Teams List */}
          <div className={cn("p-6 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <div className="flex items-center gap-3 mb-6">
              <div className={cn("p-2 rounded-xl", isDarkMode ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-600")}>
                <Users className="w-5 h-5" />
              </div>
              <h2 className={cn("text-lg font-bold", isDarkMode ? "text-white" : "text-slate-900")}>Your Teams</h2>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {teams.length === 0 ? (
                <p className={cn("text-sm font-medium text-center py-4", isDarkMode ? "text-slate-500" : "text-slate-400")}>No teams created yet.</p>
              ) : (
                teams.map(team => (
                  <div 
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={cn("p-4 rounded-xl border transition-all duration-200 cursor-pointer relative group", 
                      selectedTeamId === team.id 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm" 
                        : isDarkMode ? "border-slate-700 hover:bg-slate-700/50" : "border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={cn("font-bold", isDarkMode ? "text-slate-200" : "text-slate-800")}>{team.name}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); if(selectedTeamId === team.id) setSelectedTeamId(null); }}
                        className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className={cn("text-xs font-semibold", isDarkMode ? "text-slate-400" : "text-slate-500")}>{team.lead}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {team.members.slice(0, 3).map(m => (
                        <span key={m} className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", 
                          isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white border text-slate-600"
                        )}>{m}</span>
                      ))}
                      {team.members.length > 3 && (
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold", 
                          isDarkMode ? "bg-slate-800 text-slate-300" : "bg-white border text-slate-600"
                        )}>+{team.members.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Forum */}
        <div className="lg:col-span-2 h-full flex flex-col">
          {selectedTeam ? (
            <div className="flex flex-col h-full space-y-6">
              {/* Team Header Info */}
              <div className={cn("p-6 rounded-3xl border shadow-sm flex items-center justify-between", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
                <div>
                  <h2 className={cn("text-2xl font-extrabold", isDarkMode ? "text-white" : "text-slate-900")}>{selectedTeam.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">
                      <Crown className="w-3.5 h-3.5" /> Lead: {selectedTeam.lead}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg">
                      <Users className="w-3.5 h-3.5" /> {selectedTeam.members.length} Members
                    </span>
                  </div>
                </div>
              </div>

              {/* Discussion Forum Component */}
              <DiscussionForum teamId={selectedTeam.id} />
            </div>
          ) : (
            <div className={cn("h-full min-h-[500px] flex flex-col items-center justify-center p-8 rounded-3xl border border-dashed", 
              isDarkMode ? "border-slate-700 bg-slate-800/20" : "border-slate-300 bg-slate-50/50"
            )}>
              <div className={cn("p-4 rounded-full mb-4", isDarkMode ? "bg-slate-800" : "bg-white shadow-sm")}>
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className={cn("text-lg font-bold mb-2", isDarkMode ? "text-white" : "text-slate-900")}>No Team Selected</h3>
              <p className={cn("text-sm font-medium text-center max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                Select a team from the list or create a new one to start collaborating and sharing files with your team members.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
