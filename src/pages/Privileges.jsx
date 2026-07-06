import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import {
  Shield, Settings, AlertCircle, CheckCircle2, ChevronRight, ChevronDown,
  Lock, Search, Save, Copy, GitCompare, FileText, Check, Sliders, ListFilter,
  Info, EyeOff, RefreshCw, X, FilePlus
} from 'lucide-react';
import { roleService } from '../services/roleService';
import { permissionService } from '../services/permissionService';

export default function Privileges() {
  const { isDarkMode, currentUser, permissionCodes = {} } = useStore();
  // Use dynamic permission code - allow access unless explicitly Denied or Hidden
  const pagePermission = permissionCodes['roleprivileges.page'] ?? 'Deny';
  const canAccess = pagePermission !== 'Deny' && pagePermission !== 'Hidden';

  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  // Dynamic mapped permission states
  const [mappedPermissions, setMappedPermissions] = useState([]); // Array of RolePermissionBo
  const [pendingChanges, setPendingChanges] = useState({}); // { "permissionId-actionId": value }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); // All, Allow, Deny, Read Only, Hidden
  const [expandedNodes, setExpandedNodes] = useState({}); // { "module-1": true, "page-2": true }

  // Modals / Panels
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetRoleId, setCloneTargetRoleId] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [compareRoleId, setCompareRoleId] = useState('');
  const [comparePermissions, setComparePermissions] = useState([]);

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Fetch roles, modules structure, and templates on load
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [rolesRes, modulesRes, templatesRes] = await Promise.all([
          roleService.getAllRoles().catch(() => []),
          permissionService.getModules().catch(() => ({ data: [] })),
          permissionService.getPermissionTemplates().catch(() => ({ data: [] }))
        ]);

        const rolesArr = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data || []);
        setRoles(rolesArr);

        const modulesArr = modulesRes?.data || [];
        setModules(modulesArr);

        const templatesArr = templatesRes?.data || [];
        setTemplates(templatesArr);

        if (rolesArr.length > 0) {
          setSelectedRoleId(String(rolesArr[0].roleId || rolesArr[0].id));
        }

        // Auto-expand first module
        if (modulesArr.length > 0) {
          setExpandedNodes({ [`module-${modulesArr[0].moduleId}`]: true });
        }
      } catch (error) {
        console.error("Setup data fetch failed", error);
        showNotification("Failed to load permission modules and roles", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch permissions for the selected role
  useEffect(() => {
    if (!selectedRoleId) return;
    const fetchRolePermissions = async () => {
      try {
        const res = await permissionService.getPrivilegesByRole(selectedRoleId);
        if (res?.isSuccess) {
          setMappedPermissions(res.data || []);
          setPendingChanges({});
        }
      } catch (error) {
        console.error("Failed fetching role permissions", error);
        showNotification("Error loading active role permissions", "error");
      }
    };

    fetchRolePermissions();
  }, [selectedRoleId]);

  // Fetch comparison role permissions
  useEffect(() => {
    if (!compareRoleId || !showComparePanel) return;
    const fetchComparePermissions = async () => {
      try {
        const res = await permissionService.getPrivilegesByRole(compareRoleId);
        if (res?.isSuccess) {
          setComparePermissions(res.data || []);
        }
      } catch (error) {
        showNotification("Failed to load comparison role details", "error");
      }
    };
    fetchComparePermissions();
  }, [compareRoleId, showComparePanel]);

  // Load audit logs when logs drawer is toggled
  useEffect(() => {
    if (!showLogsDrawer) return;
    const fetchLogs = async () => {
      try {
        const res = await permissionService.getPermissionLogs({ roleId: selectedRoleId });
        if (res?.isSuccess) {
          setAuditLogs(res.data || []);
        }
      } catch (error) {
        showNotification("Failed to retrieve audit trail logs", "error");
      }
    };
    fetchLogs();
  }, [showLogsDrawer, selectedRoleId]);

  // Node Toggle helpers
  const toggleNode = (nodeKey) => {
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const expandAll = () => {
    const nodes = {};
    modules.forEach(m => {
      nodes[`module-${m.moduleId}`] = true;
      m.pages?.forEach(p => {
        nodes[`page-${p.pageId}`] = true;
        p.sections?.forEach(s => {
          nodes[`section-${s.sectionId}`] = true;
        });
      });
    });
    setExpandedNodes(nodes);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // State modification logic
  const handleValueChange = (permissionId, actionId, value) => {
    const key = `${permissionId}-${actionId}`;
    setPendingChanges(prev => {
      const next = { ...prev, [key]: value };
      // If matches original state, clean it from pending changes
      const original = mappedPermissions.find(p => p.permissionId === permissionId && p.actionId === actionId);
      if (original && original.permissionValue === value) {
        delete next[key];
      }
      return next;
    });
  };

  // Sticky save trigger
  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setSaving(true);
    try {
      // Build a full merged payload: all existing permissions + any pending changes on top
      // This prevents the backend from soft-deleting unchanged permissions
      const allPermsMap = {};

      // Step 1: Start with all existing mapped permissions
      mappedPermissions.forEach(p => {
        const key = `${p.permissionId}`;
        allPermsMap[key] = { permissionId: p.permissionId, actionId: 1, permissionValue: p.permissionValue };
      });

      // Step 2: Seed all permissions from modules tree that don't yet have a DB record (default: Allow)
      modules.forEach(m => {
        m.pages?.forEach(p => {
          // Add Page permission to payload if it exists
          if (p.permissionId) {
            const pageKey = `${p.permissionId}`;
            if (!allPermsMap[pageKey]) {
              allPermsMap[pageKey] = { permissionId: p.permissionId, actionId: 1, permissionValue: 'Allow' };
            }
          }
          p.sections?.forEach(s => {
            s.components?.forEach(c => {
              const pId = c.permissionId; // Use ONLY real permissionId to prevent mismatched DB updates
              if (pId) {
                const key = `${pId}`;
                if (!allPermsMap[key]) {
                  allPermsMap[key] = { permissionId: pId, actionId: 1, permissionValue: 'Allow' };
                }
              }
            });
          });
        });
      });

      // Step 3: Apply pending changes on top (override only changed ones)
      Object.entries(pendingChanges).forEach(([key, value]) => {
        const [permissionId, actionId] = key.split('-').map(Number);
        const mapKey = `${permissionId}`;
        allPermsMap[mapKey] = { permissionId, actionId, permissionValue: value };
      });

      const permissionPayload = Object.values(allPermsMap);

      const res = await permissionService.saveRolePermissions({
        roleId: parseInt(selectedRoleId, 10),
        permissions: permissionPayload
      });

      if (res?.isSuccess) {
        showNotification("Dynamic privileges committed successfully!");
        // Re-load to sync UI
        const updatedPerms = await permissionService.getPrivilegesByRole(selectedRoleId);
        if (updatedPerms?.isSuccess) {
          setMappedPermissions(updatedPerms.data || []);
        }
        setPendingChanges({});
      } else {
        showNotification(res?.message || "Failed to commit privileges", "error");
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || "Server error while submitting permission configuration";
      showNotification(errMsg, "error");
      console.error("Save privileges error:", error);
    } finally {
      setSaving(false);
    }
  };

  // Clone action
  const handleCloneRole = async () => {
    if (!cloneTargetRoleId) return;
    try {
      const res = await permissionService.cloneRolePermissions({
        sourceRoleId: parseInt(selectedRoleId, 10),
        targetRoleId: parseInt(cloneTargetRoleId, 10)
      });
      if (res?.isSuccess) {
        showNotification("Role privileges cloned successfully!");
        setShowCloneModal(false);
      } else {
        showNotification(res?.message || "Error cloning configurations", "error");
      }
    } catch (error) {
      showNotification("Cloning transaction failed on server", "error");
    }
  };

  // Apply template action
  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) return;
    try {
      const res = await permissionService.applyPermissionTemplate({
        templateId: parseInt(selectedTemplateId, 10),
        roleId: parseInt(selectedRoleId, 10)
      });
      if (res?.isSuccess) {
        showNotification("Template applied successfully! Re-loading active role state...");
        const updatedPerms = await permissionService.getPrivilegesByRole(selectedRoleId);
        if (updatedPerms?.isSuccess) {
          setMappedPermissions(updatedPerms.data || []);
        }
        setShowTemplateModal(false);
      } else {
        showNotification(res?.message || "Failed to apply template", "error");
      }
    } catch (error) {
      showNotification("Action execution failed", "error");
    }
  };

  // Helper selectors
  const getPermissionValue = (permissionId) => {
    const key = `${permissionId}-1`;
    if (pendingChanges[key] !== undefined) {
      return pendingChanges[key];
    }
    const match = mappedPermissions.find(p => p.permissionId === permissionId);
    return match ? match.permissionValue : 'Allow';
  };

  const getCompareValue = (permissionId) => {
    const match = comparePermissions.find(p => p.permissionId === permissionId);
    return match ? match.permissionValue : 'Deny';
  };

    // Select all or Clear all under a Module/Page node
    const handleGroupToggle = (permissionIds, actionValue) => {
      setPendingChanges(prev => {
        const next = { ...prev };
        permissionIds.forEach(pId => {
          next[`${pId}-1`] = actionValue; // Set Allow / Deny / Read Only for actionId 1 (Primary)
        });
        return next;
      });
    };

    // Filter and search computation
    const filteredModules = modules.map(m => {
      const pageMatches = m.pages?.map(p => {
        const secMatches = p.sections?.map(s => {
          const compMatches = s.components?.filter(c => {
            const code = `${m.ModuleName}.${c.ComponentName}`;
            const isMatch = code.toLowerCase().includes(searchQuery.toLowerCase()) || c.displayName.toLowerCase().includes(searchQuery.toLowerCase());

            // Action type filter
            if (filterType !== 'All') {
              const currentVal = getPermissionValue(c.permissionId);
              return isMatch && currentVal === filterType;
            }
            return isMatch;
          }) || [];

          return { ...s, components: compMatches };
        }).filter(s => s.components.length > 0 || s.displayName.toLowerCase().includes(searchQuery.toLowerCase())) || [];

        return { ...p, sections: secMatches };
      }).filter(p => p.sections.length > 0 || p.displayName.toLowerCase().includes(searchQuery.toLowerCase())) || [];

      return { ...m, pages: pageMatches };
    }).filter(m => m.pages.length > 0 || m.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

    const getRoleName = (id) => {
      const roleObj = roles.find(r => String(r.roleId || r.id) === String(id));
      return roleObj ? (roleObj.roleName || roleObj.name) : 'Role';
    };

    const pendingCount = Object.keys(pendingChanges).length;

    if (!canAccess) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
          <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-pulse">
            <Shield className="w-12 h-12" />
          </div>
          <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Access Denied</h2>
          <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            Dynamic Enterprise Privileges management is restricted to authorized Administrators.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 relative pb-20 animate-[fadeIn_0.5s_ease-out]">
        {/* Toast Notification Banner */}
        {notification.show && (
          <div className={cn(
            "fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-[slideIn_0.3s_ease-out] border",
            notification.type === 'success'
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:bg-emerald-950/20"
              : "bg-rose-500/10 border-rose-500/20 text-rose-500 dark:bg-rose-950/20"
          )}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold">{notification.message}</span>
          </div>
        )}

        {/* Header Panel */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-100/50 dark:bg-slate-900/30 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/50">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-500">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className={cn("text-3xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
                  Dynamic Privilege Engine
                </h1>
                <p className={cn("text-xs font-semibold mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>
                  Redesigned Enterprise Access Trees. Fully dynamic node visibility and action assignments.
                </p>
              </div>
            </div>
          </div>

          {/* Action Widgets */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Role dropdown */}
            <div className={cn("px-4 py-2.5 rounded-xl border flex items-center gap-3 min-w-[200px] flex-1 xl:flex-initial",
              isDarkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-sm"
            )}>
              <Sliders className="w-4 h-4 text-indigo-500 shrink-0" />
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="bg-transparent border-none focus:ring-0 focus:outline-none w-full text-sm font-bold outline-none cursor-pointer"
              >
                {roles.map(role => (
                  <option key={role.roleId || role.id} value={String(role.roleId || role.id)} className="dark:bg-slate-800">
                    {role.roleName || role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComparePanel(!showComparePanel)}
                className={cn("p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300",
                  showComparePanel
                    ? "bg-indigo-600 text-white border-indigo-600 shadow"
                    : (isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm")
                )}
                title="Compare Role Permissions"
              >
                <GitCompare className="w-4 h-4" />
                <span>Compare</span>
              </button>

              <button
                onClick={() => setShowTemplateModal(true)}
                className={cn("p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300",
                  isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                )}
              >
                <FilePlus className="w-4 h-4 text-emerald-500" />
                <span>Apply Template</span>
              </button>

              <button
                onClick={() => setShowCloneModal(true)}
                className={cn("p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300",
                  isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                )}
              >
                <Copy className="w-4 h-4 text-blue-500" />
                <span>Clone Role</span>
              </button>

              <button
                onClick={() => setShowLogsDrawer(true)}
                className={cn("p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all duration-300",
                  isDarkMode ? "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                )}
              >
                <FileText className="w-4 h-4 text-purple-500" />
                <span>Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Role Comparison Widget */}
        {showComparePanel && (
          <div className={cn("p-5 rounded-3xl border animate-[fadeIn_0.3s_ease-out] flex flex-col md:flex-row items-center gap-4 justify-between",
            isDarkMode ? "bg-slate-900/50 border-slate-800 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800 shadow-sm"
          )}>
            <div className="flex items-center gap-3">
              <GitCompare className="w-8 h-8 text-indigo-500" />
              <div>
                <h3 className="font-bold text-sm">Role Comparison Mode Active</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Review permission conflicts side-by-side with another role profile.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Compare With:</span>
              <select
                value={compareRoleId}
                onChange={(e) => setCompareRoleId(e.target.value)}
                className={cn("px-4 py-2 rounded-xl border text-sm font-bold bg-white dark:bg-slate-800 outline-none",
                  isDarkMode ? "border-slate-700" : "border-slate-200"
                )}
              >
                <option value="">Select Role...</option>
                {roles.filter(r => String(r.roleId || r.id) !== String(selectedRoleId)).map(role => (
                  <option key={role.roleId || role.id} value={String(role.roleId || role.id)}>
                    {role.roleName || role.name}
                  </option>
                ))}
              </select>
              <button onClick={() => setShowComparePanel(false)} className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Interactive Permission Tree Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Side Pane: Tree filter control panel */}
          <div className="space-y-4 lg:col-span-1">
            <div className={cn("p-5 rounded-3xl border space-y-4",
              isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200 shadow-sm"
            )}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <ListFilter className="w-4 h-4 text-indigo-500" />
                <span>Tree Filter Controls</span>
              </div>

              {/* Realtime Permission Search */}
              <div className="relative">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn("w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-semibold outline-none",
                    isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                  )}
                />
              </div>

              {/* Filter by Privilege Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Privilege Status</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['All', 'Allow', 'Deny', 'Read Only', 'Hidden'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={cn("py-2 px-3 rounded-lg text-left text-xs font-bold transition-all",
                        filterType === type
                          ? "bg-indigo-600 text-white font-extrabold"
                          : (isDarkMode ? "bg-slate-900 hover:bg-slate-700 text-slate-300" : "bg-slate-50 hover:bg-slate-100 text-slate-600")
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accordion Expand actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={expandAll}
                  className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-900 hover:scale-[1.02] transition-transform"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-900 hover:scale-[1.02] transition-transform"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Quick Help Summary Cards */}
            <div className={cn("p-5 rounded-3xl border text-xs font-semibold leading-relaxed space-y-2.5",
              isDarkMode ? "bg-indigo-950/15 border-indigo-900/35 text-indigo-400" : "bg-indigo-50/30 border-indigo-100 text-indigo-600"
            )}>
              <div className="flex items-center gap-2 font-bold mb-1">
                <Info className="w-4 h-4 shrink-0" />
                <span>Permission States Guide</span>
              </div>
              <p>1. **Allow**: Full CRUD / Edit-Write permissions.</p>
              <p>2. **Read Only**: Renders input components as disabled but readable.</p>
              <p>3. **Hidden**: Prevents rendering of component/page completely.</p>
              <p>4. **Deny**: Standard access restricted flag (Blocks API).</p>
            </div>
          </div>

          {/* Center Pane: Interactive Dynamic Permissions Tree */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={cn("h-20 rounded-3xl animate-pulse", isDarkMode ? "bg-slate-800" : "bg-slate-100")} />
                ))}
              </div>
            ) : filteredModules.length === 0 ? (
              <div className={cn("p-12 text-center border rounded-[2rem]",
                isDarkMode ? "bg-slate-800/40 border-slate-700/50 text-slate-400" : "bg-white border-slate-200 text-slate-500 shadow-sm"
              )}>
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="font-bold text-lg">No Matching Nodes Found</h3>
                <p className="text-xs font-medium mt-1">Refine your search parameters or select a different role profile.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredModules.map(module => {
                  const moduleKey = `module-${module.moduleId}`;
                  const isModuleExpanded = expandedNodes[moduleKey];

                  // Get all child permission IDs for group selection
                  const allComponentIds = [];
                  module.pages?.forEach(p => p.sections?.forEach(s => s.components?.forEach(c => {
                    const pId = c.permissionId || c.componentId;
                    if (pId) allComponentIds.push(pId);
                  })));

                  return (
                    <div
                      key={moduleKey}
                      className={cn("rounded-3xl border overflow-hidden transition-all duration-300",
                        isDarkMode
                          ? (isModuleExpanded ? "bg-slate-800/20 border-slate-700" : "bg-slate-800/40 border-slate-700/30")
                          : (isModuleExpanded ? "bg-white border-slate-200 shadow-md" : "bg-white border-slate-200/50 shadow-sm")
                      )}
                    >
                      {/* Module Node Header */}
                      <div className={cn("px-6 py-4 flex items-center justify-between gap-4 cursor-pointer",
                        isDarkMode ? "bg-slate-800/40" : "bg-slate-50/50"
                      )} onClick={() => toggleNode(moduleKey)}>
                        <div className="flex items-center gap-3">
                          <div className="text-slate-400 transition-transform duration-300">
                            {isModuleExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className={cn("font-bold text-base", isDarkMode ? "text-white" : "text-slate-900")}>
                              {module.displayName}
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">MODULE NODE</span>
                          </div>
                        </div>

                        {/* Group toggle shortcuts */}
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleGroupToggle(allComponentIds, 'Allow')}
                            className="px-2.5 py-1 text-[10px] font-extrabold text-blue-500 bg-blue-500/10 hover:bg-blue-500/25 rounded-md"
                          >
                            All Allow
                          </button>
                          <button
                            onClick={() => handleGroupToggle(allComponentIds, 'Deny')}
                            className="px-2.5 py-1 text-[10px] font-extrabold text-rose-500 bg-rose-500/10 hover:bg-rose-500/25 rounded-md"
                          >
                            All Deny
                          </button>
                        </div>
                      </div>

                      {/* Pages Wrapper */}
                      {isModuleExpanded && (
                        <div className="divide-y divide-slate-100 dark:divide-slate-850 bg-transparent">
                          {module.pages?.map(page => {
                            const pageKey = `page-${page.pageId}`;
                            const isPageExpanded = expandedNodes[pageKey];

                            return (
                              <div key={pageKey} className="px-6 py-4">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                  <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleNode(pageKey)}>
                                    <div className="text-slate-400">
                                      {isPageExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                    <h4 className={cn("font-extrabold text-sm", isDarkMode ? "text-slate-200" : "text-slate-800")}>
                                      {page.displayName}
                                    </h4>
                                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide",
                                      isDarkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                                    )}>
                                      Page
                                    </span>
                                  </div>
                                  
                                  {/* Page Level Permission Dropdown */}
                                  {page.permissionId && (
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-semibold text-slate-400">Visibility:</span>
                                      <select
                                        value={getPermissionValue(page.permissionId)}
                                        onChange={(e) => handleValueChange(page.permissionId, 1, e.target.value)}
                                        className={cn("px-2.5 py-1 text-xs font-bold border rounded-lg outline-none transition-all cursor-pointer",
                                          getPermissionValue(page.permissionId) === 'Allow' ? "bg-blue-500/10 border-blue-500/30 text-blue-500" :
                                            getPermissionValue(page.permissionId) === 'Deny' ? "bg-rose-500/10 border-rose-500/30 text-rose-500" :
                                              getPermissionValue(page.permissionId) === 'Hidden' ? "bg-slate-500/10 border-slate-500/30 text-slate-500" :
                                                "bg-purple-500/10 border-purple-500/30 text-purple-500",
                                          pendingChanges[`${page.permissionId}-1`] !== undefined && "ring-2 ring-blue-500"
                                        )}
                                      >
                                        <option value="Allow">Allow</option>
                                        <option value="Deny">Deny</option>
                                        <option value="Hidden">Hidden</option>
                                      </select>
                                    </div>
                                  )}
                                </div>

                                {/* Sections and UI Components */}
                                {isPageExpanded && (
                                  <div className="pl-6 pr-2 py-2 space-y-4">
                                    {page.sections?.map(section => (
                                      <div key={section.sectionId} className="space-y-2">
                                        <h5 className="text-xs font-bold text-indigo-400 dark:text-indigo-500/80 tracking-wide uppercase">
                                          Section: {section.displayName}
                                        </h5>

                                        {/* UI Components Table */}
                                        <div className={cn("border rounded-2xl overflow-hidden shadow-sm",
                                          isDarkMode ? "border-slate-800 bg-slate-900/35" : "border-slate-100 bg-slate-50/20"
                                        )}>
                                          <table className="w-full text-left border-collapse">
                                            <thead>
                                              <tr className={cn("text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b",
                                                isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-150 bg-slate-100/40"
                                              )}>
                                                <th className="px-4 py-2">Component Name</th>
                                                <th className="px-4 py-2">Permission Code</th>
                                                <th className="px-4 py-2">Type</th>
                                                <th className="px-4 py-2 text-center w-[160px]">Action Value</th>
                                                {showComparePanel && <th className="px-4 py-2 text-center w-[120px] bg-indigo-500/5">{getRoleName(compareRoleId)}</th>}
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                              {section.components?.map(comp => {
                                                const pId = comp.permissionId; // Removed fallback to componentId to prevent DB FK errors
                                                const hasPermission = !!pId && pId !== 0;
                                                const value = hasPermission ? getPermissionValue(pId) : 'N/A';
                                                const hasChanged = hasPermission && pendingChanges[`${pId}-1`] !== undefined;
                                                const compareVal = hasPermission ? getCompareValue(pId) : 'N/A';

                                                return (
                                                  <tr key={comp.permissionId || comp.componentId} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/10 transition-colors">
                                                    <td className="px-4 py-3">
                                                      <span className={cn("text-xs font-bold", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                                                        {comp.displayName}
                                                      </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <code className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200/20 dark:border-slate-800">
                                                        {module.moduleName}.{comp.componentName}
                                                      </code>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                      <span className={cn("text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                                        comp.componentType === 'Button' ? "bg-amber-500/10 text-amber-500" :
                                                          comp.componentType === 'Field' ? "bg-blue-500/10 text-blue-500" :
                                                            "bg-purple-500/10 text-purple-500"
                                                      )}>
                                                        {comp.componentType}
                                                      </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                      <select
                                                        value={value}
                                                        disabled={!hasPermission}
                                                        onChange={(e) => hasPermission && handleValueChange(pId, 1, e.target.value)}
                                                        className={cn("px-2.5 py-1 text-xs font-bold border rounded-lg outline-none transition-all cursor-pointer",
                                                          !hasPermission ? "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" :
                                                            value === 'Allow' ? "bg-blue-500/10 border-blue-500/30 text-blue-500" :
                                                              value === 'Deny' ? "bg-rose-500/10 border-rose-500/30 text-rose-500" :
                                                                value === 'Read Only' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                                                                  "bg-purple-500/10 border-purple-500/30 text-purple-500",
                                                          hasChanged && "ring-2 ring-blue-500"
                                                        )}
                                                      >
                                                        {!hasPermission && <option value="N/A">Not Configured</option>}
                                                        <option value="Allow">Allow</option>
                                                        <option value="Deny">Deny</option>
                                                        <option value="Read Only">Read Only</option>
                                                        <option value="Hidden">Hidden</option>
                                                      </select>
                                                    </td>

                                                    {/* Side by side comparison column */}
                                                    {showComparePanel && (
                                                      <td className="px-4 py-3 text-center bg-indigo-500/5">
                                                        <span className={cn("text-xs font-extrabold px-2 py-1 rounded-lg",
                                                          compareVal === value ? "text-slate-400" : "text-amber-500 bg-amber-500/10"
                                                        )}>
                                                          {compareVal}
                                                        </span>
                                                      </td>
                                                    )}
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Sticky Save Dashboard (SAP-style) */}
        {pendingCount > 0 && (
          <div className={cn("fixed bottom-6 left-6 right-6 xl:left-80 z-30 p-4 rounded-2xl border shadow-2xl flex items-center justify-between gap-4 animate-[slideIn_0.3s_ease-out]",
            isDarkMode ? "bg-slate-900 border-slate-800 shadow-black/80" : "bg-white border-slate-200 shadow-indigo-500/10"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 animate-pulse">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                  You have {pendingCount} unsaved configuration modifications
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Changes will not take effect on user sessions until committed.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPendingChanges({})}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Reset Changes
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Commit Privileges</span>
              </button>
            </div>
          </div>
        )}

        {/* MODALS */}
        {/* 1. CLONE ROLE MODAL */}
        {showCloneModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={cn("w-full max-w-md p-6 rounded-[2rem] border shadow-2xl animate-[scaleIn_0.3s_ease-out]",
              isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Copy className="w-5 h-5 text-blue-500" />
                  Clone Role Mappings
                </h3>
                <button onClick={() => setShowCloneModal(false)} className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-850">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
                Copy all configured privileges from <span className="font-bold text-indigo-500">{getRoleName(selectedRoleId)}</span> to target role. This will overwrite any existing mapping on target role profile.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Target Role</label>
                  <select
                    value={cloneTargetRoleId}
                    onChange={(e) => setCloneTargetRoleId(e.target.value)}
                    className={cn("w-full p-3 rounded-xl border text-sm font-bold bg-transparent outline-none",
                      isDarkMode ? "border-slate-800" : "border-slate-200"
                    )}
                  >
                    <option value="" className="dark:bg-slate-800">Select Role...</option>
                    {roles.filter(r => String(r.roleId || r.id) !== String(selectedRoleId)).map(role => (
                      <option key={role.roleId || role.id} value={String(role.roleId || role.id)} className="dark:bg-slate-800">
                        {role.roleName || role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowCloneModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloneRole}
                    disabled={!cloneTargetRoleId}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow"
                  >
                    Clone Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. APPLY TEMPLATE MODAL */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className={cn("w-full max-w-md p-6 rounded-[2rem] border shadow-2xl animate-[scaleIn_0.3s_ease-out]",
              isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-900"
            )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-emerald-500" />
                  Apply Permission Template
                </h3>
                <button onClick={() => setShowTemplateModal(false)} className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-850">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 leading-relaxed">
                Load a pre-configured template blueprint. This will override current permissions for <span className="font-bold text-indigo-500">{getRoleName(selectedRoleId)}</span>.
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Select Template Blueprint</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className={cn("w-full p-3 rounded-xl border text-sm font-bold bg-transparent outline-none",
                      isDarkMode ? "border-slate-800" : "border-slate-200"
                    )}
                  >
                    <option value="" className="dark:bg-slate-800">Select Template...</option>
                    {templates.map(tpl => (
                      <option key={tpl.templateId} value={tpl.templateId} className="dark:bg-slate-800">
                        {tpl.templateName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyTemplate}
                    disabled={!selectedTemplateId}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow"
                  >
                    Apply Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. AUDIT LOGS SIDE DRAWER */}
        {showLogsDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowLogsDrawer(false)} />
            <div className={cn("relative w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between animate-[slideInRight_0.3s_ease-out]",
              isDarkMode ? "bg-slate-900 text-white" : "bg-white text-slate-900"
            )}>
              <div className="space-y-4 overflow-y-auto flex-1">
                <div className="flex items-center justify-between border-b pb-4 border-slate-200/50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-extrabold text-base">Permission Audit Logs</h3>
                  </div>
                  <button onClick={() => setShowLogsDrawer(false)} className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Info className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold">No logs found for this role profile.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.logId} className={cn("p-4 rounded-2xl border text-xs space-y-2",
                        isDarkMode ? "bg-slate-850 border-slate-800" : "bg-slate-50 border-slate-100"
                      )}>
                        <div className="flex items-center justify-between font-bold">
                          <span className={cn("px-2 py-0.5 rounded uppercase tracking-wider text-[8px]",
                            log.changeType === 'UPDATE' ? "bg-amber-500/10 text-amber-500" :
                              log.changeType === 'INSERT' ? "bg-emerald-500/10 text-emerald-500" :
                                "bg-rose-500/10 text-rose-500"
                          )}>
                            {log.changeType}
                          </span>
                          <span className="text-slate-400 font-semibold">{new Date(log.createdTime).toLocaleString()}</span>
                        </div>
                        <p className="font-semibold text-slate-500 dark:text-slate-400">
                          Operator: <span className="font-bold text-slate-700 dark:text-slate-200">{log.operatorName}</span>
                        </p>
                        <p className="font-semibold text-slate-500 dark:text-slate-400">
                          Code: <code className="font-mono text-[10px] text-indigo-500">{log.permissionCode}</code>
                        </p>
                        <p className="font-bold flex items-center gap-2">
                          {log.oldValue && <span className="text-rose-500 line-through">{log.oldValue}</span>}
                          {log.oldValue && <span className="text-slate-400">&rarr;</span>}
                          <span className="text-emerald-500">{log.newValue}</span>
                        </p>
                        {log.ipAddress && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">IP Address: {log.ipAddress}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4 border-slate-200/50 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowLogsDrawer(false)}
                  className="px-6 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
