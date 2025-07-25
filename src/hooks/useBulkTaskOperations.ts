import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
// import { useUpdateTask, useDeleteTask } from '../apis/tasks/hooks';

// Types
interface Task {
  id: string;
  status: string;
  assignee_id?: string;
  [key: string]: any;
}

interface Progress {
  current: number;
  total: number;
}

interface UndoStackItem {
  data: any;
  function: (data: any) => Promise<any>;
  successMessage: string;
}

interface OriginalTaskState {
  id: string;
  status?: string;
  assignee_id?: string | undefined;
}

// Global variables with proper typing
let undoStack: UndoStackItem | null = null;
let undoTimer: NodeJS.Timeout | null = null;

export const useBulkTaskOperations = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 });
  const [showUndo, setShowUndo] = useState<boolean>(false);
  const [undoTimeLeft, setUndoTimeLeft] = useState<number>(30);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  // TODO: Import actual task hooks when available
  const updateTask = { mutateAsync: async (data: any) => Promise.resolve(data) };
  const deleteTask = { mutateAsync: async (id: string) => Promise.resolve(id) };

  const clearUndoTimer = useCallback(() => {
    if (undoTimer) {
      clearInterval(undoTimer);
      undoTimer = null;
    }
    setShowUndo(false);
    setUndoTimeLeft(30);
    undoStack = null;
  }, []);

  const startUndoTimer = useCallback(
    (undoData: any, undoFunction: (data: any) => Promise<any>, successMessage: string) => {
      undoStack = { data: undoData, function: undoFunction, successMessage };
      setShowUndo(true);
      setUndoTimeLeft(30);

      undoTimer = setInterval(() => {
        setUndoTimeLeft((prev) => {
          if (prev <= 1) {
            clearUndoTimer();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearUndoTimer]
  );

  const executeUndo = useCallback(async () => {
    if (!undoStack) return;

    try {
      setIsProcessing(true);
      await undoStack.function(undoStack.data);
      clearUndoTimer();
      toast({
        title: "Success",
        description: undoStack.successMessage,
      });
    } catch (error) {
      console.error('Undo failed:', error);
      toast({
        title: "Error",
        description: "Failed to undo operation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [clearUndoTimer]);

  const dismissUndo = useCallback(() => {
    clearUndoTimer();
  }, [clearUndoTimer]);

  const processBulkOperation = async <T, U>(
    items: T[],
    operationFn: (item: T) => Promise<any>,
    getOriginalState: (item: T) => U,
    undoFn: (originalStates: U[]) => Promise<any>,
    getSuccessMessage: (successCount: number, failedCount: number) => string,
    getUndoSuccessMessage: (count: number) => string
  ): Promise<void> => {
    if (!items || items.length === 0) return;

    const originalStates = items.map(getOriginalState);

    try {
      setIsProcessing(true);
      setProgress({ current: 0, total: items.length });
      
      const results = await Promise.allSettled(items.map((item, index) => {
        return new Promise<any>(resolve => setTimeout(async () => {
          const result = await operationFn(item);
          setProgress({ current: index + 1, total: items.length });
          resolve(result);
        }, index * 50)); // Stagger API calls
      }));
      
      const successfulItems = results.filter(r => r.status === 'fulfilled').map((r, i) => items[i]);
      const failedCount = items.length - successfulItems.length;

      if (successfulItems.length > 0) {
        toast({
          title: "Success",
          description: getSuccessMessage(successfulItems.length, failedCount),
        });
        startUndoTimer(originalStates, undoFn, getUndoSuccessMessage(originalStates.length));
      } else {
        toast({
          title: "Error",
          description: "All operations failed.",
          variant: "destructive",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during the bulk operation.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const bulkUpdateStatus = (tasks: Task[], newStatus: string): Promise<void> => {
    return processBulkOperation(
      tasks,
      (task: Task) => updateTask.mutateAsync({ id: task.id, status: newStatus }),
      (task: Task): OriginalTaskState => ({ id: task.id, status: task.status }),
      (originalTasks: OriginalTaskState[]) => Promise.all(originalTasks.map(t => updateTask.mutateAsync({ id: t.id, status: t.status }))),
      (s: number, f: number) => `Successfully updated ${s} tasks to "${newStatus}". ${f > 0 ? `${f} failed.` : ''}`,
      (s: number) => `Restored ${s} tasks to their original status.`
    );
  };

  const bulkMarkComplete = (tasks: Task[]): Promise<void> => bulkUpdateStatus(tasks, 'completed');

  const bulkAssignTasks = (tasks: Task[], newAssigneeId: string): Promise<void> => {
    return processBulkOperation(
      tasks,
      (task: Task) => updateTask.mutateAsync({ id: task.id, assignee_id: newAssigneeId }),
      (task: Task): OriginalTaskState => ({ id: task.id, assignee_id: task.assignee_id }),
      (originalTasks: OriginalTaskState[]) => Promise.all(originalTasks.map(t => updateTask.mutateAsync({ id: t.id, assignee_id: t.assignee_id }))),
      (s: number, f: number) => `Successfully assigned ${s} tasks. ${f > 0 ? `${f} failed.` : ''}`,
      (s: number) => `Reverted assignment for ${s} tasks.`
    );
  };
  
  const bulkDelete = (tasks: Task[]): Promise<void> => {
    return processBulkOperation(
      tasks,
      (task: Task) => deleteTask.mutateAsync(task.id),
      (task: Task): Task => task, // Save the whole task object for potential restoration
      (originalTasks: Task[]) => {
        // This is a placeholder. Real restoration would need a create endpoint.
        console.log('Undoing delete is not fully supported without a create endpoint in the hook.');
        return Promise.resolve();
      },
      (s: number, f: number) => `Successfully deleted ${s} tasks. ${f > 0 ? `${f} failed.` : ''}`,
      (s: number) => `${s} tasks restored (simulation).`
    );
  };

  return {
    bulkUpdateStatus,
    bulkMarkComplete,
    bulkAssignTasks,
    bulkDelete,
    isProcessing,
    progress,
    showUndo,
    undoTimeLeft,
    executeUndo,
    dismissUndo,
    clearUndoTimer
  };
};
