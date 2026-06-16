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
    status: 'Open',
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
    status: 'Open', // Changed from Overdue for valid status checking
    description: 'Set up pipelines and custom fields in Zoho CRM.',
    createdAt: '2026-06-14T11:20:00Z',
  }
];

const INITIAL_EMPLOYEES = [
  {
    id: 'EMP-001',
    name: 'Karthik',
    email: 'karthik@taskmaster.com',
    bioId: 'BIO-1001',
    password: 'password123',
    place: 'Onsite',
    role: 'Admin',
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'EMP-002',
    name: 'Priya',
    email: 'priya@taskmaster.com',
    bioId: 'BIO-1002',
    password: 'password123',
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
const INITIAL_STATUSES = ['Open', 'Open for review', 'In Progress', 'Pending', 'On-hold', 'Completed', 'Cancelled'];
const INITIAL_ROLES = ['Admin', 'Manager', 'Developer', 'Support', 'Sales', 'Operations'];
const INITIAL_PLACES = ['Onsite', 'Remote'];
const INITIAL_DASHBOARD_METRICS = ['Open for review', 'Overdue', 'In Progress', 'On-hold', 'Today created', 'Today deadlined', 'Total'];

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
  isAuthenticated: false,
  currentUser: null,
  login: (bioId, password) => {
    const { employees } = get();
    const user = employees.find(e => e.bioId === bioId && e.password === password);
    if (user) {
      set({ isAuthenticated: true, currentUser: user });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false, currentUser: null }),
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
      
      const newTask = {
        ...taskData,
        id: newId,
        createdAt: new Date().toISOString()
      };
      
      return { tasks: [newTask, ...state.tasks] };
    });
  },
  
  updateTask: (id, updatedData) => {
    set((state) => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updatedData } : t)
    }));
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
  }

    }),
    {
      name: 'taskmaster-storage',
    }
  )
);
