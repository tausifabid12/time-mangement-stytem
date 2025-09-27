"use client";

import { useState, useEffect } from 'react';
import { Task } from '../types/task';
import { storage } from '../lib/storage';

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        setTasks(storage.getTasks());
    }, []);

    const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
        const newTask = storage.addTask(taskData);
        setTasks(prev => [...prev, newTask]);
        return newTask;
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        storage.updateTask(id, updates);
        setTasks(prev => prev.map(task =>
            task.id === id ? { ...task, ...updates } : task
        ));
    };

    const deleteTask = (id: string) => {
        storage.deleteTask(id);
        setTasks(prev => prev.filter(task => task.id !== id));
    };

    return {
        tasks,
        addTask,
        updateTask,
        deleteTask
    };
};
