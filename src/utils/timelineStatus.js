/**
 * Timeline Status System
 * Implements the normalized status logic requested by the user.
 */

export const TIMELINE_STATUS = {
  OVERDUE: 'Overdue',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
  DELAY_COMPLETED: 'Delay Completed',
  COMPLETED: 'Completed',
  NOT_STARTED: 'Not Started'
};

export const STATUS_COLORS = {
  [TIMELINE_STATUS.OVERDUE]: '#B91C1C', // Dark Red
  [TIMELINE_STATUS.IN_PROGRESS]: '#F97316', // Orange
  [TIMELINE_STATUS.ON_HOLD]: '#3B82F6', // Blue
  [TIMELINE_STATUS.CANCELLED]: '#EF4444', // Red
  [TIMELINE_STATUS.DELAY_COMPLETED]: '#EAB308', // Yellow
  [TIMELINE_STATUS.COMPLETED]: '#22C55E', // Green
  [TIMELINE_STATUS.NOT_STARTED]: '#94A3B8' // Gray
};

export const STATUS_TAILWIND = {
  [TIMELINE_STATUS.OVERDUE]: 'bg-red-700 border-red-800 text-white shadow-md shadow-red-700/30',
  [TIMELINE_STATUS.IN_PROGRESS]: 'bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/30',
  [TIMELINE_STATUS.ON_HOLD]: 'bg-blue-500 border-blue-600 text-white shadow-md shadow-blue-500/30',
  [TIMELINE_STATUS.CANCELLED]: 'bg-rose-500 border-rose-600 text-white shadow-md shadow-rose-500/30',
  [TIMELINE_STATUS.DELAY_COMPLETED]: 'bg-amber-400 border-amber-500 text-white shadow-md shadow-amber-400/30',
  [TIMELINE_STATUS.COMPLETED]: 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/30',
  [TIMELINE_STATUS.NOT_STARTED]: 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
};

// 1 = Highest Priority
export const STATUS_PRIORITY = {
  [TIMELINE_STATUS.OVERDUE]: 1,
  [TIMELINE_STATUS.IN_PROGRESS]: 2,
  [TIMELINE_STATUS.ON_HOLD]: 3,
  [TIMELINE_STATUS.CANCELLED]: 4,
  [TIMELINE_STATUS.DELAY_COMPLETED]: 5,
  [TIMELINE_STATUS.COMPLETED]: 6,
  [TIMELINE_STATUS.NOT_STARTED]: 7
};

/**
 * Calculates the normalized status for a single task based on its current state and deadline.
 * Supports both `projectTasks` (with status string) and `stageTasks` (with isCompleted boolean).
 */
export const calculateTaskStatus = (task, stageDeadline = null) => {
  // Determine if deadline has passed
  const deadline = task.deadline || task.dueDate || stageDeadline;
  const isDeadlinePast = deadline && new Date(deadline).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);

  // Extract raw status if available
  const rawStatus = String(task.status || task.statusName || '').toLowerCase().trim();
  const isCompletedBool = task.isCompleted === true;

  // 1. Completed tasks
  if (isCompletedBool || rawStatus === 'completed' || rawStatus === '3') {
    return {
      status: isDeadlinePast ? TIMELINE_STATUS.DELAY_COMPLETED : TIMELINE_STATUS.COMPLETED,
      color: isDeadlinePast ? STATUS_COLORS[TIMELINE_STATUS.DELAY_COMPLETED] : STATUS_COLORS[TIMELINE_STATUS.COMPLETED],
      twClass: isDeadlinePast ? STATUS_TAILWIND[TIMELINE_STATUS.DELAY_COMPLETED] : STATUS_TAILWIND[TIMELINE_STATUS.COMPLETED]
    };
  }

  // 2. Cancelled
  if (rawStatus === 'cancelled' || rawStatus === '6') {
    return {
      status: TIMELINE_STATUS.CANCELLED,
      color: STATUS_COLORS[TIMELINE_STATUS.CANCELLED],
      twClass: STATUS_TAILWIND[TIMELINE_STATUS.CANCELLED]
    };
  }

  // 3. On Hold / Blocked
  if (rawStatus === 'on hold' || rawStatus === '5' || rawStatus === 'blocked') {
    return {
      status: TIMELINE_STATUS.ON_HOLD,
      color: STATUS_COLORS[TIMELINE_STATUS.ON_HOLD],
      twClass: STATUS_TAILWIND[TIMELINE_STATUS.ON_HOLD]
    };
  }

  // 4. Overdue (Not finished, and past deadline)
  if (isDeadlinePast) {
    return {
      status: TIMELINE_STATUS.OVERDUE,
      color: STATUS_COLORS[TIMELINE_STATUS.OVERDUE],
      twClass: STATUS_TAILWIND[TIMELINE_STATUS.OVERDUE]
    };
  }

  // 5. In Progress
  if (rawStatus === 'in progress' || rawStatus === 'review' || rawStatus === '2' || rawStatus === '4' || task.progress > 0 || (task.isCompleted === false && deadline)) {
    return {
      status: TIMELINE_STATUS.IN_PROGRESS,
      color: STATUS_COLORS[TIMELINE_STATUS.IN_PROGRESS],
      twClass: STATUS_TAILWIND[TIMELINE_STATUS.IN_PROGRESS]
    };
  }

  // 6. Not Started
  return {
    status: TIMELINE_STATUS.NOT_STARTED,
    color: STATUS_COLORS[TIMELINE_STATUS.NOT_STARTED],
    twClass: STATUS_TAILWIND[TIMELINE_STATUS.NOT_STARTED]
  };
};

/**
 * Calculates the final Stage status dynamically based on all tasks inside it.
 */
export const calculateStageStatus = (tasks = [], stageDeadline = null) => {
  if (!tasks || tasks.length === 0) {
    return {
      status: TIMELINE_STATUS.NOT_STARTED,
      color: STATUS_COLORS[TIMELINE_STATUS.NOT_STARTED],
      twClass: STATUS_TAILWIND[TIMELINE_STATUS.NOT_STARTED]
    };
  }

  // Calculate status for each task
  const taskStatuses = tasks.map(t => calculateTaskStatus(t, stageDeadline).status);

  // Find the highest priority status present
  let highestPriorityStatus = TIMELINE_STATUS.NOT_STARTED;
  let minPriorityVal = 999;

  for (const status of taskStatuses) {
    const priority = STATUS_PRIORITY[status];
    if (priority < minPriorityVal) {
      minPriorityVal = priority;
      highestPriorityStatus = status;
    }
  }

  return {
    status: highestPriorityStatus,
    color: STATUS_COLORS[highestPriorityStatus],
    twClass: STATUS_TAILWIND[highestPriorityStatus]
  };
};
