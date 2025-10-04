"use client";

import { useState } from 'react';
import { Task } from '../types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Check, Clock, Trash2, MoveHorizontal as MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getProgressPercentage } from '../lib/time-utils';
import { cn } from '@/lib/utils';

interface TaskItemProps {
    task: Task;
    onStart: (task: Task) => void;
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
}

export const TaskItem = ({ task, onStart, onComplete, onDelete }: TaskItemProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const progress = getProgressPercentage(task.timeSpent, task.allocatedTime);
    const timeRemaining = Math.max(0, (task.allocatedTime * 60) - task.timeSpent);
    const isOvertime = task.timeSpent > (task.allocatedTime * 60);

    const formatTimeDisplay = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                "bg-gray-900/50 border-gray-800 hover:border-gray-700",
                task.isCompleted && "opacity-75 bg-gray-900/30",
                task.isActive && "ring-2 ring-emerald-500/50 border-emerald-500/50"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Progress bar background */}
            <div
                className={cn(
                    "absolute inset-0 transition-all duration-500",
                    isOvertime
                        ? "bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent"
                        : "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent"
                )}
                style={{
                    width: `${Math.min(progress, 100)}%`,
                    opacity: task.isCompleted ? 0.3 : 0.7
                }}
            />

            <CardContent className="p-4 py-2 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className={cn(
                                "font-semibold text-lg transition-colors",
                                task.isCompleted
                                    ? "text-gray-400 line-through"
                                    : "text-white group-hover:text-emerald-400"
                            )}>
                                {task.title}
                            </h3>

                            {task.isActive && (
                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                                    Active
                                </Badge>
                            )}

                            {task.isCompleted && (
                                <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                    <Check className="w-3 h-3 mr-1" />
                                    Complete
                                </Badge>
                            )}

                            {isOvertime && !task.isCompleted && (
                                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                                    Overtime
                                </Badge>
                            )}
                        </div>

                        {task.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-300">
                                <Clock className="w-4 h-4" />
                                <span>
                                    {formatTimeDisplay(task.timeSpent)} / {formatTimeDisplay(task.allocatedTime * 60)}
                                </span>
                            </div>

                            {!task.isCompleted && timeRemaining > 0 && (
                                <div className="text-gray-400">
                                    {formatTimeDisplay(timeRemaining)} remaining
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        {!task.isCompleted && (
                            <Button
                                size="sm"
                                onClick={() => onStart(task)}
                                className={cn(
                                    "transition-all duration-200",
                                    task.isActive
                                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                            >
                                {task.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                        )}

                        {!task.isCompleted && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onComplete(task.id)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem
                                    onClick={() => onDelete(task.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 bg-gray-700/50 rounded-full h-2 overflow-hidden">
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
            </CardContent>
        </Card>
    );
};