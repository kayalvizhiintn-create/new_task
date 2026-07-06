import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';
import { ArrowLeft, Save, Briefcase, Users, Calendar, AlignLeft, Plus, Trash2, AlertCircle, Shield } from 'lucide-react';
import { SecureComponent } from '../components/SecureComponent';
import { usePermission } from '../hooks/usePermission';
import { taskService } from '../services/taskService';
import { categoryService } from '../services/categoryService';
import { developmentService } from '../services/developmentService';
import { supportService } from '../services/supportService';
import { hardwareOthersService } from '../services/hardwareOthersService';
import { enumService } from '../services/enumService';
import { employeeService } from '../services/employeeService';
import { projectService } from '../services/projectService';
import workflowService from '../services/workflowService';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { validateEmail, validateMobile } from '../utils/validation';
import SearchableSelect from '../components/SearchableSelect';

// Helper to extract id/name generically
const getItemId = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.employeeId || item.id || item.projectId || item.ProjectId || item._id || item.value || item.subcategoryId || item.subCategoryId || item.categoryId || item.taskId || item.roleId || item.priorityId || item.statusId || item.empId || JSON.stringify(item);
};

const getItemName = (item) => {
  if (!item) return '';
  if (typeof item !== 'object') return item;
  return item.employeeName || item.empName || item.name || item.projectName || item.ProjectName || item.title || item.value || item.categoryName || item.taskDesc || item.roleName || item.priorityName || item.statusName || item.subCategoryName || 'Unknown';
};

const ensureArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (typeof data === 'object') {
    // Fallback if data is a dictionary like {"Events": ["Sub"]}
    return Object.keys(data).map(k => ({ id: k, name: k, value: k }));
  }
  return [];
};

export default function TaskForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, currentUser, userPrivileges } = useStore();
  const { isReadOnly } = usePermission();
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'super admin';

  const isEditMode = Boolean(id);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);


  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddSubCategory, setShowAddSubCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [stageDeadlines, setStageDeadlines] = useState({});
  const [taskStages, setTaskStages] = useState([]);
  const [enabledStages, setEnabledStages] = useState({});
  const prevSubCategoryRef = useRef(null);

  const handleWorkflowTemplateChange = (e) => {
    const val = e && e.target ? e.target.value : e;
    setSelectedTemplateId(val);
    if (!val) {
      setSelectedWorkflowTemplate(null);
      setTaskStages([]);
      setStageDeadlines({});
      setEnabledStages({});
      return;
    }
    const template = workflowTemplates.find(t => String(t.templateId) === String(val));
    if (template) {
      setSelectedWorkflowTemplate(template);
      const stages = template.stages.map(stg => ({
        stageId: String(stg.stageId),
        stageName: stg.stageName,
        sequence: stg.sequence,
        defaultDeadlineDays: stg.defaultDeadlineDays
      }));
      setTaskStages(stages);

      const deadlines = {};
      const enabled = {};
      let baseDate = new Date();
      const sorted = [...template.stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      sorted.forEach(stg => {
        baseDate = new Date(baseDate.getTime() + stg.defaultDeadlineDays * 24 * 60 * 60 * 1000);
        deadlines[String(stg.stageId)] = baseDate.toISOString().split('T')[0];
        enabled[String(stg.stageId)] = true;
      });
      setStageDeadlines(deadlines);
      setEnabledStages(enabled);
    }
  };

  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const [newWorkflowStages, setNewWorkflowStages] = useState([
    { stageName: 'Planning', defaultDeadlineDays: 5, sequence: 1 },
    { stageName: 'Requirements Gathering', defaultDeadlineDays: 10, sequence: 2 },
    { stageName: 'Design', defaultDeadlineDays: 10, sequence: 3 },
    { stageName: 'Development', defaultDeadlineDays: 20, sequence: 4 },
    { stageName: 'Testing', defaultDeadlineDays: 10, sequence: 5 }
  ]);

  const handleAddWorkflowStageRow = () => {
    setNewWorkflowStages(prev => [
      ...prev,
      { stageName: '', defaultDeadlineDays: 5, sequence: prev.length + 1 }
    ]);
  };

  const handleRemoveWorkflowStageRow = (idx) => {
    setNewWorkflowStages(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((stg, i) => ({ ...stg, sequence: i + 1 }));
    });
  };

  const handleWorkflowStageRowChange = (idx, field, value) => {
    setNewWorkflowStages(prev => prev.map((stg, i) => {
      if (i === idx) {
        return {
          ...stg,
          [field]: field === 'defaultDeadlineDays' ? parseInt(value, 10) || 1 : value
        };
      }
      return stg;
    }));
  };

  const handleSaveNewWorkflowTemplate = async (e) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    try {
      const templatePayload = {
        templateId: 0,
        templateName: newWorkflowName.trim(),
        description: newWorkflowDesc.trim()
      };

      const res = await workflowService.createTemplate(templatePayload);
      if (res.isSuccess && res.data) {
        const newTemplateId = res.data.templateId;

        for (const stg of newWorkflowStages) {
          if (!stg.stageName.trim()) continue;
          await workflowService.createStage({
            stageId: 0,
            templateId: newTemplateId,
            stageName: stg.stageName.trim(),
            sequence: stg.sequence,
            defaultDeadlineDays: stg.defaultDeadlineDays
          });
        }

        const wfs = await workflowService.getAllTemplates();
        const templatesList = ensureArray(wfs);
        setWorkflowTemplates(templatesList);

        const newlyCreated = templatesList.find(t => t.templateId === newTemplateId);
        if (newlyCreated) {
          setSelectedTemplateId(String(newTemplateId));
          setSelectedWorkflowTemplate(newlyCreated);

          const deadlines = {};
          let baseDate = new Date();
          const sorted = [...newlyCreated.stages].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
          sorted.forEach(s => {
            baseDate = new Date(baseDate.getTime() + s.defaultDeadlineDays * 24 * 60 * 60 * 1000);
            deadlines[s.stageName] = baseDate.toISOString().split('T')[0];
          });
          setStageDeadlines(deadlines);
        }

        setShowAddWorkflow(false);
        setNewWorkflowName('');
        setNewWorkflowDesc('');
        setNewWorkflowStages([
          { stageName: 'Planning', defaultDeadlineDays: 5, sequence: 1 },
          { stageName: 'Requirements Gathering', defaultDeadlineDays: 10, sequence: 2 },
          { stageName: 'Design', defaultDeadlineDays: 10, sequence: 3 },
          { stageName: 'Development', defaultDeadlineDays: 20, sequence: 4 },
          { stageName: 'Testing', defaultDeadlineDays: 10, sequence: 5 }
        ]);

        Swal.fire('Success', 'Workflow template and stages created inline!', 'success');
      } else {
        Swal.fire('Error', res.message || 'Failed to create template', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to save workflow template inline', 'error');
    }
  };
  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors, isDirty } } = useForm();

  const { fields: extraMembers, append: appendMember, remove: removeMember } = useFieldArray({
    control,
    name: "visitorDetails.extraMembers"
  });

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoadingData(true);
      try {
        const [cats, devRes, supportRes, hwRes, pris, stats, emps, projs, wfs] = await Promise.all([
          categoryService.getAllCategories().catch(() => []),
          developmentService.getAll().catch(() => []),
          supportService.getAll().catch(() => []),
          hardwareOthersService.getAll().catch(() => []),
          enumService.getPriorityDropdown().catch(() => []),
          enumService.getStatusDropdown().catch(() => []),
          employeeService.getAllEmployees().catch(() => []),
          projectService.getAllProjects().catch(() => []),
          workflowService.getAllTemplates().catch(() => [])
        ]);

        const categoriesData = ensureArray(cats);
        const subCategoriesData = [
          ...ensureArray(devRes),
          ...ensureArray(supportRes),
          ...ensureArray(hwRes)
        ];
        const prioritiesData = ensureArray(pris);
        const statusesData = ensureArray(stats);
        const employeesData = ensureArray(emps);
        const projectsData = ensureArray(projs);
        const templatesData = ensureArray(wfs);

        setCategories(categoriesData);
        setSubCategories(subCategoriesData);
        setPriorities(prioritiesData);
        setStatuses(statusesData);
        setEmployees(employeesData);
        setProjects(projectsData);
        setWorkflowTemplates(templatesData);

        const loggedInUserId = currentUser?.employeeId || currentUser?.empId || currentUser?.id || '';

        // 2. Load task data if in edit mode
        if (isEditMode) {
          const res = await taskService.getTaskById(id);
          const task = Array.isArray(res?.data) ? res.data[0] : (Array.isArray(res) ? res[0] : (res?.data || res));
          if (task) {
            setTaskToEdit(task);
            if (task.stageDeadlines && Object.keys(task.stageDeadlines).length > 0) {
              const taskStageNames = Object.keys(task.stageDeadlines);
              const matchingTemplate = templatesData.find(tpl => {
                if (tpl.stages.length !== taskStageNames.length) return false;
                return tpl.stages.every(stg => taskStageNames.includes(stg.stageName));
              });
              if (matchingTemplate) {
                setSelectedTemplateId(String(matchingTemplate.templateId));
                setSelectedWorkflowTemplate(matchingTemplate);
                
                const loadedStages = matchingTemplate.stages.map(stg => ({
                  stageId: String(stg.stageId),
                  stageName: stg.stageName,
                  sequence: stg.sequence,
                  defaultDeadlineDays: stg.defaultDeadlineDays
                }));
                setTaskStages(loadedStages);

                const enabled = {};
                const deadlines = {};
                matchingTemplate.stages.forEach(stg => {
                  const hasDeadline = taskStageNames.includes(stg.stageName);
                  enabled[String(stg.stageId)] = hasDeadline;
                  deadlines[String(stg.stageId)] = task.stageDeadlines[stg.stageName] || '';
                });
                setEnabledStages(enabled);
                setStageDeadlines(deadlines);
              } else {
                const loadedStages = taskStageNames.map((name, i) => ({
                  stageId: `custom_${i}_${Date.now()}`,
                  stageName: name,
                  sequence: i + 1,
                  defaultDeadlineDays: 5,
                  isCustom: true
                }));
                setTaskStages(loadedStages);

                const enabled = {};
                const deadlines = {};
                loadedStages.forEach(stg => {
                  enabled[stg.stageId] = true;
                  deadlines[stg.stageId] = task.stageDeadlines[stg.stageName] || '';
                });
                setEnabledStages(enabled);
                setStageDeadlines(deadlines);
              }
            }
            const savedDraft = localStorage.getItem(`draftTaskForm_edit_${id}`);
            if (savedDraft) {
              try {
                const parsed = JSON.parse(savedDraft);
                reset(parsed);
                prevSubCategoryRef.current = String(parsed.subCategory || '');
              } catch (e) {
                console.error("Failed to parse draft edit form", e);
              }
            } else {
              const initValues = {
                title: task.taskDesc || '',
                category: task.categoryId !== undefined && task.categoryId !== null ? String(task.categoryId) : String(task.category || ''),
                subCategory: task.subCategoryId !== undefined && task.subCategoryId !== null ? String(task.subCategoryId) : String(task.subCategory || ''),
                assignedBy: task.assignBy !== undefined && task.assignBy !== null ? String(task.assignBy) : String(task.assignedBy || loggedInUserId),
                assignedTo: task.assignTo !== undefined && task.assignTo !== null ? String(task.assignTo) : String(task.assignedTo || ''),
                priority: task.priority !== undefined && task.priority !== null ? String(task.priority) : '',
                dueDate: task.dueDate || '',
                status: task.status !== undefined && task.status !== null ? String(task.status) : '2',
                description: task.notes || '',
                notes: task.notes || '',
                project: task.project || 'No Project',
                agent: task.agent || 'No Agent',
                referrerDetails: task.referrerDetails || {},
                meetingPersonDetails: task.meetingPersonDetails || {},
                visitorDetails: task.visitorDetails || { extraMembers: [] },
                visitDetails: task.visitDetails || {},
                visitorsDetails: task.visitorsDetails || {}
              };
              reset(initValues);
              prevSubCategoryRef.current = String(initValues.subCategory || '');
            }
          }
        } else {
          // New task mode
          const savedDraft = localStorage.getItem('draftTaskForm');
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              reset(parsed);
              prevSubCategoryRef.current = String(parsed.subCategory || '');
            } catch (e) {
              console.error("Failed to parse draft form", e);
            }
          } else {
            const initValues = {
              title: '',
              category: '',
              subCategory: '',
              assignedBy: String(loggedInUserId),
              assignedTo: '',
              priority: '',
              dueDate: '',
              status: '2',
              description: '',
              notes: '',
              project: 'No Project',
              agent: 'No Agent',
              referrerDetails: {},
              meetingPersonDetails: {},
              visitorDetails: { extraMembers: [] },
              visitDetails: {},
              visitorsDetails: {}
            };
            reset(initValues);
            prevSubCategoryRef.current = String(initValues.subCategory || '');
          }
        }
      } catch (error) {
        console.error("Error loading form data", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAllData();
  }, [isEditMode, id, currentUser, reset]);

  const formData = watch();

  useEffect(() => {
    if (!isLoadingData && isDirty && formData && Object.keys(formData).length > 0) {
      if (isEditMode && id) {
        localStorage.setItem(`draftTaskForm_edit_${id}`, JSON.stringify(formData));
      } else if (!isEditMode) {
        localStorage.setItem('draftTaskForm', JSON.stringify(formData));
      }
    }
  }, [formData, isEditMode, id, isDirty, isLoadingData]);

  const selectedCategory = watch('category');

  const selectedCategoryObj = categories.find(c => String(getItemId(c)) === String(selectedCategory));
  const categoryName = getItemName(selectedCategoryObj);

  const selectedSubCategoryVal = watch('subCategory');
  const selectedSubCategoryObj = subCategories.find(s => String(getItemId(s)) === String(selectedSubCategoryVal));
  const subCategoryName = getItemName(selectedSubCategoryObj);

  useEffect(() => {
    if (selectedSubCategoryVal && workflowTemplates.length > 0) {
      if (selectedSubCategoryVal !== prevSubCategoryRef.current) {
        prevSubCategoryRef.current = selectedSubCategoryVal;
        
        const subCatObj = subCategories.find(s => String(getItemId(s)) === String(selectedSubCategoryVal));
        const subCatName = subCatObj ? getItemName(subCatObj) : '';
        const catObj = categories.find(c => String(getItemId(c)) === String(selectedCategory));
        const catName = catObj ? getItemName(catObj) : '';

        let template = workflowTemplates.find(t => 
          t.subCategoryId && String(t.subCategoryId) === String(selectedSubCategoryVal)
        );
        if (!template) {
          template = workflowTemplates.find(t => 
            subCatName && (t.templateName || '').toLowerCase().trim() === subCatName.toLowerCase().trim()
          );
        }
        if (!template && catName) {
          template = workflowTemplates.find(t => 
            (t.templateName || '').toLowerCase().trim() === catName.toLowerCase().trim()
          );
        }

        if (template) {
          setSelectedTemplateId(String(template.templateId));
          setSelectedWorkflowTemplate(template);
          
          const stages = (template.stages || []).map(stg => ({
            stageId: String(stg.stageId),
            stageName: stg.stageName || '',
            sequence: stg.sequence,
            defaultDeadlineDays: stg.defaultDeadlineDays
          }));
          setTaskStages(stages);

          const deadlines = {};
          const enabled = {};
          let baseDate = new Date();
          const sorted = [...(template.stages || [])].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
          sorted.forEach(stg => {
            const days = stg.defaultDeadlineDays || 5;
            baseDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
            deadlines[String(stg.stageId)] = baseDate.toISOString().split('T')[0];
            enabled[String(stg.stageId)] = true;
          });
          setStageDeadlines(deadlines);
          setEnabledStages(enabled);
        } else {
          const defaultPredefinedStages = [
            { stageId: 'default_1', stageName: 'Planning', defaultDeadlineDays: 5, sequence: 1 },
            { stageId: 'default_2', stageName: 'Requirements Gathering', defaultDeadlineDays: 10, sequence: 2 },
            { stageId: 'default_3', stageName: 'Design', defaultDeadlineDays: 10, sequence: 3 },
            { stageId: 'default_4', stageName: 'Development', defaultDeadlineDays: 20, sequence: 4 },
            { stageId: 'default_5', stageName: 'Testing', defaultDeadlineDays: 10, sequence: 5 }
          ];

          setSelectedTemplateId('default_5_stages');
          setSelectedWorkflowTemplate({
            templateId: 'default_5_stages',
            templateName: 'Default 5 Stages Workflow',
            stages: defaultPredefinedStages
          });
          setTaskStages(defaultPredefinedStages);

          const deadlines = {};
          const enabled = {};
          let baseDate = new Date();
          defaultPredefinedStages.forEach(stg => {
            baseDate = new Date(baseDate.getTime() + stg.defaultDeadlineDays * 24 * 60 * 60 * 1000);
            deadlines[stg.stageId] = baseDate.toISOString().split('T')[0];
            enabled[stg.stageId] = true;
          });
          setStageDeadlines(deadlines);
          setEnabledStages(enabled);
        }
      }
    } else if (!selectedSubCategoryVal) {
      prevSubCategoryRef.current = null;
      setSelectedTemplateId('');
      setSelectedWorkflowTemplate(null);
      setTaskStages([]);
      setStageDeadlines({});
      setEnabledStages({});
    }
  }, [selectedSubCategoryVal, selectedCategory, workflowTemplates, subCategories, categories]);

  const handleAddTaskStage = () => {
    setTaskStages(prev => {
      const nextSeq = prev.length + 1;
      const newStage = {
        stageId: `custom_${Date.now()}`,
        stageName: '',
        sequence: nextSeq,
        defaultDeadlineDays: 5,
        isCustom: true
      };
      
      setEnabledStages(e => ({ ...e, [newStage.stageId]: true }));
      
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 5);
      setStageDeadlines(d => ({ ...d, [newStage.stageId]: targetDate.toISOString().split('T')[0] }));
      
      return [...prev, newStage];
    });
  };

  const handleTaskStageNameChange = (stageId, newName) => {
    setTaskStages(prev => prev.map(s => {
      if (s.stageId === stageId) {
        return { ...s, stageName: newName };
      }
      return s;
    }));
  };

  const isVisits = categoryName === 'Visits';
  const isInternalOrExternal = isVisits && (subCategoryName === 'Internal' || subCategoryName === 'External');
  const isVisitSub = categoryName === 'Support' && subCategoryName === 'Visits';

  const getAssignedByName = () => {
    if (isEditMode && taskToEdit) {
      const assignById = taskToEdit.assignBy || taskToEdit.assignedBy;
      const emp = employees.find(e => String(e.employeeId || e.id) === String(assignById));
      return emp ? (emp.employeeName || emp.name) : (taskToEdit.assignByName || taskToEdit.assignedBy || '');
    }
    return currentUser?.name || '';
  };



  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (newCategoryName.includes('_')) {
      Swal.fire({ title: 'Error', text: 'Underscores (_) are not allowed. Please use hyphens (-) instead.', icon: 'error' });
      return;
    }
    try {
      await categoryService.createCategory({ categoryId: 0, categoryName: newCategoryName.trim() });
      const cats = await categoryService.getAllCategories();
      setCategories(ensureArray(cats));
      setShowAddCategory(false);
      setNewCategoryName('');
      Swal.fire({ title: 'Success', text: 'Category added!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Failed to add category", error);
      Swal.fire({ title: 'Error', text: 'Failed to add category', icon: 'error' });
    }
  };

  const handleAddSubCategory = async () => {
    if (!newSubCategoryName.trim() || !selectedCategory) return;
    if (newSubCategoryName.includes('_')) {
      Swal.fire({ title: 'Error', text: 'Underscores (_) are not allowed. Please use hyphens (-) instead.', icon: 'error' });
      return;
    }
    const catId = parseInt(selectedCategory, 10);
    let service = hardwareOthersService;
    if (catId === 3 || catId === 8) service = developmentService;
    else if (catId === 5 || catId === 9) service = supportService;

    try {
      await service.create({
        subCategoryId: 0,
        categoryId: catId,
        subCategoryName: newSubCategoryName.trim()
      });
      const [devRes, supportRes, hwRes] = await Promise.all([
        developmentService.getAll().catch(() => []),
        supportService.getAll().catch(() => []),
        hardwareOthersService.getAll().catch(() => [])
      ]);
      const allSubs = [
        ...ensureArray(devRes),
        ...ensureArray(supportRes),
        ...ensureArray(hwRes)
      ];
      setSubCategories(allSubs);
      setShowAddSubCategory(false);
      setNewSubCategoryName('');
      Swal.fire({ title: 'Success', text: 'Sub Category added!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Failed to add subcategory", error);
      Swal.fire({ title: 'Error', text: 'Failed to add subcategory', icon: 'error' });
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;
    if (newProjectName.includes('_')) {
      Swal.fire({ title: 'Error', text: 'Underscores (_) are not allowed. Please use hyphens (-) instead.', icon: 'error' });
      return;
    }
    try {
      await projectService.createProject({
        projectId: 0,
        projectName: newProjectName.trim(),
        subCategoryId: parseInt(watch('subCategory'), 10) || 0
      });
      const projs = await projectService.getAllProjects();
      setProjects(ensureArray(projs));
      setShowAddProject(false);
      setNewProjectName('');
      Swal.fire({ title: 'Success', text: 'Project added!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error("Failed to add project", error);
      Swal.fire({ title: 'Error', text: 'Failed to add project', icon: 'error' });
    }
  };

  const onSubmit = async (data) => {
    setLoadingForm(true);
    try {
      const isCompletedStatus = String(data.status) === '6' || String(data.status).toLowerCase().trim() === 'completed';
      if (isCompletedStatus && data.dueDate) {
        const dueDate = new Date(data.dueDate);
        dueDate.setHours(23, 59, 59, 999);
        if (dueDate < new Date()) {
          Swal.fire({
            title: 'Overdue Project',
            text: 'This project/task has passed its due date and cannot be marked as Completed!',
            icon: 'error'
          });
          setLoadingForm(false);
          return;
        }
      }
      const payload = {
        taskId: isEditMode ? (parseInt(id, 10) || 0) : 0,
        taskUid: isEditMode ? taskToEdit.taskUid : "",
        categoryId: parseInt(data.category, 10) || 0,
        subCategoryId: parseInt(data.subCategory, 10) || 0,
        assignBy: parseInt(data.assignedBy, 10) || 0, // assuming assignBy is employee ID or 0
        assignTo: parseInt(data.assignedTo, 10) || 0,
        priority: parseInt(data.priority, 10) || 0,
        dueDate: data.dueDate,
        status: parseInt(data.status, 10) || 0,
        taskDesc: data.title?.trim(),
        notes: data.notes || data.description || "",
        project: data.project || 'No Project',
        stage: (() => {
          const activeStages = taskStages
            .filter(stg => enabledStages[stg.stageId] !== false && stg.stageName?.trim())
            .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
          const firstStage = activeStages[0]?.stageName || '';
          if (taskToEdit?.stage && activeStages.some(s => s.stageName === taskToEdit.stage)) {
            return taskToEdit.stage;
          }
          return firstStage;
        })(),
        stageDeadlines: (() => {
          const deadlines = {};
          taskStages.forEach(stg => {
            const isEnabled = enabledStages[stg.stageId] !== false;
            const name = stg.stageName?.trim();
            const date = stageDeadlines[stg.stageId];
            if (isEnabled && name && date) {
              deadlines[name] = date;
            }
          });
          return Object.keys(deadlines).length > 0 ? deadlines : null;
        })()
      };

      if (isVisitSub) {
        payload.visitDetails = {
          companyName: data.visitDetails?.companyName?.trim() || null,
          personToMeet: data.visitDetails?.personToMeet?.trim() || null,
          visitorAccompaniedBy: data.visitDetails?.visitorAccompaniedBy?.trim() || null,
          purposeOfVisit: data.visitDetails?.purposeOfVisit?.trim() || null
        };
        payload.visitorsDetails = {
          name: data.visitorsDetails?.name?.trim() || null,
          companyName: data.visitorsDetails?.companyName?.trim() || null,
          mobile: data.visitorsDetails?.mobile?.trim() || null,
          email: data.visitorsDetails?.email?.trim() || null,
          details: data.visitorsDetails?.details?.trim() || null
        };
      }

      if (isInternalOrExternal) {
        payload.referrerDetails = {
          type: subCategoryName,
          name: data.referrerDetails?.name,
          description: data.referrerDetails?.description || ""
        };
        payload.meetingPersonDetails = {
          name: data.meetingPersonDetails?.name,
          description: data.meetingPersonDetails?.description || ""
        };
        payload.visitorDetails = {
          expectedCount: data.visitorDetails?.expectedCount ? parseInt(data.visitorDetails.expectedCount, 10) : null,
          date: data.visitorDetails?.date,
          name: data.visitorDetails?.name?.trim() || null,
          email: data.visitorDetails?.email?.trim() || null,
          mobile: data.visitorDetails?.mobile?.trim() || null,
          company: data.visitorDetails?.company?.trim() || null,
          extraMembers: (data.visitorDetails?.extraMembers || []).map(m => ({
            name: m.name?.trim() || null,
            role: m.role?.trim() || null,
            company: m.company?.trim() || null,
            email: m.email?.trim() || null,
            mobile: m.mobile?.trim() || null
          }))
        };
      }

      if (isEditMode) {
        await taskService.updateTask(id, payload);
        localStorage.removeItem(`draftTaskForm_edit_${id}`);
        Swal.fire({
          title: 'Success!',
          text: 'Task updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await taskService.createTask(payload);
        localStorage.removeItem('draftTaskForm');
        Swal.fire({
          title: 'Success!',
          text: 'Task created successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
      navigate('/tasks');
    } catch (error) {
      console.error("Failed to save task", error);
      const errorMsg = error.response?.data?.message || error.message || "An error occurred while saving the task.";
      Swal.fire({
        title: 'Error Saving Task',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoadingForm(false);
    }
  };

  const inputClasses = cn(
    "w-full px-4 py-3.5 rounded-xl border outline-none transition-all duration-300 text-sm font-semibold",
    isDarkMode
      ? "bg-slate-900/50 border-slate-700 text-slate-100 focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10"
      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
  );

  const labelClasses = cn("block text-sm font-bold mb-2 tracking-wide", isDarkMode ? "text-slate-300" : "text-slate-700");

  const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-start gap-4 mb-8">
      <div className={cn("p-3.5 rounded-2xl", isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600")}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h2 className={cn("text-xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{title}</h2>
        <p className={cn("text-sm font-medium mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>{subtitle}</p>
      </div>
    </div>
  );

  const taskPermissions = userPrivileges['task list'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const newTaskPermissions = userPrivileges['new task'] || { canView: 0, canCreate: 0, canUpdate: 0, canDelete: 0 };
  const canAccess = isAdmin || (Object.keys(userPrivileges).length === 0) || (
    isEditMode ? taskPermissions.canUpdate === 1 : (taskPermissions.canCreate === 1 && newTaskPermissions.canCreate === 1 && newTaskPermissions.canView === 1)
  );

  // 30-minute edit window check for non-admins (when task data is loaded in edit mode)
  const isEditWindowExpired = (() => {
    if (!isEditMode || isAdmin || !taskToEdit) return false;
    const createdAt = taskToEdit.createdTime || taskToEdit.createdAt || taskToEdit.CreatedTime;
    if (!createdAt) return false;

    // Safely parse the ISO date to force UTC interpretation if no offset is present
    const parseUtcDate = (dateStr) => {
      if (!dateStr) return new Date();
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
        return new Date(dateStr + 'Z');
      }
      return new Date(dateStr);
    };

    const minutesSince = (Date.now() - parseUtcDate(createdAt).getTime()) / 60000;
    return minutesSince > 30;
  })();

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className={cn("text-sm font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Loading task details...</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4 animate-[pulse_2s_infinite]">
          <Shield className="w-12 h-12" />
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Access Denied</h2>
        <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          You do not have the required permissions to access this page. Please contact your system administrator.
        </p>
        <Link to="/tasks" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Task List
        </Link>
      </div>
    );
  }

  if (isEditWindowExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] animate-[fadeIn_0.5s_ease-out]">
        <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 mb-4">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className={cn("text-2xl font-bold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>Edit Window Expired</h2>
        <p className={cn("text-sm font-medium mt-2 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
          Tasks can only be edited within <span className="font-bold text-amber-500">30 minutes</span> of creation. This task is no longer editable. Please contact an Admin if changes are required.
        </p>
        <Link to="/tasks" className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 shadow-sm hover:shadow">
          Back to Task List
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4">
        <Link to="/tasks" className={cn("p-3 rounded-2xl transition-all duration-300 shadow-sm hover:-translate-y-0.5", isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700")}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className={cn("text-4xl font-extrabold tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>{isEditMode ? 'Edit Task' : 'Create New Task'}</h1>
          <p className={cn("mt-2 font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            {isEditMode ? `Updating task ${id}` : 'Provide comprehensive details for the new enterprise task.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* Core Details Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={Briefcase} title="Core Details" subtitle="Basic information and categorization." />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Task Title */}
            <SecureComponent code="newtask.title.input">
              <div>
                <label className={labelClasses}>Task Title <span className="text-rose-500">*</span></label>
                <input
                  {...register('title', {
                    required: 'Task title is required',
                    validate: value => !value.includes('_') || 'Underscores (_) are not allowed. Please use hyphens (-) instead.'
                  })}
                  disabled={isReadOnly('newtask.title.input')}
                  className={cn(inputClasses, errors.title && "border-rose-500", isReadOnly('newtask.title.input') && "opacity-60 cursor-not-allowed")}
                  placeholder="Enter a descriptive task title"
                />
                {errors.title && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.title.message}</p>}
              </div>
            </SecureComponent>

            {isEditMode && (
              <div>
                <label className={labelClasses}>Task UID</label>
                <input
                  type="text"
                  value={taskToEdit?.taskUid || ''}
                  readOnly
                  className={cn(inputClasses, "bg-slate-100/50 dark:bg-slate-900/30 cursor-not-allowed opacity-80")}
                />
              </div>
            )}

            {/* 2. Category */}
            <SecureComponent code="newtask.category.select">
              <div>
                <label className={cn("block text-sm font-bold tracking-wide mb-2", isDarkMode ? "text-slate-300" : "text-slate-700")}>Category <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <SearchableSelect
                    {...register('category', {
                      required: 'Category is required',
                      onChange: () => {
                        setValue('subCategory', '');
                        setValue('project', '');
                      }
                    })}
                    options={categories.map(cat => ({
                      value: String(getItemId(cat)),
                      label: getItemName(cat)
                    }))}
                    placeholder="Select Category"
                    isDarkMode={isDarkMode}
                    error={Boolean(errors.category)}
                    disabled={isReadOnly('newtask.category.select')}
                  />
                  <SecureComponent code="newtask.category.add">
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-200 z-10"
                      title="Add new category"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </SecureComponent>
                </div>
                {errors.category && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.category.message}</p>}
              </div>
            </SecureComponent>

            {/* 3. Sub Category */}
            <SecureComponent code="newtask.subcategory.select">
              <div>
                <label className={cn("block text-sm font-bold tracking-wide mb-2", isDarkMode ? "text-slate-300" : "text-slate-700")}>Sub Category <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <SearchableSelect
                    {...register('subCategory', {
                      required: 'Sub Category is required',
                      onChange: () => {
                        setValue('project', '');
                      }
                    })}
                    options={selectedCategory ? subCategories
                      .filter(sub => {
                        const subCatIdStr = String(sub.categoryId || sub.category_id || sub.category?.id || sub.category?._id || sub.category || '');
                        return subCatIdStr === String(selectedCategory);
                      })
                      .map(sub => ({
                        value: String(getItemId(sub)),
                        label: getItemName(sub)
                      })) : []}
                    placeholder="Select Sub Category"
                    disabled={!selectedCategory || isReadOnly('newtask.subcategory.select')}
                    isDarkMode={isDarkMode}
                    error={Boolean(errors.subCategory)}
                  />
                  <SecureComponent code="newtask.subcategory.add">
                    <button
                      type="button"
                      disabled={!selectedCategory}
                      onClick={() => setShowAddSubCategory(true)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none z-10"
                      title="Add new sub category"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </SecureComponent>
                </div>
                {errors.subCategory && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.subCategory.message}</p>}
              </div>
            </SecureComponent>

            {/* 4. Project Name */}
            <SecureComponent code="newtask.project.select">
              <div>
                <label className={labelClasses}>Project Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <SearchableSelect
                    {...register('project', { required: 'Project Name is required' })}
                    options={[
                      { value: "No Project", label: "No Project" },
                      ...projects
                        .filter(proj => !watch('subCategory') || String(proj.subCategoryId || proj.subCategory?.id || proj.subCategory_id) === String(watch('subCategory')))
                        .map(proj => ({ value: getItemName(proj), label: getItemName(proj) }))
                    ]}
                    placeholder="Select Project"
                    isDarkMode={isDarkMode}
                    error={Boolean(errors.project)}
                    disabled={!watch('subCategory') || isReadOnly('newtask.project.select')}
                  />
                  <SecureComponent code="newtask.project.add">
                    <button
                      type="button"
                      disabled={!watch('subCategory')}
                      onClick={() => setShowAddProject(true)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none z-10"
                      title="Add new project"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </SecureComponent>
                </div>
                {errors.project && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.project.message}</p>}
              </div>
            </SecureComponent>

            {/* 5. Created By */}
            <SecureComponent code="newtask.creator.input">
              <div>
                <label className={labelClasses}>Created By <span className="text-rose-500">*</span></label>
                <div className={cn(isReadOnly('newtask.creator.input') && "pointer-events-none opacity-60")}>
                  <SearchableSelect
                    {...register('assignedBy', { required: 'Created By is required' })}
                    options={employees.map(emp => ({
                      value: String(getItemId(emp)),
                      label: getItemName(emp)
                    }))}
                    placeholder="Select Creator"
                    isDarkMode={isDarkMode}
                    error={Boolean(errors.assignedBy)}
                  />
                </div>
                {errors.assignedBy && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.assignedBy.message}</p>}
              </div>
            </SecureComponent>

            {/* 6. Assigned To */}
            <SecureComponent code="newtask.assignee.select">
              <div>
                <label className={labelClasses}>Assigned To (Optional)</label>
                <div className={cn(isReadOnly('newtask.assignee.select') && "pointer-events-none opacity-60")}>
                  <SearchableSelect
                    {...register('assignedTo')}
                    options={employees.map(emp => {
                      const empId = String(getItemId(emp));
                      const loggedInId = String(currentUser?.employeeId || currentUser?.empId || currentUser?.id || '');
                      const isSelf = empId === loggedInId;
                      return {
                        value: empId,
                        label: `${getItemName(emp)}${isSelf ? ' (Self)' : ''}`
                      };
                    })}
                    placeholder="Select Assignee"
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </SecureComponent>

          </div>
        </div>

        {isInternalOrExternal && (
          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
            <SectionHeader icon={Briefcase} title="Reference & Meeting Details" subtitle="Who referred them, and who are they meeting?" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Referrer Details */}
              <div className="space-y-6">
                <h3 className={cn("text-lg font-bold border-b pb-3", isDarkMode ? "border-slate-700 text-slate-200" : "border-slate-200 text-slate-800")}>Referrer Details</h3>

                <div>
                  <label className={labelClasses}>Internal or External?</label>
                  <input
                    type="text"
                    value={subCategoryName === 'Internal' ? 'Internal Employee' : 'External'}
                    readOnly
                    className={cn(inputClasses, "bg-slate-100/50 dark:bg-slate-900/30 cursor-not-allowed opacity-80")}
                  />
                  <input type="hidden" {...register('referrerDetails.type')} value={subCategoryName} />
                </div>

                <div>
                  <label className={labelClasses}>Referrer Name <span className="text-rose-500">*</span></label>
                  {subCategoryName === 'Internal' ? (
                    <SearchableSelect
                      {...register('referrerDetails.name', { required: isInternalOrExternal })}
                      options={employees.map(emp => ({
                        value: getItemName(emp),
                        label: getItemName(emp)
                      }))}
                      placeholder="Select Employee..."
                      isDarkMode={isDarkMode}
                      error={Boolean(errors.referrerDetails?.name)}
                    />
                  ) : (
                    <input {...register('referrerDetails.name', { required: isInternalOrExternal })} className={cn(inputClasses, errors.referrerDetails?.name && "border-rose-500")} placeholder="Referrer Name" />
                  )}
                </div>

                <div>
                  <label className={labelClasses}>Description (Mobile, Email, Bio ID, Role, etc.)</label>
                  <textarea
                    {...register('referrerDetails.description')}
                    rows={4}
                    className={cn(inputClasses, "resize-y min-h-[100px] py-3")}
                    placeholder="Enter referrer details like Mobile, Email, Bio ID, Role, etc."
                  />
                </div>
              </div>

              {/* Referred To (Meeting Person) */}
              <div className="space-y-6">
                <h3 className={cn("text-lg font-bold border-b pb-3", isDarkMode ? "border-slate-700 text-slate-200" : "border-slate-200 text-slate-800")}>Referred To (Meeting Person)</h3>

                <div>
                  <label className={labelClasses}>Meeting With <span className="text-rose-500">*</span></label>
                  <SearchableSelect
                    {...register('meetingPersonDetails.name', { required: isInternalOrExternal })}
                    options={employees.map(emp => ({
                      value: getItemName(emp),
                      label: getItemName(emp)
                    }))}
                    placeholder="Select Employee..."
                    isDarkMode={isDarkMode}
                    error={Boolean(errors.meetingPersonDetails?.name)}
                  />
                </div>

                <div>
                  <label className={labelClasses}>Description (Mobile, Email, Bio ID, Role, etc.)</label>
                  <textarea
                    {...register('meetingPersonDetails.description')}
                    rows={4}
                    className={cn(inputClasses, "resize-y min-h-[100px] py-3")}
                    placeholder="Enter meeting person details like Mobile, Email, Bio ID, Role, etc."
                  />
                </div>
              </div>
            </div>

            {/* Visitor Details */}
            <div className="mt-12 pt-8 border-t dark:border-slate-700/50">
              <div className="flex items-center gap-4 mb-6">
                <div className={cn("p-3 rounded-2xl", isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600")}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={cn("text-lg font-bold", isDarkMode ? "text-slate-200" : "text-slate-800")}>Visitor Details</h3>
                  <p className={cn("text-xs font-medium mt-1", isDarkMode ? "text-slate-400" : "text-slate-500")}>Information about the visitor.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClasses}>Expected Persons Count</label>
                  <input type="number" {...register('visitorDetails.expectedCount')} className={inputClasses} placeholder="e.g. 5" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Name</label>
                  <input {...register('visitorDetails.name')} className={inputClasses} placeholder="Name (Optional if unknown)" />
                </div>
                <div>
                  <label className={labelClasses}>Visitor Email <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    {...register('visitorDetails.email', {
                      required: 'Visitor email is required',
                      validate: (val) => validateEmail(val)
                    })}
                    className={cn(inputClasses, errors.visitorDetails?.email && "border-rose-500")}
                    placeholder="e.g. name@domain.com"
                  />
                  {errors.visitorDetails?.email && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorDetails.email.message}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Visitor Mobile <span className="text-rose-500">*</span></label>
                  <input
                    {...register('visitorDetails.mobile', {
                      required: 'Visitor mobile number is required',
                      validate: (val) => validateMobile(val)
                    })}
                    className={cn(inputClasses, errors.visitorDetails?.mobile && "border-rose-500")}
                    placeholder="e.g. 9876543210"
                  />
                  {errors.visitorDetails?.mobile && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorDetails.mobile.message}</p>}
                </div>
                <div>
                  <label className={labelClasses}>Visitor Company</label>
                  <input {...register('visitorDetails.company')} className={inputClasses} placeholder="Company (Optional)" />
                </div>
                <div>
                  <label className={labelClasses}>Visit Date <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <DatePicker
                      selected={watch('visitorDetails.date') ? new Date(watch('visitorDetails.date')) : null}
                      onChange={(date) => {
                        setValue('visitorDetails.date', date ? date.toISOString().split('T')[0] : '', { shouldValidate: true });
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Select visit date"
                      className={cn(inputClasses, "cursor-pointer w-full", errors.visitorDetails?.date && "border-rose-500")}
                      wrapperClassName="w-full"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <input type="hidden" {...register('visitorDetails.date', { required: isInternalOrExternal })} />
                </div>
              </div>

              {/* Extra Members Array */}
              <div className="mt-8 pt-8 border-t dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={cn("text-lg font-bold", isDarkMode ? "text-slate-200" : "text-slate-800")}>Extra Members</h3>
                  <button type="button" onClick={() => appendMember({ name: '', role: '', company: '', email: '', mobile: '' })} className="px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-sm rounded-xl hover:bg-blue-200 dark:hover:bg-blue-500/30 transition flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Member
                  </button>
                </div>

                {extraMembers.length === 0 ? (
                  <p className="text-center text-sm font-medium text-slate-400 italic py-4">No extra members added.</p>
                ) : (
                  <div className="space-y-4">
                    {extraMembers.map((member, index) => (
                      <div key={member.id} className={cn("p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-start", isDarkMode ? "bg-slate-800/80 border-slate-700" : "bg-slate-50 border-slate-200")}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 flex-1 w-full">
                          <div className="w-full">
                            <input
                              {...register(`visitorDetails.extraMembers.${index}.name`, { required: 'Name is required' })}
                              placeholder="Name *"
                              className={cn(inputClasses, errors.visitorDetails?.extraMembers?.[index]?.name && "border-rose-500")}
                            />
                            {errors.visitorDetails?.extraMembers?.[index]?.name && <p className="text-rose-500 text-xs font-semibold mt-1">{errors.visitorDetails.extraMembers[index].name.message}</p>}
                          </div>
                          <div className="w-full">
                            <input {...register(`visitorDetails.extraMembers.${index}.role`)} placeholder="Role" className={inputClasses} />
                          </div>
                          <div className="w-full">
                            <input {...register(`visitorDetails.extraMembers.${index}.company`)} placeholder="Company" className={inputClasses} />
                          </div>
                          <div className="w-full">
                            <input
                              {...register(`visitorDetails.extraMembers.${index}.email`, {
                                required: 'Email is required',
                                validate: (val) => validateEmail(val)
                              })}
                              placeholder="Email *"
                              className={cn(inputClasses, errors.visitorDetails?.extraMembers?.[index]?.email && "border-rose-500")}
                            />
                            {errors.visitorDetails?.extraMembers?.[index]?.email && <p className="text-rose-500 text-xs font-semibold mt-1">{errors.visitorDetails.extraMembers[index].email.message}</p>}
                          </div>
                          <div className="w-full">
                            <input
                              {...register(`visitorDetails.extraMembers.${index}.mobile`, {
                                required: 'Mobile is required',
                                validate: (val) => validateMobile(val)
                              })}
                              placeholder="Mobile *"
                              className={cn(inputClasses, errors.visitorDetails?.extraMembers?.[index]?.mobile && "border-rose-500")}
                            />
                            {errors.visitorDetails?.extraMembers?.[index]?.mobile && <p className="text-rose-500 text-xs font-semibold mt-1">{errors.visitorDetails.extraMembers[index].mobile.message}</p>}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeMember(index)} className="p-3.5 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30 transition self-end md:self-auto shrink-0">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isVisitSub && (
          <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Visit Details */}
              <div className="space-y-6">
                <SectionHeader icon={Briefcase} title="Visit Details" subtitle="Information about the visit." />

                <div>
                  <label className={labelClasses}>Company Name <span className="text-rose-500">*</span></label>
                  <input
                    {...register('visitDetails.companyName', { required: 'Company name is required' })}
                    className={cn(inputClasses, errors.visitDetails?.companyName && "border-rose-500")}
                    placeholder="Enter company name"
                  />
                  {errors.visitDetails?.companyName && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitDetails.companyName.message}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Person to Meet <span className="text-rose-500">*</span></label>
                  <input
                    {...register('visitDetails.personToMeet', { required: 'Person to meet is required' })}
                    className={cn(inputClasses, errors.visitDetails?.personToMeet && "border-rose-500")}
                    placeholder="Enter person to meet"
                  />
                  {errors.visitDetails?.personToMeet && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitDetails.personToMeet.message}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Visitor Accompanied By (or Person Accompanied)</label>
                  <textarea
                    {...register('visitDetails.visitorAccompaniedBy')}
                    rows={4}
                    className={cn(inputClasses, "resize-y min-h-[100px] py-3")}
                    placeholder="Enter accompanied person details..."
                  />
                </div>

                <div>
                  <label className={labelClasses}>Purpose of Visit</label>
                  <textarea
                    {...register('visitDetails.purposeOfVisit')}
                    rows={4}
                    className={cn(inputClasses, "resize-y min-h-[100px] py-3")}
                    placeholder="Enter purpose of visit..."
                  />
                </div>
              </div>

              {/* Visitors Details */}
              <div className="space-y-6">
                <SectionHeader icon={Users} title="Visitors Details" subtitle="Information about the visitors." />

                <div>
                  <label className={labelClasses}>Name <span className="text-rose-500">*</span></label>
                  <input
                    {...register('visitorsDetails.name', { required: 'Visitor name is required' })}
                    className={cn(inputClasses, errors.visitorsDetails?.name && "border-rose-500")}
                    placeholder="Enter visitor name"
                  />
                  {errors.visitorsDetails?.name && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorsDetails.name.message}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Company Name <span className="text-rose-500">*</span></label>
                  <input
                    {...register('visitorsDetails.companyName', { required: 'Visitor company name is required' })}
                    className={cn(inputClasses, errors.visitorsDetails?.companyName && "border-rose-500")}
                    placeholder="Enter visitor company name"
                  />
                  {errors.visitorsDetails?.companyName && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorsDetails.companyName.message}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Mobile <span className="text-rose-500">*</span></label>
                  <input
                    {...register('visitorsDetails.mobile', {
                      required: 'Visitor mobile number is required',
                      validate: (val) => validateMobile(val)
                    })}
                    className={cn(inputClasses, errors.visitorsDetails?.mobile && "border-rose-500")}
                    placeholder="e.g. 9876543210"
                  />
                  {errors.visitorsDetails?.mobile && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorsDetails.mobile.message}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Email <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    {...register('visitorsDetails.email', {
                      required: 'Visitor email is required',
                      validate: (val) => validateEmail(val)
                    })}
                    className={cn(inputClasses, errors.visitorsDetails?.email && "border-rose-500")}
                    placeholder="e.g. name@domain.com"
                  />
                  {errors.visitorsDetails?.email && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.visitorsDetails.email.message}</p>}
                </div>

                <div>
                  <label className={labelClasses}>Details</label>
                  <textarea
                    {...register('visitorsDetails.details')}
                    rows={4}
                    className={cn(inputClasses, "resize-y min-h-[100px] py-3")}
                    placeholder="Enter additional visitor details..."
                  />
                </div>
              </div>
            </div>

          </div>
        )

        }


        {/* Scheduling & Status Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={Calendar} title="Scheduling & Status" subtitle="Priority, deadlines and progress tracking." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SecureComponent code="newtask.priority.select">
              <div>
                <label className={labelClasses}>Priority</label>
                <div className={cn(isReadOnly('newtask.priority.select') && "pointer-events-none opacity-60")}>
                  <SearchableSelect
                    {...register('priority')}
                    options={priorities.map(p => ({
                      value: String(getItemId(p)),
                      label: getItemName(p)
                    }))}
                    placeholder="Select Priority"
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </SecureComponent>

            <div>
              <label className={labelClasses}>Due Date <span className="text-rose-500">*</span></label>
              <div className="relative">
                <DatePicker
                  selected={watch('dueDate') ? new Date(watch('dueDate')) : null}
                  onChange={(date) => {
                    if (!date) { setValue('dueDate', '', { shouldValidate: true }); return; }
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    if (date < today) {
                      Swal.fire({
                        title: 'Are you sure?',
                        text: 'You have selected a past date. Do you want to proceed?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, proceed!'
                      }).then((res) => {
                        if (res.isConfirmed) {
                          setValue('dueDate', date.toISOString().split('T')[0], { shouldValidate: true });
                        }
                      });
                    } else {
                      setValue('dueDate', date.toISOString().split('T')[0], { shouldValidate: true });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select due date"
                  className={cn(inputClasses, "cursor-pointer w-full", errors.dueDate && "border-rose-500")}
                  wrapperClassName="w-full"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  calendarClassName={isDarkMode ? "dark-datepicker" : ""}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <input type="hidden" {...register('dueDate', { required: 'Due Date is mandatory' })} />
              {errors.dueDate && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.dueDate.message}</p>}
            </div>

            <div>
              <label className={labelClasses}>Status</label>
              <input
                type="text"
                value={isEditMode && taskToEdit ? (taskToEdit.statusName || taskToEdit.status || 'New Task') : 'New Task'}
                readOnly
                className={cn(inputClasses, "bg-slate-100/50 dark:bg-slate-900/30 cursor-not-allowed opacity-80")}
              />
              <input
                type="hidden"
                {...register('status')}
              />
            </div>
          </div>
        </div>

        {/* Workflow Timeline Setup Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={Calendar} title="Workflow Timeline Setup (Optional)" subtitle="Associate a sequential process workflow template with this task." />

          <div className="space-y-6">
            {taskStages.length > 0 && (
              <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-extrabold text-sm uppercase tracking-wide text-slate-400">
                    Configure Stage Target Deadlines
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddTaskStage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stage
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {taskStages.map((stg, index) => {
                    const isEnabled = enabledStages[stg.stageId] !== false;
                    return (
                      <div
                        key={stg.stageId}
                        className={cn("p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-200",
                          isEnabled
                            ? (isDarkMode ? "bg-slate-900/30 border-slate-700/50" : "bg-slate-50 border-slate-200")
                            : "opacity-45 bg-slate-100/50 border-dashed dark:bg-slate-900/10"
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => {
                              setEnabledStages(prev => ({
                                ...prev,
                                [stg.stageId]: e.target.checked
                              }));
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-500/10 text-blue-500 rounded uppercase">
                                Seq {stg.sequence}
                              </span>
                              {stg.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTaskStages(prev => prev.filter(s => s.stageId !== stg.stageId));
                                    setEnabledStages(prev => {
                                      const next = { ...prev };
                                      delete next[stg.stageId];
                                      return next;
                                    });
                                    setStageDeadlines(prev => {
                                      const next = { ...prev };
                                      delete next[stg.stageId];
                                      return next;
                                    });
                                  }}
                                  className="text-rose-500 hover:text-rose-600 p-0.5"
                                  title="Remove custom stage"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {stg.isCustom ? (
                              <input
                                type="text"
                                value={stg.stageName}
                                onChange={(e) => handleTaskStageNameChange(stg.stageId, e.target.value)}
                                placeholder="Stage Name (e.g. Support)"
                                className={cn(inputClasses, "py-1 px-2 text-xs mt-1")}
                                required={isEnabled}
                                disabled={!isEnabled}
                              />
                            ) : (
                              <h5 className="font-bold text-sm mt-1">{stg.stageName}</h5>
                            )}
                          </div>
                        </div>

                        <div className="w-44">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Date</label>
                          <input
                            type="date"
                            value={stageDeadlines[stg.stageId] || ''}
                            onChange={(e) => {
                              setStageDeadlines(prev => ({
                                ...prev,
                                [stg.stageId]: e.target.value
                              }));
                            }}
                            className={cn(inputClasses, "py-2 px-3 text-xs")}
                            required={isEnabled}
                            disabled={!isEnabled}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Details Section */}
        <div className={cn("p-8 rounded-3xl border shadow-sm transition-all duration-300", isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200")}>
          <SectionHeader icon={AlignLeft} title="Additional Details" subtitle="Detailed descriptions and internal notes." />

          <div className="space-y-8">
            <SecureComponent code="newtask.description.input">
              <div>
                <label className={labelClasses}>Task Description</label>
                <textarea
                  {...register('description', {
                    validate: value => !value || !value.includes('_') || 'Underscores (_) are not allowed. Please use hyphens (-) instead.'
                  })}
                  rows="4"
                  disabled={isReadOnly('newtask.description.input')}
                  className={cn(inputClasses, "resize-y", errors.description && "border-rose-500", isReadOnly('newtask.description.input') && "opacity-60 cursor-not-allowed")}
                  placeholder="Provide a detailed description of the task..."
                />
                {errors.description && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.description.message}</p>}
              </div>
            </SecureComponent>

            <SecureComponent code="newtask.notes.input">
              <div>
                <label className={labelClasses}>Notes / Additional Context</label>
                <textarea
                  {...register('notes', {
                    validate: value => !value || !value.includes('_') || 'Underscores (_) are not allowed. Please use hyphens (-) instead.'
                  })}
                  rows="2"
                  disabled={isReadOnly('newtask.notes.input')}
                  className={cn(inputClasses, "resize-y", errors.notes && "border-rose-500", isReadOnly('newtask.notes.input') && "opacity-60 cursor-not-allowed")}
                  placeholder="Any internal notes, links, or context..."
                />
                {errors.notes && <p className="text-rose-500 text-sm font-semibold mt-2">{errors.notes.message}</p>}
              </div>
            </SecureComponent>
          </div>
        </div>

        {/* Form Actions */}
        <div className={cn("flex items-center justify-end gap-4 mt-8 p-6 rounded-3xl border shadow-sm",
          isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-white border-slate-200"
        )}>
          <SecureComponent code="newtask.cancel">
            <button
              type="button"
              onClick={() => {
                if (!isEditMode) localStorage.removeItem('draftTaskForm');
                navigate('/tasks');
              }}
              className={cn("px-8 py-3.5 rounded-xl font-bold transition-all duration-300 border",
                isDarkMode ? "bg-slate-800/50 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
              )}
            >
              Cancel
            </button>
          </SecureComponent>
          <SecureComponent code="newtask.submit">
            <button
              type="submit"
              disabled={loadingForm}
              className="flex items-center gap-2 px-10 py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> {loadingForm ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Task')}
            </button>
          </SecureComponent>
        </div>

      </form>

      {/* Modals for Quick Add */}
      {showAddCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn("p-6 rounded-2xl w-full max-w-sm shadow-xl", isDarkMode ? "bg-slate-800" : "bg-white")}>
            <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-white" : "text-slate-900")}>Add New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name"
              className={cn(inputClasses, "mb-6")}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className={cn("px-4 py-2 font-bold rounded-lg transition-colors", isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100")}>Cancel</button>
              <button type="button" onClick={handleAddCategory} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        </div>
      )}

      {showAddSubCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn("p-6 rounded-2xl w-full max-w-sm shadow-xl", isDarkMode ? "bg-slate-800" : "bg-white")}>
            <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-white" : "text-slate-900")}>Add New Sub Category</h3>
            <input
              type="text"
              value={newSubCategoryName}
              onChange={(e) => setNewSubCategoryName(e.target.value)}
              placeholder="Sub Category Name"
              className={cn(inputClasses, "mb-6")}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddSubCategory(false); setNewSubCategoryName(''); }} className={cn("px-4 py-2 font-bold rounded-lg transition-colors", isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100")}>Cancel</button>
              <button type="button" onClick={handleAddSubCategory} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        </div>
      )}

      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn("p-6 rounded-2xl w-full max-w-sm shadow-xl", isDarkMode ? "bg-slate-800" : "bg-white")}>
            <h3 className={cn("text-lg font-bold mb-4", isDarkMode ? "text-white" : "text-slate-900")}>Add New Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name"
              className={cn(inputClasses, "mb-6")}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddProject(false); setNewProjectName(''); }} className={cn("px-4 py-2 font-bold rounded-lg transition-colors", isDarkMode ? "text-slate-300 hover:bg-slate-700" : "text-slate-600 hover:bg-slate-100")}>Cancel</button>
              <button type="button" onClick={handleAddProject} className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Add</button>
            </div>
          </div>
        </div>
      )}
      {showAddWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300 animate-[fadeIn_0.2s_ease-out]">
          <div className={cn("p-8 rounded-3xl w-full max-w-2xl shadow-2xl border transition-all duration-300 transform scale-100",
            isDarkMode ? "bg-slate-900 border-slate-700/60 text-white" : "bg-white border-slate-200 text-slate-800"
          )}>
            <div className="flex items-center justify-between mb-6 border-b dark:border-slate-800 pb-4">
              <h3 className="text-xl font-extrabold tracking-tight">Create Custom Workflow Template</h3>
              <button
                type="button"
                onClick={() => setShowAddWorkflow(false)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNewWorkflowTemplate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Template Name *</label>
                  <input
                    type="text"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    placeholder="e.g. Agile Software Delivery"
                    className={inputClasses}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Description</label>
                  <input
                    type="text"
                    value={newWorkflowDesc}
                    onChange={(e) => setNewWorkflowDesc(e.target.value)}
                    placeholder="Brief description of process phases"
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Stages List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400">Stages Sequence</h4>
                  <button
                    type="button"
                    onClick={handleAddWorkflowStageRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 active:scale-95 transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stage
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin dark:scrollbar-thumb-slate-800">
                  {newWorkflowStages.map((stg, index) => (
                    <div
                      key={index}
                      className={cn("p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-4",
                        isDarkMode ? "bg-slate-800/40 border-slate-700/50" : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-extrabold text-xs">
                          {stg.sequence}
                        </span>
                      </div>

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={stg.stageName}
                          onChange={(e) => handleWorkflowStageRowChange(index, 'stageName', e.target.value)}
                          placeholder="Stage Name (e.g. Planning)"
                          className={cn(inputClasses, "py-2 px-3 text-sm")}
                          required
                        />
                      </div>

                      <div className="w-full md:w-36">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="1"
                            value={stg.defaultDeadlineDays}
                            onChange={(e) => handleWorkflowStageRowChange(index, 'defaultDeadlineDays', e.target.value)}
                            placeholder="Days"
                            className={cn(inputClasses, "py-2 px-3 text-sm pr-12")}
                            required
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-400">days</span>
                        </div>
                      </div>

                      {newWorkflowStages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkflowStageRow(index)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                          title="Remove stage row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t dark:border-slate-800 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddWorkflow(false)}
                  className={cn("px-6 py-2.5 font-bold rounded-xl transition-all",
                    isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
