"use client";

import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Clock, Target, CircleCheck as CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { formatTime, secondsToMinutes } from './lib/time-utils';
import { Separator } from '@/components/ui/separator';
import { Task } from './types/task';
import { CreateTaskModal } from './components/create-task-modal';
import { TaskItem } from './components/task-item';
import { TimerScreen } from './components/timer-screen';
import { useTasks } from './hooks/use-tasks';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function Home() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleStartTask = (task: Task) => {
    // Pause any other active tasks
    tasks.forEach(t => {
      if (t.id !== task.id && t.isActive) {
        updateTask(t.id, { isActive: false, isPaused: true });
      }
    });

    // Toggle the selected task
    if (task.isActive) {
      updateTask(task.id, { isActive: false, isPaused: true });
    } else {
      updateTask(task.id, { isActive: true, isPaused: false });
      setActiveTask({ ...task, isActive: true });
    }
  };

  const handleCompleteTask = (id: string) => {
    updateTask(id, {
      isCompleted: true,
      isActive: false,
      isPaused: false,
      completedAt: new Date()
    });
  };

  const activeTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);
  const totalTimeToday = tasks.reduce((acc, task) => acc + task.timeSpent, 0);
  const tasksCompletedToday = completedTasks.length;
  const currentActiveTask = tasks.find(task => task.isActive);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
        {/* Header */}
        <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                TaskFlow
              </h1>
              <p className="text-gray-400 text-lg mt-2">Focus. Track. Achieve.</p>
            </div>
            <CreateTaskModal onCreateTask={addTask} />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Time Today</p>
                    <p className="text-white font-semibold">{formatTime(totalTimeToday)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Active Tasks</p>
                    <p className="text-white font-semibold">{activeTasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-white font-semibold">{tasksCompletedToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Productivity</p>
                    <p className="text-white font-semibold">
                      {tasks.length > 0 ? Math.round((tasksCompletedToday / tasks.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
  


      <ScrollArea className='w-full h-[65vh]'>
      <div className="relative z-10 container mx-auto px-6 py-8">


        {/* Active/In Progress Tasks */}
        {activeTasks.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">Active Tasks</h2>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {activeTasks.length}
              </Badge>
            </div>

            <div className="grid gap-4 grid-cols-2">
              {activeTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onComplete={handleCompleteTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <Separator className="my-8 bg-gray-800" />

            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-white">Completed Tasks</h2>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                {completedTasks.length}
              </Badge>
            </div>

            <div className="grid gap-4 grid-cols-2">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onComplete={handleCompleteTask}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-12 text-center">
              <div className="mb-6">
                <div className="mx-auto w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No tasks yet</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Create your first task to start tracking your time and boosting productivity.
                  Set a goal, start the timer, and watch your progress unfold.
                </p>
              </div>
              <CreateTaskModal onCreateTask={addTask} />
            </CardContent>
          </Card>
        )}
      </div>

      </ScrollArea>

      <div className='w-full h-full overflow-hidden'>

    
            {/* Full screen timer */}
            {activeTask && (
        <TimerScreen
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onUpdateTask={updateTask}
        />
      )}

      {/* Show timer for currently active task */}
      {currentActiveTask && !activeTask && (
        <TimerScreen
          task={currentActiveTask}
          onClose={() => setActiveTask(null)}
          onUpdateTask={updateTask}
        />
      )}
        </div>
    </div>
  );
}