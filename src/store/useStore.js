import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

// Initial Mock Data
const INITIAL_TASKS = [
  {
    id: 'TSK-20260610-0001',
    reference: 'ENQ-2026-001',
    title: 'Setup Event Booth',
    category: 'Events',
    subCategory: 'Promotions',
    assignedBy: 'Karthik',
    assignedTo: 'Priya',
    priority: 'High',
    dueDate: '2026-06-20',
    status: 'In Progress',
    description: 'Setup the promotional booth for the upcoming tech expo.',
    createdAt: '2026-06-10T10:00:00Z',
  },
  {
    id: 'TSK-20260611-0001',
    reference: 'ENQ-2026-002',
    title: 'Develop Landing Page',
    category: 'Development',
    subCategory: 'Software Development',
    assignedBy: 'Priya',
    assignedTo: 'Karthik',
    priority: 'Critical',
    dueDate: '2026-06-16',
    status: 'New Task',
    description: 'Create responsive landing page for new campaign.',
    createdAt: '2026-06-11T14:30:00Z',
  },
  {
    id: 'TSK-20260612-0001',
    reference: 'ENQ-2026-003',
    title: 'Fix Login Issue',
    category: 'Support',
    subCategory: 'Technical Support',
    assignedBy: 'Karthik',
    assignedTo: 'Surya',
    priority: 'Medium',
    dueDate: '2026-06-14',
    status: 'Completed',
    description: 'Resolve SSO login loop issue reported by clients.',
    createdAt: '2026-06-12T09:15:00Z',
  },
  {
    id: 'TSK-20260613-0001',
    reference: 'ENQ-2026-004',
    title: 'Order new Laptops',
    category: 'Hardware Sales',
    subCategory: 'Laptop',
    assignedBy: 'Priya',
    assignedTo: 'Divya',
    priority: 'Low',
    dueDate: '2026-06-25',
    status: 'Pending',
    description: 'Order 5 new Dell XPS laptops for the engineering team.',
    createdAt: '2026-06-13T16:45:00Z',
  },
  {
    id: 'TSK-20260614-0001',
    reference: 'ENQ-2026-005',
    title: 'Configure Zoho CRM',
    category: 'Zoho',
    subCategory: 'Zoho CRM',
    assignedBy: 'Karthik',
    assignedTo: 'Arun',
    priority: 'High',
    dueDate: '2026-06-15',
    status: 'New Task', // Changed from Overdue for valid status checking
    description: 'Set up pipelines and custom fields in Zoho CRM.',
    createdAt: '2026-06-14T11:20:00Z',
  }
];

const INITIAL_EMPLOYEES = [
  {
    id: 'EMP-001',
    name: 'KayalVizhi',
    email: 'kayal@gmail.com',
    bioId: '20250744',
    password: '12345678',
    place: 'Onsite',
    role: 'Admin',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'EMP-002',
    name: 'Diya',
    email: 'diya@gmail.com',
    bioId: '20250745',
    password: '12345678',
    place: 'Remote',
    role: 'Developer',
    createdAt: '2026-06-05T09:30:00Z',
  }
];

const INITIAL_CATEGORIES = {
  'Events': ['Purchase', 'Promotions'],
  'Development': ['Software Development', 'Hardware Development', 'IoT Development'],
  'Support': ['Technical Support', 'Customer Support'],
  'Hardware Sales': ['Desktop', 'Laptop', 'Printer', 'Networking'],
  'Purchase': ['Office Purchase', 'Project Purchase'],
  'Zoho': ['Zoho CRM', 'Zoho Books', 'Zoho Creator', 'Zoho Desk'],
  'Visits': ['Internal', 'External']
};

const INITIAL_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const INITIAL_STATUSES = ['New Task', 'In Progress', 'Pending', 'On-hold', 'Completed', 'Cancelled'];
const INITIAL_ROLES = ['Admin', 'Super Admin', 'Manager', 'Developer', 'Support', 'Sales', 'Operations'];
const INITIAL_PLACES = ['Onsite', 'Remote'];
export const INITIAL_DASHBOARD_METRICS = ['New Task', 'In Progress', 'On-hold', 'Overdue', 'Today created', "Today's task", 'Total'];
export const INITIAL_STAGES = ['Requirements', 'Design', 'Development', 'Testing', 'Deployment', 'Maintenance'];

const INITIAL_TEAMS = [
  {
    id: 'TEAM-001',
    name: 'Alpha Squad',
    lead: 'Karthik',
    members: ['Priya', 'Surya'],
    createdAt: '2026-06-01T10:00:00Z'
  }
];

const INITIAL_DISCUSSIONS = [
  {
    id: 'MSG-001',
    teamId: 'TEAM-001',
    sender: 'Karthik',
    text: 'Welcome to the Alpha Squad discussion forum!',
    mentions: ['Priya', 'Surya'],
    attachments: [],
    timestamp: '2026-06-01T10:05:00Z'
  }
];

export const useStore = create(
  persist(
    (set, get) => ({
  tasks: INITIAL_TASKS,
  employees: INITIAL_EMPLOYEES,
  categories: INITIAL_CATEGORIES,
  priorities: INITIAL_PRIORITIES,
  statuses: INITIAL_STATUSES,
  roles: INITIAL_ROLES,
  places: INITIAL_PLACES,
  dashboardMetrics: INITIAL_DASHBOARD_METRICS,
  teams: INITIAL_TEAMS,
  discussions: INITIAL_DISCUSSIONS,
  isAuthenticated: false,
  currentUser: null,
  userPrivileges: {},
  setUserPrivileges: (privileges) => set({ userPrivileges: privileges }),
  login: (bioId, password) => {
    const { employees } = get();
    const user = employees.find(e => e.bioId === bioId && e.password === password);
    if (user) {
      set({ isAuthenticated: true, currentUser: user });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false, currentUser: null, userPrivileges: {} }),
  isDarkMode: false,
  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode;
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { isDarkMode: newMode };
  }),
  
  addTask: (taskData) => {
    set((state) => {
      // Generate UID logic
      const today = new Date();
      const dateString = format(today, 'yyyyMMdd');
      
      // Find today's tasks to increment counter
      const todaysTasks = state.tasks.filter(t => t.id && t.id.startsWith(`TSK-${dateString}`));
      let maxSequence = 0;
      
      todaysTasks.forEach(t => {
        const parts = t.id.split('-');
        if (parts.length === 3) {
          const seq = parseInt(parts[2], 10);
          if (seq > maxSequence) maxSequence = seq;
        }
      });
      
      const nextSequence = String(maxSequence + 1).padStart(4, '0');
      const newId = `TSK-${dateString}-${nextSequence}`;
      
      if (taskData.category === 'Development' && taskData.subCategory === 'Software Development') {
        if (!taskData.stage) taskData.stage = 'Requirements';
        if (!taskData.stageDeadlines) taskData.stageDeadlines = {};
      }

      const newTask = {
        ...taskData,
        id: newId,
        createdAt: new Date().toISOString(),
        history: [{
          action: 'Created',
          timestamp: new Date().toISOString(),
          user: state.currentUser?.name || taskData.assignedBy || 'System',
          details: `Task created with status: ${taskData.status}`
        }]
      };
      
      return { tasks: [newTask, ...state.tasks] };
    });
  },
  
  updateTask: (id, updatedData, userOverride = null) => {
    set((state) => {
      return {
        tasks: state.tasks.map(t => {
          if (t.id === id) {
            let historyEntry = null;
            const user = userOverride || state.currentUser?.name || 'System';

            if (updatedData.status && updatedData.status !== t.status) {
              historyEntry = {
                action: 'Status Changed',
                timestamp: new Date().toISOString(),
                user,
                details: `Status changed from ${t.status} to ${updatedData.status}${updatedData.statusReason ? `\nReason: ${updatedData.statusReason}` : ''}`
              };
            } else if (updatedData.assignedTo && updatedData.assignedTo !== t.assignedTo) {
              historyEntry = {
                action: 'Assigned',
                timestamp: new Date().toISOString(),
                user,
                details: `Assigned to ${updatedData.assignedTo}`
              };
            } else if (updatedData.assignTo && updatedData.assignTo !== t.assignTo) {
              historyEntry = {
                action: 'Assigned',
                timestamp: new Date().toISOString(),
                user,
                details: `Assigned to ${updatedData.assignTo}`
              };
            } else if (updatedData.stage && updatedData.stage !== t.stage) {
              historyEntry = {
                action: 'Stage Advanced',
                timestamp: new Date().toISOString(),
                user,
                details: `Project stage updated from ${t.stage || 'None'} to ${updatedData.stage}`
              };
            } else {
              historyEntry = {
                action: 'Updated',
                timestamp: new Date().toISOString(),
                user,
                details: `Task details were updated`
              };
            }

            const newHistory = [...(t.history || []), historyEntry];
            return { ...t, ...updatedData, history: newHistory };
          }
          return t;
        })
      };
    });
  },
  
  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
  },
  
  addEmployee: (empData) => {
    set((state) => {
      const maxSequence = state.employees.reduce((max, emp) => {
        const parts = emp.id.split('-');
        if (parts.length === 2) {
          const seq = parseInt(parts[1], 10);
          if (seq > max) return seq;
        }
        return max;
      }, 0);
      
      const nextSequence = String(maxSequence + 1).padStart(3, '0');
      const newId = `EMP-${nextSequence}`;
      
      const newEmployee = {
        ...empData,
        id: newId,
        createdAt: new Date().toISOString()
      };
      
      return { employees: [newEmployee, ...state.employees] };
    });
  },
  
  updateEmployee: (id, updatedData) => {
    set((state) => ({
      employees: state.employees.map(e => e.id === id ? { ...e, ...updatedData } : e)
    }));
  },
  
  deleteEmployee: (id) => {
    set((state) => ({
      employees: state.employees.filter(e => e.id !== id)
    }));
  },

  // Masters Management
  addMasterCategory: (categoryName) => {
    set((state) => ({
      categories: { ...state.categories, [categoryName]: [] }
    }));
  },

  removeMasterCategory: (categoryName) => {
    set((state) => {
      const newCategories = { ...state.categories };
      delete newCategories[categoryName];
      return { categories: newCategories };
    });
  },

  addMasterSubCategory: (categoryName, subCategoryName) => {
    set((state) => {
      const catArray = state.categories[categoryName] || [];
      if (catArray.includes(subCategoryName)) return state;
      return {
        categories: {
          ...state.categories,
          [categoryName]: [...catArray, subCategoryName]
        }
      };
    });
  },

  removeMasterSubCategory: (categoryName, subCategoryName) => {
    set((state) => {
      const catArray = state.categories[categoryName] || [];
      return {
        categories: {
          ...state.categories,
          [categoryName]: catArray.filter(sub => sub !== subCategoryName)
        }
      };
    });
  },

  addMasterItem: (listName, item) => {
    set((state) => {
      if (state[listName].includes(item)) return state;
      return { [listName]: [...state[listName], item] };
    });
  },

  removeMasterItem: (listName, item) => {
    set((state) => ({
      [listName]: state[listName].filter(i => i !== item)
    }));
  },

  editMasterCategory: (oldName, newName) => {
    set((state) => {
      if (!newName.trim() || oldName === newName || state.categories[newName]) return state;
      const newCategories = { ...state.categories };
      newCategories[newName] = newCategories[oldName];
      delete newCategories[oldName];
      
      const updatedTasks = state.tasks.map(t => t.category === oldName ? { ...t, category: newName } : t);
      return { categories: newCategories, tasks: updatedTasks };
    });
  },

  editMasterSubCategory: (categoryName, oldSub, newSub) => {
    set((state) => {
      if (!newSub.trim() || oldSub === newSub) return state;
      const catArray = state.categories[categoryName] || [];
      if (catArray.includes(newSub)) return state;
      
      const newCatArray = catArray.map(sub => sub === oldSub ? newSub : sub);
      const updatedTasks = state.tasks.map(t => 
        (t.category === categoryName && t.subCategory === oldSub) ? { ...t, subCategory: newSub } : t
      );

      return { categories: { ...state.categories, [categoryName]: newCatArray }, tasks: updatedTasks };
    });
  },

  editMasterItem: (listName, oldItem, newItem) => {
    set((state) => {
      if (!newItem.trim() || oldItem === newItem || state[listName].includes(newItem)) return state;
      const newList = state[listName].map(i => i === oldItem ? newItem : i);
      
      let updatedTasks = state.tasks;
      if (listName === 'statuses') {
        updatedTasks = state.tasks.map(t => t.status === oldItem ? { ...t, status: newItem } : t);
      } else if (listName === 'priorities') {
        updatedTasks = state.tasks.map(t => t.priority === oldItem ? { ...t, priority: newItem } : t);
      }
      
      let updatedEmployees = state.employees;
      if (listName === 'roles') {
        updatedEmployees = state.employees.map(e => e.role === oldItem ? { ...e, role: newItem } : e);
      }
      
      return { [listName]: newList, tasks: updatedTasks, employees: updatedEmployees };
    });
  },

  // Teams Management
  createTeam: (teamData) => {
    set((state) => {
      const maxSequence = state.teams.reduce((max, t) => {
        const parts = t.id.split('-');
        if (parts.length === 2) {
          const seq = parseInt(parts[1], 10);
          if (seq > max) return seq;
        }
        return max;
      }, 0);
      
      const nextSequence = String(maxSequence + 1).padStart(3, '0');
      const newId = `TEAM-${nextSequence}`;
      
      const newTeam = {
        ...teamData,
        id: newId,
        createdAt: new Date().toISOString()
      };
      
      return { teams: [newTeam, ...state.teams] };
    });
  },
  
  updateTeam: (id, updatedData) => {
    set((state) => ({
      teams: state.teams.map(t => t.id === id ? { ...t, ...updatedData } : t)
    }));
  },
  
  deleteTeam: (id) => {
    set((state) => ({
      teams: state.teams.filter(t => t.id !== id),
      discussions: state.discussions.filter(d => d.teamId !== id) // Cascade delete discussions
    }));
  },

  // Discussion Forum
  addMessage: (messageData) => {
    set((state) => {
      const newMessage = {
        ...messageData,
        id: `MSG-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
      
      return { discussions: [...state.discussions, newMessage] };
    });
  }

    }),
    {
      name: 'taskmaster-storage',
    }
  )
);
