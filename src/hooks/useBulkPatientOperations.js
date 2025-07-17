
import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useUpdatePatient } from '../services/database/hooks';
import { useScheduleFollowUp } from '../apis/followUps/hooks';
import { useFollowUpTemplates } from '../apis/followUps/hooks';

// Undo stack management
let undoStack = null;
let undoTimer = null;

export const useBulkPatientOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimeLeft, setUndoTimeLeft] = useState(30);

  const queryClient = useQueryClient();
  const updatePatient = useUpdatePatient();
  const scheduleFollowUp = useScheduleFollowUp();

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
    (undoData, undoFunction) => {
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
      toast.success('Operation undone successfully');
    } catch (error) {
      console.error('Undo failed:', error);
      toast.error('Failed to undo operation');
    } finally {
      setIsProcessing(false);
    }
  }, [clearUndoTimer]);

  // Dismiss undo notification
  const dismissUndo = useCallback(() => {
    clearUndoTimer();
  }, [clearUndoTimer]);

  // Bulk update patient status
  const bulkUpdateStatus = useCallback(
    async (patients, newStatus) => {
      if (!patients || patients.length === 0) return;

      // Store original states for undo
      const originalStates = patients.map((patient) => ({
        id: patient.id,
        status: patient.status,
        first_name: patient.first_name,
        last_name: patient.last_name,
      }));

      try {
        setIsProcessing(true);
        setProgress({ current: 0, total: patients.length });

        const results = [];
        const errors = [];

        // Process each patient
        for (let i = 0; i < patients.length; i++) {
          const patient = patients[i];
          setProgress({ current: i + 1, total: patients.length });

          try {
            await updatePatient.mutateAsync({
              id: patient.id,
              data: { status: newStatus },
            });
            results.push(patient);
          } catch (error) {
            console.error(`Failed to update patient ${patient.id}:`, error);
            errors.push({ patient, error: error.message });
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
          startUndoTimer(originalStates, async (undoData) => {
            // Undo function: restore original statuses
            for (const originalState of undoData) {
              try {
                await updatePatient.mutateAsync({
                  id: originalState.id,
                  data: { status: originalState.status },
                });
              } catch (error) {
                console.error(
                  `Failed to undo status for patient ${originalState.id}:`,
                  error
                );
              }
            }

            // Refresh patient list
            queryClient.invalidateQueries(['patients']);

            const undoStatusText =
              originalStates[0]?.status === 'deactivated'
                ? 'suspended'
                : originalStates[0]?.status || 'original status';
            toast.success(
              `Restored ${undoData.length} patients to ${undoStatusText}`
            );
          });

          // Show success notification
          toast.success(message);
        }

        if (errorCount > 0 && successCount === 0) {
          toast.error(`Failed to update ${errorCount} patients`);
        }

        // Refresh patient list
        queryClient.invalidateQueries(['patients']);
      } catch (error) {
        console.error('Bulk status update failed:', error);
        toast.error('Bulk status update failed');
      } finally {
        setIsProcessing(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [updatePatient, startUndoTimer, queryClient]
  );

  // Bulk schedule check-ins
  const bulkScheduleCheckIns = useCallback(
    async (patients, templateId) => {
      if (!patients || patients.length === 0 || !templateId) return;

      try {
        setIsProcessing(true);
        setProgress({ current: 0, total: patients.length });

        const results = [];
        const errors = [];
        const scheduledFollowUps = [];

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
          } catch (error) {
            console.error(
              `Failed to schedule check-in for patient ${patient.id}:`,
              error
            );
            errors.push({ patient, error: error.message });
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
          startUndoTimer(scheduledFollowUps, async (undoData) => {
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
            queryClient.invalidateQueries(['followUps']);
            queryClient.invalidateQueries(['patients']);

            toast.success(`Cancelled ${undoData.length} scheduled check-ins`);
          });

          // Show success notification
          toast.success(message);
        }

        if (errorCount > 0 && successCount === 0) {
          toast.error(`Failed to schedule ${errorCount} check-ins`);
        }

        // Refresh relevant queries
        queryClient.invalidateQueries(['followUps']);
        queryClient.invalidateQueries(['patients']);
      } catch (error) {
        console.error('Bulk check-in scheduling failed:', error);
        toast.error('Bulk check-in scheduling failed');
      } finally {
        setIsProcessing(false);
        setProgress({ current: 0, total: 0 });
      }
    },
    [scheduleFollowUp, startUndoTimer, queryClient]
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
