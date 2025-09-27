"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Plus, Clock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Task } from '../types/task';


interface CreateTaskModalProps {
    onCreateTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

export const CreateTaskModal = ({ onCreateTask }: CreateTaskModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        allocatedTime: 30
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        onCreateTask({
            title: formData.title.trim(),
            description: formData.description.trim(),
            allocatedTime: formData.allocatedTime,
            timeSpent: 0,
            isActive: false,
            isCompleted: false,
            isPaused: false
        });

        setFormData({
            title: '',
            description: '',
            allocatedTime: 30
        });
        setIsOpen(false);
    };

    const timePresets = [15, 30, 45, 60, 90, 120];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Task
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-emerald-400 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Create New Task
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-gray-300">Task Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter task title..."
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter task description..."
                            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-gray-300 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Allocated Time
                        </Label>

                        <div className="grid grid-cols-3 gap-2">
                            {timePresets.map(time => (
                                <Button
                                    key={time}
                                    type="button"
                                    variant={formData.allocatedTime === time ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFormData(prev => ({ ...prev, allocatedTime: time }))}
                                    className={
                                        formData.allocatedTime === time
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                                            : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                                    }
                                >
                                    {time}m
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                            <Input
                                type="number"
                                min="1"
                                max="480"
                                value={formData.allocatedTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, allocatedTime: parseInt(e.target.value) || 30 }))}
                                className="bg-gray-800 border-gray-700 text-white w-20 text-center focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                            <span className="text-gray-400">minutes</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Create Task
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};