import { Task } from '../types/task';

const TASKS_KEY = 'tasks';

export const storage = {
    getTasks: (): Task[] => {
        if (typeof window === 'undefined') return [];
        const tasks = localStorage.getItem(TASKS_KEY);
        return tasks ? JSON.parse(tasks).map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt),
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        })) : [];
    },

    saveTasks: (tasks: Task[]): void => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    },

    addTask: (task: Omit<Task, 'id' | 'createdAt'>): Task => {
        const newTask: Task = {
            ...task,
            id: crypto.randomUUID(),
            createdAt: new Date(),
        };
        const tasks = storage.getTasks();
        tasks.push(newTask);
        storage.saveTasks(tasks);
        return newTask;
    },

    updateTask: (id: string, updates: Partial<Task>): void => {
        const tasks = storage.getTasks();
        const taskIndex = tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
            storage.saveTasks(tasks);
        }
    },

    deleteTask: (id: string): void => {
        const tasks = storage.getTasks().filter(task => task.id !== id);
        storage.saveTasks(tasks);
    }
};