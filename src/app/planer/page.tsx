'use client'
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Send, 
  Trash2, 
  Check,
  Tag,
  Clock,
  Sparkles,
  TrendingUp,
  Target,
  Zap,
  MoreVertical,
  Clock1
} from 'lucide-react';
import Link from 'next/link';
import { useTasks } from '../hooks/use-tasks';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'work', name: 'Work', color: 'from-blue-500 to-cyan-500', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'personal', name: 'Personal', color: 'from-green-500 to-emerald-500', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { id: 'health', name: 'Health', color: 'from-pink-500 to-rose-500', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { id: 'learning', name: 'Learning', color: 'from-purple-500 to-violet-500', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'home', name: 'Home', color: 'from-orange-500 to-amber-500', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    return days[today];
  };


export default function WeeklyTaskSystem() {
  const [tasks, setTasks] = useState<any>([]);
  const [expandedTasks, setExpandedTasks] = useState<any>(new Set());
  const [showCreateForm, setShowCreateForm] = useState<any>(false);
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'work',
    day: getCurrentDay(),
    estimatedTime: 30,
    subtasks: [],
    isSent: false
  });
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const { tasks : dailyTasks, addTask : addDailyTask, } = useTasks();


  useEffect(() => {
    const saved = localStorage.getItem('weeklyTasks');
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('weeklyTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task = {
      id: Date.now().toString(),
      ...newTask,
      createdAt: new Date().toISOString(),
      completed: false
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      category: 'work',
      day: selectedDay,
      estimatedTime: 30,
      subtasks: [],
      isSent: false
    });
    setShowCreateForm(false);
  };

  const addSubtask = (taskId: any, text: any) => {
    if (!text.trim()) return;
//   @ts-ignore
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: [...task.subtasks, {
            id: Date.now().toString(),
            text,
            completed: false
          }]
        };
      }
      return task;
    }));
  };

//   @ts-ignore
  const toggleSubtask = (taskId, subtaskId) => {
    //   @ts-ignore
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          //   @ts-ignore
          subtasks: task.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          )
        };
      }
      return task;
    }));
  };
//   @ts-ignore
  const deleteSubtask = (taskId, subtaskId) => {
    //   @ts-ignore
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          //   @ts-ignore
          subtasks: task.subtasks.filter(st => st.id !== subtaskId)
        };
      }
      return task;
    }));
  };
//   @ts-ignore
  const deleteTask = (taskId) => {
    //   @ts-ignore
    setTasks(tasks.filter(t => t.id !== taskId));
  };
//   @ts-ignore
  const toggleExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };
//   @ts-ignore
  const sendToDailySystem = (task) => {

    const data = {
            title: task.title.trim(),
            description: task.description.trim(),
            allocatedTime: task.estimatedTime,
            timeSpent: 0,
            isActive: false,
            isCompleted: false,
            isPaused: false
        }

        addDailyTask(data);
        toast.success('Task added to daily system');

        //  update task isSent to true
        setTasks(tasks.map((task: any) => task.id === task.id ? { ...task, isSent: true } : task));
        // update task isSent to true in localStorage
        const savedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const updatedTasks = savedTasks.map((task: any) => task.id === task.id ? { ...task, isSent: true } : task);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };
//   @ts-ignore
  const getTasksByDay = (day) => {
    //   @ts-ignore
    return tasks.filter(task => task.day === day);
  };
//   @ts-ignore
  const getCategoryData = (categoryId) => {
    //   @ts-ignore
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  };
//   @ts-ignore
  const totalTasks = tasks.length;
//   @ts-ignore
  const completedTasks = tasks.filter(t => t.completed).length;
//   @ts-ignore
  const totalTime = tasks.reduce((acc, t) => acc + t.estimatedTime, 0);
//   @ts-ignore
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-cyan-500/20">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Weekly Planner
                </h1>
              </div>
              <p className="text-gray-400 text-lg ml-14">Organize your week, achieve your goals</p>
            </div>
            <div className='space-x-2'>
                <Link href="/">
                 <Button 
                 
                 className='cursor-pointer'
                 variant={"outline"}
           
            >
              <Clock1 className="w-5 h-5 mr-2" />
              Time Tracker
            </Button>
            </Link>
            <Button 
              onClick={() => {
                setNewTask({...newTask, day: selectedDay});
                setShowCreateForm(!showCreateForm);
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105 px-4 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Task
            </Button>
            </div>
            
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all duration-300 group">
              <CardContent className="py-1 px-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-medium">Total Tasks</p>
                    <p className="text-4xl font-bold text-white">{totalTasks}</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
                    <Target className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300 group">
              <CardContent className="py-1 px-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-medium">Completed</p>
                    <p className="text-4xl font-bold text-white">{completedTasks}</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group">
              <CardContent className="py-1 px-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-medium">Total Time</p>
                    <p className="text-4xl font-bold text-white">{totalTime/60}<span className="text-2xl text-gray-500"> H</span></p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300 group">
              <CardContent className="py-1 px-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-medium">Progress</p>
                    <p className="text-4xl font-bold text-white">{completionRate}<span className="text-2xl text-gray-500">%</span></p>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Task Modal */}
        {showCreateForm && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <Card className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/50 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Create New Task</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Task Title</label>
                    <Input
                      placeholder="What needs to be done?"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all h-12 text-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                    <Textarea
                      placeholder="Add more details..."
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      className="bg-slate-900/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Category
                      </label>
                      <select
                        value={newTask.category}
                        onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Day
                      </label>
                      <select
                        value={newTask.day}
                        onChange={(e) => setNewTask({...newTask, day: e.target.value})}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      >
                        {DAYS.map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Est. Time (min)
                      </label>
                      <Input
                        type="number"
                        value={newTask.estimatedTime}
                        onChange={(e) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 0})}
                        className="bg-slate-900/50 border-slate-700 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all h-12"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={addTask} 
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.02] h-12 text-base font-semibold"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Task
                    </Button>
                    <Button 
                      onClick={() => setShowCreateForm(false)} 
                      className="px-8 bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 h-12"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Day Selector Pills */}
        <div className="mb-8">
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-4">
              {DAYS.map(day => {
                const dayTasks = getTasksByDay(day);
                const isSelected = selectedDay === day;
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                      isSelected 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 scale-105' 
                        : 'bg-slate-900/50 text-gray-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{day}</span>
                      {dayTasks.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isSelected ? 'bg-white/20' : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
<ScrollArea className="w-full h-[65vh]">
        {/* Tasks for Selected Day */}
        <div className="space-y-4 ">
          {getTasksByDay(selectedDay).length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-16 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl flex items-center justify-center mx-auto">
                    <Calendar className="w-10 h-10 text-cyan-400/50" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-300">No tasks for {selectedDay}</h3>
                  <p className="text-gray-500">
                    Start planning your week by creating a new task
                  </p>
                  <Button 
                    onClick={() => {
                      setNewTask({...newTask, day: selectedDay});
                      setShowCreateForm(true);
                    }}
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-400 border border-cyan-500/30 mt-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className=" grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getTasksByDay(selectedDay).map((task: any) => {
                const isExpanded = expandedTasks.has(task.id);
                const completedSubtasks = task.subtasks.filter((st: any) => st.completed).length;
                const categoryData = getCategoryData(task.category);
                const progress = task.subtasks.length > 0 
                  ? (completedSubtasks / task.subtasks.length) * 100 
                  : 0;
                
                return (
                  <Card 
                    key={task.id} 
                    className="bg-gradient-to-br p-3 from-slate-900/90 to-slate-800/90 border-slate-700/50 backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 group overflow-hidden"
                  >
                    {/* Progress bar */}
                    {task.subtasks.length > 0 && (
                      <div className="h-1 bg-slate-800">
                        <div 
                          className={`h-full bg-gradient-to-r ${categoryData.color} transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}

                    <CardContent className="py-1 px-2">
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => toggleExpanded(task.id)}
                          className="mt-1 p-1 hover:bg-slate-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          {isExpanded ? 
                            <ChevronDown className="w-5 h-5" /> : 
                            <ChevronRight className="w-5 h-5" />
                          }
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                                <Badge className={`${categoryData.badge} border font-medium px-3 py-1`}>
                                  {categoryData.name}
                                </Badge>
                                {task.isSent && (
                                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                                    {task.isSent ? 'Sent' : 'Not Sent'}
                                  </Badge>
                                )}
                                {task.subtasks.length > 0 && (
                                  <span className="text-sm font-medium text-gray-400 bg-slate-800/50 px-3 py-1 rounded-full">
                                    {completedSubtasks}/{task.subtasks.length} subtasks
                                  </span>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-gray-400 leading-relaxed">{task.description}</p>
                              )}

                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-2 text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  {task.estimatedTime} min
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => sendToDailySystem(task)}
                                size="sm"
                                className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-400 border border-emerald-500/30 transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/10"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send to Daily
                              </Button>
                              <Button
                                onClick={() => deleteTask(task.id)}
                                size="sm"
                                className="bg-slate-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Subtasks */}
                          {isExpanded && (
                            <div className="mt-6 space-y-3 pl-2">
                              {task.subtasks.map((subtask: any) => (
                                <div 
                                  key={subtask.id} 
                                  className="flex items-center gap-3 group/subtask p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                                >
                                  <button
                                    onClick={() => toggleSubtask(task.id, subtask.id)}
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                      subtask.completed 
                                        ? `bg-gradient-to-r ${categoryData.color} border-transparent scale-110` 
                                        : 'border-slate-600 hover:border-slate-500'
                                    }`}
                                  >
                                    {subtask.completed && <Check className="w-4 h-4 text-white" />}
                                  </button>
                                  <span className={`flex-1 transition-all ${
                                    subtask.completed 
                                      ? 'line-through text-gray-500' 
                                      : 'text-gray-300'
                                  }`}>
                                    {subtask.text}
                                  </span>
                                  <button
                                    onClick={() => deleteSubtask(task.id, subtask.id)}
                                    className="opacity-0 group-hover/subtask:opacity-100 text-gray-500 hover:text-red-400 transition-all p-2 hover:bg-red-500/10 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}

                              <div className="flex gap-2 pt-2">
                                <Input
                                  placeholder="Add a subtask..."
                                  value={newSubtaskText}
                                  onChange={(e) => setNewSubtaskText(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      addSubtask(task.id, newSubtaskText);
                                      setNewSubtaskText('');
                                    }
                                  }}
                                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                                />
                                <Button
                                  onClick={() => {
                                    addSubtask(task.id, newSubtaskText);
                                    setNewSubtaskText('');
                                  }}
                                  className={`bg-gradient-to-r ${categoryData.color} text-white hover:opacity-90 px-4`}
                                >
                                  <Plus className="w-5 h-5" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        </ScrollArea>
      </div>
    </div>
  );
}