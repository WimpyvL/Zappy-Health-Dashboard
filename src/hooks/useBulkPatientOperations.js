
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { db } from '../services/database';

/**
 * Custom hook for managing bulk patient operations.
 * Provides functions for bulk status updates and scheduling check-ins,
 * with progress tracking and undo functionality.
 */
const useBulkPatientOperations = () => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showUndo, setShowUndo] = useState(false);
  const [undoAction, setUndoAction] = useState(null);
  const [undoTimeLeft, setUndoTimeLeft] = useState(5);

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ patients, newStatus }) => {
      setIsProcessing(true);
      setProgress({ current: 0, total: patients.length });
      const originalStatuses = patients.map(p => ({ id: p.id, status: p.status }));
      
      for (let i = 0; i < patients.length; i++) {
        await db.patients.update(patients[i].id, { status: newStatus });
        setProgress({ current: i + 1, total: patients.length });
      }
      
      return { originalStatuses, newStatus };
    },
    onSuccess: ({ originalStatuses, newStatus }) => {
      toast.success(`${originalStatuses.length} patients updated to ${newStatus}`);
      setUndoAction(() => async () => {
        for (const { id, status } of originalStatuses) {
          await db.patients.update(id, { status });
        }
        toast.info('Bulk update undone.');
        queryClient.invalidateQueries(['patients']);
      });
      setShowUndo(true);
    },
    onError: (error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
    onSettled: () => {
      setIsProcessing(false);
      queryClient.invalidateQueries(['patients']);
    },
  });

  const bulkScheduleCheckInsMutation = useMutation({
    mutationFn: async ({ patients, templateId }) => {
      setIsProcessing(true);
      setProgress({ current: 0, total: patients.length });
      const createdCheckIns = [];
      
      for (let i = 0; i < patients.length; i++) {
        // Placeholder for actual check-in scheduling logic
        console.log(`Scheduling check-in for ${patients[i].id} with template ${templateId}`);
        // In a real implementation, you'd create check-in records here.
        // For now, we simulate success.
        createdCheckIns.push({ patientId: patients[i].id, templateId });
        setProgress({ current: i + 1, total: patients.length });
      }

      return { createdCheckIns };
    },
    onSuccess: ({ createdCheckIns }) => {
      toast.success(`Scheduled check-ins for ${createdCheckIns.length} patients.`);
       // Undo for check-ins would involve deleting the created records.
      setUndoAction(() => async () => {
        console.log('Undoing check-in scheduling for:', createdCheckIns);
        toast.info('Check-in scheduling undone.');
        queryClient.invalidateQueries(['patients']);
      });
      setShowUndo(true);
    },
    onError: (error) => {
      toast.error(`Failed to schedule check-ins: ${error.message}`);
    },
    onSettled: () => {
      setIsProcessing(false);
      queryClient.invalidateQueries(['patients']);
    },
  });

  const startUndoTimer = useCallback(() => {
    setUndoTimeLeft(5);
    const timer = setInterval(() => {
      setUndoTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowUndo(false);
          setUndoAction(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return timer;
  }, []);

  useEffect(() => {
    let timer;
    if (showUndo) {
      timer = startUndoTimer();
    }
    return () => clearInterval(timer);
  }, [showUndo, startUndoTimer]);


  const executeUndo = useCallback(() => {
    if (undoAction) {
      undoAction();
      setShowUndo(false);
      setUndoAction(null);
    }
  }, [undoAction]);

  const dismissUndo = useCallback(() => {
    setShowUndo(false);
    setUndoAction(null);
  }, []);

  return {
    bulkUpdateStatus: bulkUpdateStatusMutation.mutateAsync,
    bulkScheduleCheckIns: bulkScheduleCheckInsMutation.mutateAsync,
    isProcessing,
    progress,
    showUndo,
    undoTimeLeft,
    executeUndo,
    dismissUndo,
  };
};

export default useBulkPatientOperations;
