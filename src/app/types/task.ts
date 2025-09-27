export interface Task {
    id: string;
    title: string;
    description?: string;
    allocatedTime: number; // in minutes
    timeSpent: number; // in minutes
    isActive: boolean;
    isCompleted: boolean;
    isPaused: boolean;
    createdAt: Date;
    completedAt?: Date;
}

export interface TimerState {
    isRunning: boolean;
    currentTime: number; // in seconds
    taskId: string | null;
}