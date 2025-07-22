
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Search, ChevronDown, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskFormModal } from "./components/task-form-modal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
<<<<<<< HEAD
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '@/services/database';
=======
import { db } from "@/lib/firebase";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

type Task = {
  id: string;
  task: string;
  assignee: string;
  dueDate: string;
  status: "Pending" | "In Progress" | "Completed";
};

const statusVariantMap: { [key: string]: "default" | "secondary" | "outline" | "destructive" } = {
    "Pending": "secondary",
    "In Progress": "default",
    "Completed": "outline",
};

const statusColorMap: { [key: string]: string } = {
  "Pending": "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  "Completed": "bg-green-100 text-green-800",
};

const fetchTasks = async () => {
    const response = await dbService.getAll<Omit<Task, 'dueDate'> & { dueDate: any }>('tasks', { sortBy: 'dueDate', sortDirection: 'asc' });
    if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to fetch tasks');
    }
    return response.data.map(task => ({
        ...task,
        dueDate: task.dueDate ? format(task.dueDate.toDate(), "MMM dd, yyyy") : "N/A",
    }));
};

const createTask = async (newTask: { assignee: string; task: string; dueDate?: Date }) => {
    const response = await dbService.create('tasks', {
        ...newTask,
        status: "Pending",
        createdAt: new Date(),
    });
    if (response.error) throw new Error(response.error);
    return response.data;
}

const deleteTask = async (taskId: string) => {
    const response = await dbService.delete('tasks', taskId);
    if (response.error) throw new Error(response.error);
}

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: loading } = useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    onError: (error) => {
        toast({
            variant: "destructive",
            title: "Error fetching tasks",
            description: error.message,
        });
    }
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast({
            title: "Task Created",
            description: `A new task has been assigned to ${data?.assignee}.`,
        });
        setIsModalOpen(false);
    },
    onError: (error: Error) => {
        toast({
            variant: "destructive",
            title: "Error Creating Task",
            description: error.message,
        });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast({
            title: "Task Deleted",
            description: "The task has been successfully deleted.",
        });
    },
    onError: (error: Error) => {
        toast({
            variant: "destructive",
            title: "Error Deleting Task",
            description: error.message,
        });
    }
  });

  const filteredTasks = tasks.filter(task => 
    task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Task Management</h1>
          <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden md:block">
                  Total: <span className="font-semibold">{tasks.length}</span> | 
                  Pending: <span className="font-semibold">{tasks.filter(t => t.status === 'Pending').length}</span> | 
                  Completed: <span className="font-semibold">{tasks.filter(t => t.status === 'Completed').length}</span>
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add a Task
              </Button>
          </div>
        </div>
      
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search tasks..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                      All Statuses
                      <ChevronDown className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem>Pending</DropdownMenuItem>
                  <DropdownMenuItem>In Progress</DropdownMenuItem>
                  <DropdownMenuItem>Completed</DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><Checkbox /></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">Loading tasks...</TableCell>
                  </TableRow>
                ) : filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell className="font-medium">{task.task}</TableCell>
                      <TableCell>
                          <Badge variant={statusVariantMap[task.status]} className={statusColorMap[task.status]}>
                          {task.status}
                          </Badge>
                      </TableCell>
                      <TableCell>{task.assignee}</TableCell>
                      <TableCell>{task.dueDate}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Task</DropdownMenuItem>
                              <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete this task.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(task.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                          </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                      </TableRow>
                  ))
                ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                          No tasks found matching your search criteria.
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Showing {filteredTasks.length} of {tasks.length} results</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <Select defaultValue="10">
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <TaskFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={(values) => createMutation.mutate(values)} />
    </>
  );
}
