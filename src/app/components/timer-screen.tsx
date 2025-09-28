"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Play,
    Pause,
    Check,
    X,
    Plus,
    Minus,
    Clock,
    Target,
    Zap
} from 'lucide-react';
import { Task } from '../types/task';
import { formatTime } from '../lib/time-utils';
import { cn } from '@/lib/utils';

interface TimerScreenProps {
    task: Task;
    onClose: () => void;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

export const TimerScreen = ({ task, onClose, onUpdateTask }: TimerScreenProps) => {
    const [timeSpent, setTimeSpent] = useState(task.timeSpent);
    const [isRunning, setIsRunning] = useState(task.isActive);
    const [initialTimeSpent] = useState(task.timeSpent);
    const [isHovered, setIsHovered] = useState(false);

    const allocatedSeconds = task.allocatedTime * 60;
    const remainingTime = Math.max(0, allocatedSeconds - timeSpent);
    const isOvertime = timeSpent > allocatedSeconds;
    const progress = Math.min((timeSpent / allocatedSeconds) * 100, 100);

    // Display time (countdown from allocated time)
    const displayTime = isOvertime ? timeSpent - allocatedSeconds : remainingTime;

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && !task.isCompleted) {
            interval = setInterval(() => {
                setTimeSpent(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, task.isCompleted]);

    // Auto-save progress every 5 seconds
    useEffect(() => {
        if (timeSpent !== initialTimeSpent) {
            const saveTimeout = setTimeout(() => {
                onUpdateTask(task.id, {
                    timeSpent: timeSpent,
                    isActive: isRunning && !task.isCompleted
                });
            }, 1000);

            return () => clearTimeout(saveTimeout);
        }
    }, [timeSpent, task.id, onUpdateTask, initialTimeSpent, isRunning, task.isCompleted]);

    const handlePlayPause = useCallback(() => {
        const newIsRunning = !isRunning;
        setIsRunning(newIsRunning);
        onUpdateTask(task.id, {
            isActive: newIsRunning && !task.isCompleted,
            isPaused: !newIsRunning && !task.isCompleted
        });
    }, [isRunning, task.id, task.isCompleted, onUpdateTask]);

    const handleComplete = useCallback(() => {
        setIsRunning(false);
        onUpdateTask(task.id, {
            isCompleted: true,
            isActive: false,
            isPaused: false,
            timeSpent: timeSpent,
            completedAt: new Date()
        });
        onClose();
    }, [task.id, timeSpent, onUpdateTask, onClose]);

    const handleClose = useCallback(() => {
        onUpdateTask(task.id, {
            timeSpent: timeSpent,
            isActive: false,
            isPaused: true
        });
        onClose();
    }, [task.id, timeSpent, onUpdateTask, onClose]);

    const adjustTime = useCallback((minutes: number) => {
        const newTime = Math.max(0, timeSpent + (minutes * 60));
        setTimeSpent(newTime);
        onUpdateTask(task.id, { timeSpent: newTime });
    }, [timeSpent, task.id, onUpdateTask]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                handlePlayPause();
            } else if (e.code === 'Enter') {
                e.preventDefault();
                handleComplete();
            } else if (e.code === 'Escape') {
                e.preventDefault();
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handlePlayPause, handleComplete, handleClose]);

    return (
        <div
            className="fixed overflow-hidden inset-0 bg-black z-50 cursor-pointer "
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-emerald-500/20 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Main timer display - always centered and visible */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {/* Timer display - compact for small window */}
                <div className={cn(
                    "font-mono font-bold leading-none select-none",
                    "text-6xl sm:text-3xl md:text-4xl",
                    isOvertime ? "text-red-400" : "text-emerald-400"
                )}>
                    {isOvertime ? '+' : ''}{formatTime(displayTime)}
                </div>

     
                {/* Progress bar - minimal and always visible */}
                <div className="mt-2 w-48 bg-gray-700/30 rounded-full h-1 overflow-hidden">
                    <div
                        className={cn(
                            "h-full transition-all duration-500",
                            isOvertime
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-emerald-500 to-emerald-600"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>

            {/* Overlay controls - only visible on hover, positioned absolutely */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center pointer-events-none",
                "transition-all duration-300 ease-out",
                isHovered
                    ? "opacity-100 backdrop-blur-sm bg-black/30"
                    : "opacity-0"
            )}>
                <div className="pointer-events-auto">
                    {/* Task title overlay */}
                    {/* <div className="text-center mb-8">
                        <h1 className="text-xl font-bold text-white mb-2 break-words max-w-xs">
                            {task.title}
                        </h1>
                        {task.description && (
                            <p className="text-gray-300 text-sm break-words max-w-xs">
                                {task.description}
                            </p>
                        )}
                    </div> */}

                    {/* Time adjustment controls - compact */}
                    <div className="flex justify-center gap-2 mb-1">
                        <Button
                            variant="outline"
                                  size="icon"
                            onClick={() => adjustTime(-30)}
                            className="border-gray-500 text-[11px] py-0 h-7 text-gray-300 hover:bg-gray-700 hover:text-white bg-black/50 backdrop-blur-sm px-1"
                        >
                            -30m
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => adjustTime(-10)}
                            className="border-gray-500 text-[11px] py-0 h-7 text-gray-300 hover:bg-gray-700 hover:text-white bg-black/50 backdrop-blur-sm px-1 "
                        >
                            -10m
                        </Button>
                        <Button
                            variant="outline"
                                  size="icon"
                            onClick={() => adjustTime(10)}
                            className="border-gray-500 text-[11px] py-0 h-7 text-gray-300 hover:bg-gray-700 hover:text-white bg-black/50 backdrop-blur-sm px-1"
                        >
                            +10m
                        </Button>
                        <Button
                            variant="outline"
                                  size="icon"
                            onClick={() => adjustTime(30)}
                            className="border-gray-500 text-[11px] py-0 h-7 text-gray-300 hover:bg-gray-700 hover:text-white bg-black/50 backdrop-blur-sm px-1"
                        >
                            +30m
                        </Button>
                    </div>

                    {/* Main control buttons - compact layout */}
                    <div className="flex justify-center gap-3 mt-2">
                        <Button
                            onClick={handleClose}
                            variant="outline"
                            className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white bg-black/50 backdrop-blur-sm text-[11px] py-0 h-7"
                        >
                            <X className="w-4 h-4" />
                        </Button>

                        <Button
                            onClick={handlePlayPause}
                            size={"icon"}
                            className={cn(
                                "text-white transition-all duration-200 backdrop-blur-sm text-[11px] py-0 h-7" ,
                                isRunning
                                    ? "bg-amber-600/80 hover:bg-amber-700"
                                    : "bg-emerald-600/80 hover:bg-emerald-700"
                            )}
                        >
                            {isRunning ? (
                                <Pause className="w-2 h-2" />
                            ) : (
                                <Play className="w-2 h-2" />
                            )}
                        </Button>

                        <Button
                            onClick={handleComplete}
                            className="bg-green-600/80 hover:bg-green-700 text-white backdrop-blur-sm text-[11px] py-0 h-7"
                        >
                            <Check className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Keyboard shortcuts - minimal */}
                    {/* <div className="text-xs text-gray-400 text-center mt-4">
                        <div className="flex justify-center gap-3">
                            <span><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-xs">Space</kbd> Play</span>
                            <span><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-xs">Enter</kbd> Done</span>
                            <span><kbd className="px-1 py-0.5 bg-gray-700/50 rounded text-xs">Esc</kbd> Close</span>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};