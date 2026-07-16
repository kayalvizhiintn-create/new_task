# Task Management Dashboard & Workflow System

A premium, enterprise-grade Task Management Dashboard built with React, Vite, and Tailwind CSS. This application is designed to manage tasks, track project stages, and provide an overarching view of team productivity with a modern, high-end user interface.

## 🚀 Key Features

*   **Interactive Dashboard:** A comprehensive overview featuring animated top statistic cards (Total, New Task, In Progress, On-hold, Overdue, Today's tasks) and categorized breakdowns (Development, Support, Hardware, etc.).
*   **Floating Card UI Design:** Sleek, modern floating rows with subtle gradients, dynamic hover effects, and full Dark/Light mode support.
*   **Waterfall Flow & Timelines:** Visual workflow tracking (`TaskStageForum`, `WaterfallFlow`) to manage task progress across various project stages with strict deadlines.
*   **Advanced Task Listing:** A highly compact, data-dense task list view that includes intuitive filters, assignee tracking, priority badges, and actionable quick-links.
*   **Approval System:** Integrated approval panels for task timeline changes, allowing for robust peer and admin review processes directly from the dashboard.
*   **Role-Based Access Control:** Secure components and views based on user roles and privileges (e.g., restricted system logs and admin controls).
*   **Print-Friendly Views:** Optimized print layouts that automatically hide interactive UI elements (like top stats and navigation) for clean PDF reports.

## 🛠️ Technology Stack

*   **Core:** React (Vite)
*   **Styling:** Tailwind CSS (with custom utility classes and complex gradient designs)
*   **Routing:** React Router DOM
*   **Icons:** Lucide React
*   **State Management:** Custom React hooks and Context/Zustand (via `useStore`)

## 📦 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🎨 UI/UX Philosophy

The interface was built prioritizing visual excellence—avoiding generic tables in favor of modern SaaS aesthetics like glassmorphism, micro-animations, and refined color palettes. Everything from the data tables to the calendar widgets is crafted to feel premium, responsive, and alive.
