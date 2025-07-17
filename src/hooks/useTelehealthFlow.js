/**
 * @fileoverview React hook for managing the telehealth flow state in components.
 */
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { telehealthFlowOrchestrator, FLOW_STATUSES } from '@/services/telehealthFlowOrchestrator';
import { categoryProductOrchestrator } from '@/services/categoryProductOrchestrator';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export const useTelehealthFlow = (initialFlowId = null) => {
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialFlowId) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const flowRef = doc(db, 'enhanced_telehealth_flows', initialFlowId);
    const unsubscribe = onSnapshot(flowRef, (doc) => {
        if (doc.exists()) {
            setFlow({ id: doc.id, ...doc.data() });
        } else {
            setError("Flow not found.");
            toast({ variant: "destructive", title: "Error", description: "Could not find the specified telehealth flow." });
            setFlow(null);
        }
        setLoading(false);
    }, (err) => {
        console.error("Error listening to flow changes:", err);
        setError(err.message);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [initialFlowId, toast]);

  const initializeFlow = useCallback(async ({ patientId, categoryId, productId }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await telehealthFlowOrchestrator.initializeFlow({ patientId, categoryId, productId });
      if (result.success) {
        setFlow(result.flow);
        toast({ title: "Flow Started", description: "Your telehealth journey has begun." });
      } else {
        throw result.error || new Error("Failed to initialize flow.");
      }
      return result;
    } catch (err) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: err.message });
      return { success: false, flow: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const selectProduct = useCallback(async (productId, subscriptionDurationId) => {
    if (!flow) {
        const err = new Error("Flow not initialized.");
        setError(err.message);
        toast({ variant: "destructive", title: "Error", description: err.message });
        return { success: false, flow: null, error: err };
    }
    setLoading(true);
    setError(null);
    try {
      const result = await telehealthFlowOrchestrator.processProductSelection(flow.id, productId, subscriptionDurationId);
       if (result.success) {
        setFlow(result.flow);
        toast({ title: "Product Selected", description: "Ready for the next step." });
      } else {
        throw result.error || new Error("Failed to process product selection.");
      }
      return result;
    } catch (err) {
        setError(err.message);
        toast({ variant: "destructive", title: "Error", description: err.message });
        return { success: false, flow: null, error: err };
    } finally {
        setLoading(false);
    }
  }, [flow, toast]);

  const submitIntakeForm = useCallback(async (formData) => {
    if (!flow) {
        const err = new Error("Flow not initialized.");
        setError(err.message);
        toast({ variant: "destructive", title: "Error", description: err.message });
        return { success: false, error: err };
    }
    setLoading(true);
    setError(null);
    try {
        const result = await telehealthFlowOrchestrator.processIntakeForm(flow.id, formData);
        if (result.success) {
            setFlow(result.flow);
            // Success toast is handled by the calling component for better context
        } else {
            throw result.error || new Error("Failed to submit intake form.");
        }
        return result;
    } catch (err) {
        setError(err.message);
        toast({ variant: "destructive", title: "Submission Error", description: err.message });
        return { success: false, error: err };
    } finally {
        setLoading(false);
    }
  }, [flow, toast]);

  const getProductRecommendations = useCallback(async (categoryId) => {
      setLoading(true);
      setError(null);
      try {
          const recommendations = await categoryProductOrchestrator.getProductRecommendations(categoryId);
          return recommendations;
      } catch (err) {
          setError(err.message);
          toast({ variant: "destructive", title: "Recommendation Error", description: err.message });
          return [];
      } finally {
          setLoading(false);
      }
  }, [toast]);
  
  // Future actions:
  // const approveConsultation = useCallback(async (approvalData) => { ... }, [flow, toast]);

  const isFlowActive = flow && flow.current_status !== FLOW_STATUSES.COMPLETED && flow.current_status !== FLOW_STATUSES.CANCELLED;

  return {
    flow,
    loading,
    error,
    initializeFlow,
    selectProduct,
    submitIntakeForm,
    getProductRecommendations,
    isFlowActive,
    // Add other actions here
  };
};
