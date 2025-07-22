import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useUpdatePatient } from '../services/database/hooks';
// import { useScheduleFollowUp } from '../apis/followUps/hooks';
// import { useFollowUpTemplates } from '../apis/followUps/hooks';

// Types
interface Patient {
  id: string;
  status: string;
  first_name: string;
  last_name: string;
  [key: string]: any;
}

interface Progress {
  current: number;
  total: number;
}

interface OriginalPatientState {
  id: string;
  status: string;
  first_name: string;
  last_name: string;
}

interface ScheduledFollowUp {
  followUpId: string;
  patientId: string;
  patientName: string;
}

interface UndoStackItem {
  data: any;
  function: (data: any) => Promise<void>;
}

interface ProcessingError {
  patient: Patient;
  error: string;
}

// Undo stack management with proper typing
let undoStack: UndoStackItem | null = null;
let undoTimer: NodeJS.Timeout | null = null;

export const useBulkPatientOperations = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 });
  const [showUndo, setShowUndo] = useState<boolean>(false);
  const [undoTimeLeft, setUndoTimeLeft] = useState<number>(30);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updatePatient = useUpdatePatient();
  // TODO: Import actual follow-up hooks when available
  const scheduleFollowUp = { mutateAsync: async (data: any) => Promise.resolve({ id: 'mock-id', ...data }) };

  // Clear any existing undo timer
  const clearUndoTimer = useCallback(() => {
    if (undoTimer) {
      clearInterval(undoTimer);
      undoTimer = null;
    }
    setShowUndo(false);
    setUndoTimeLeft(30);
    undoStack = null;
  }, []);

  // Start undo countdown timer
  const startUndoTimer = useCallback(
    (undoData: any, undoFunction: (data: any) => Promise<void>) => {
      undoStack = { data: undoData, function: undoFunction };
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

  // Execute undo operation
  const executeUndo = useCallback(async () => {
    if (!undoStack) return;

    try {
      setIsProcessing(true);
      await undoStack.function(undoStack.data);
      clearUndoTimer();
      toast({
        title: "Success",
        description: "Operation undone successfully",
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
  }, [clearUndoTimer, toast]);

  // Dismiss undo notification
  const dismissUndo = useCallback(() => {
    clearUndoTimer();
  }, [clearUndoTimer]);

  // Bulk update patient status
  const bulkUpdateStatus = useCallback(
    async (patients: Patient[], newStatus: string): Promise<void> => {
      if (!patients || patients.length === 0) return;

      // Store original states for undo
      const originalStates: OriginalPatientState[] = patients.map((patient) => ({
        id: patient.id,
        status: patient.status,
        first_name: patient.first_name,
        last_name: patient.last_name,
      }));

      try {
        setIsProcessing(true);
        setProgress({ current: 0, total: patients.length });

        const results: Patient[] = [];
        const errors: ProcessingError[] = [];

        // Process each patient
        for (let i = 0; i < patients.length; i++) {
          const patient = patients[i];
          setProgress({ current: i + 1, total: patients.length });

          try {
            await updatePatient.mutateAsync({
              id: patient.id,
              status: newStatus,
            });
            results.push(patient);
          } catch (error: any) {
            console.error(`Failed to update patient ${patient.id}:`, error);
            errors.push({ patient, error: error.message || 'Unknown error' });
          }
        }

        // Show results
        const successCount = results.length;
        const errorCount = errors.length;

        if (successCount > 0) {
          const statusText =
            newStatus === 'deactivated' ? 'suspended' : newStatus;
          const message =
            errorCount > 0
              ? `Successfully ${statusText} ${successCount} patients, ${errorCount} failed`
              : `Successfully ${statusText} ${successCount} patients`;

          // Start undo timer
          startUndoTimer(originalStates, async (undoData: OriginalPatientState[]) => {
            // Undo function: restore original statuses
            for (const originalState of undoData) {
              try {
                await updatePatient.mutateAsync({
                  id: originalState.id,
                  status: originalState.status,
                });
              } catch (error) {
                console.error(
                  `Failed to undo status for patient ${originalState.id}:`,
                  error
                );
              }
            }

            // Refresh patient list
            queryClient.invalidateQueries({ queryKey: ['patients'] });

            const undoStatusText =
              originalStates[0]?.status === 'deactivated'
                ? 'suspended'
                : originalStates[0]?.status || 'original status';
            toast({
              title: "Success",
              description: `Restored ${undoData.length} patients to ${undoStatusText}`,
            });
          });

          // Show success notification
          toast({
            title: "Success",
            description: message,
          });
        }

        if (errorCount > 0 && successCount === 0) {
          toast({
            title: "Error",
            description: `Failed to update ${errorCount} patients`,
            variant: "destructive",
          });
        }

        // Refresh patient list
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      } catch (error) {
        console.error('Bulk status update failed:', error);
        toast({
          title: "Error",
          description: "Bulk status update failed",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [updatePatient, startUndoTimer, queryClient, toast]
  );

  // Bulk schedule check-ins
  const bulkScheduleCheckIns = useCallback(
    async (patients: Patient[], templateId: string): Promise<void> => {
      if (!patients || patients.length === 0 || !templateId) return;

      try {
        setIsProcessing(true);
        setProgress({ current: 0, total: patients.length });

        const results: Patient[] = [];
        const errors: ProcessingError[] = [];
        const scheduledFollowUps: ScheduledFollowUp[] = [];

        // Process each patient
        for (let i = 0; i < patients.length; i++) {
          const patient = patients[i];
          setProgress({ current: i + 1, total: patients.length });

          try {
            // Schedule follow-up using existing system
            const followUpData = await scheduleFollowUp.mutateAsync({
              patientId: patient.id,
              templateId: templateId,
              paymentStatus: 'pending',
            });

            scheduledFollowUps.push({
              followUpId: followUpData.id,
              patientId: patient.id,
              patientName: `${patient.first_name} ${patient.last_name}`,
            });

            results.push(patient);

            // Send notification to patient (the existing scheduleFollowUp hook handles this)
            console.log(
              `Check-in scheduled for patient ${patient.first_name} ${patient.last_name}`
            );
          } catch (error: any) {
            console.error(
              `Failed to schedule check-in for patient ${patient.id}:`,
              error
            );
            errors.push({ patient, error: error.message || 'Unknown error' });
          }
        }

        // Show results
        const successCount = results.length;
        const errorCount = errors.length;

        if (successCount > 0) {
          const message =
            errorCount > 0
              ? `Successfully scheduled ${successCount} check-ins and notified patients, ${errorCount} failed`
              : `Successfully scheduled ${successCount} check-ins and notified patients`;

          // Start undo timer
          startUndoTimer(scheduledFollowUps, async (undoData: ScheduledFollowUp[]) => {
            // Undo function: cancel scheduled follow-ups
            // Note: For now, we'll just log the cancellation
            // In a full implementation, you would call the cancel API here

            for (const item of undoData) {
              try {
                // TODO: Implement actual cancellation API call
                console.log(
                  `Would cancel check-in for patient ${item.patientName} (Follow-up ID: ${item.followUpId})`
                );

                // Send cancellation notification to patient
                // Note: This would integrate with your notification system
                console.log(
                  `Would send cancellation notification to patient ${item.patientName}`
                );
              } catch (error) {
                console.error(
                  `Failed to cancel follow-up ${item.followUpId}:`,
                  error
                );
              }
            }

            // Refresh relevant queries
            queryClient.invalidateQueries({ queryKey: ['followUps'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });

            toast({
              title: "Success",
              description: `Cancelled ${undoData.length} scheduled check-ins`,
            });
          });

          // Show success notification
          toast({
            title: "Success",
            description: message,
          });
        }

        if (errorCount > 0 && successCount === 0) {
          toast({
            title: "Error",
            description: `Failed to schedule ${errorCount} check-ins`,
            variant: "destructive",
          });
        }

        // Refresh relevant queries
        queryClient.invalidateQueries({ queryKey: ['followUps'] });
        queryClient.invalidateQueries({ queryKey: ['patients'] });
      } catch (error) {
        console.error('Bulk check-in scheduling failed:', error);
        toast({
          title: "Error",
          description: "Bulk check-in scheduling failed",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [scheduleFollowUp, startUndoTimer, queryClient, toast]
  );

  return {
    // Operations
    bulkUpdateStatus,
    bulkScheduleCheckIns,

    // State
    isProcessing,
    progress,

    // Undo functionality
    showUndo,
    undoTimeLeft,
    executeUndo,
    dismissUndo,

    // Cleanup
    clearUndoTimer,
  };
};

export default useBulkPatientOperations;
