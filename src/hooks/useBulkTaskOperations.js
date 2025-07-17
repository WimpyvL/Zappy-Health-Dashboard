
import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useUpdateTask, useDeleteTask } from '../apis/tasks/hooks';

let undoStack = null;
let undoTimer = null;

export const useBulkTaskOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimeLeft, setUndoTimeLeft] = useState(30);

  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

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
    (undoData, undoFunction, successMessage) => {
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
      toast.success(undoStack.successMessage);
    } catch (error) {
      console.error('Undo failed:', error);
      toast.error('Failed to undo operation');
    } finally {
      setIsProcessing(false);
    }
  }, [clearUndoTimer]);

  const dismissUndo = useCallback(() => {
    clearUndoTimer();
  }, [clearUndoTimer]);

  const processBulkOperation = async (items, operationFn, getOriginalState, undoFn, getSuccessMessage, getUndoSuccessMessage) => {
    if (!items || items.length === 0) return;

    const originalStates = items.map(getOriginalState);

    try {
      setIsProcessing(true);
      setProgress({ current: 0, total: items.length });
      
      const results = await Promise.allSettled(items.map((item, index) => {
        return new Promise(resolve => setTimeout(async () => {
          const result = await operationFn(item);
          setProgress({ current: index + 1, total: items.length });
          resolve(result);
        }, index * 50)); // Stagger API calls
      }));
      
      const successfulItems = results.filter(r => r.status === 'fulfilled').map((r, i) => items[i]);
      const failedCount = items.length - successfulItems.length;

      if (successfulItems.length > 0) {
        toast.success(getSuccessMessage(successfulItems.length, failedCount));
        startUndoTimer(originalStates, undoFn, getUndoSuccessMessage(originalStates.length));
      } else {
        toast.error('All operations failed.');
      }
      
      queryClient.invalidateQueries(['tasks']);

    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error('An unexpected error occurred during the bulk operation.');
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const bulkUpdateStatus = (tasks, newStatus) => {
    return processBulkOperation(
      tasks,
      (task) => updateTask.mutateAsync({ id: task.id, status: newStatus }),
      (task) => ({ id: task.id, status: task.status }),
      (originalTasks) => Promise.all(originalTasks.map(t => updateTask.mutateAsync({ id: t.id, status: t.status }))),
      (s, f) => `Successfully updated ${s} tasks to "${newStatus}". ${f > 0 ? `${f} failed.` : ''}`,
      (s) => `Restored ${s} tasks to their original status.`
    );
  };

  const bulkMarkComplete = (tasks) => bulkUpdateStatus(tasks, 'completed');

  const bulkAssignTasks = (tasks, newAssigneeId) => {
    return processBulkOperation(
      tasks,
      (task) => updateTask.mutateAsync({ id: task.id, assignee_id: newAssigneeId }),
      (task) => ({ id: task.id, assignee_id: task.assignee_id }),
      (originalTasks) => Promise.all(originalTasks.map(t => updateTask.mutateAsync({ id: t.id, assignee_id: t.assignee_id }))),
      (s, f) => `Successfully assigned ${s} tasks. ${f > 0 ? `${f} failed.` : ''}`,
      (s) => `Reverted assignment for ${s} tasks.`
    );
  };
  
  const bulkDelete = (tasks) => {
    return processBulkOperation(
      tasks,
      (task) => deleteTask.mutateAsync(task.id),
      (task) => task, // Save the whole task object for potential restoration
      (originalTasks) => {
        // This is a placeholder. Real restoration would need a create endpoint.
        console.log('Undoing delete is not fully supported without a create endpoint in the hook.');
        return Promise.resolve();
      },
      (s, f) => `Successfully deleted ${s} tasks. ${f > 0 ? `${f} failed.` : ''}`,
      (s) => `${s} tasks restored (simulation).`
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
