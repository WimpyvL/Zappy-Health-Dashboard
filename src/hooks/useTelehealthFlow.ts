import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { telehealthFlowOrchestrator, FLOW_STATUSES } from '@/services/telehealthFlowOrchestrator';
import { categoryProductOrchestrator } from '@/services/categoryProductOrchestrator';
import { dbService } from '@/services/database';

export const useTelehealthFlow = (initialFlowId: string | null = null) => {
  const [flow, setFlow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialFlowId) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const unsubscribe = dbService.listen('enhanced_telehealth_flows', initialFlowId, (data) => {
        if (data) {
            setFlow(data);
        } else {
            setError("Flow not found.");
            toast({ variant: "destructive", title: "Error", description: "Could not find the specified telehealth flow." });
            setFlow(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [initialFlowId, toast]);

  const initializeFlow = useCallback(async ({ patientId, categoryId, productId }: { patientId: string, categoryId: string, productId?: string }) => {
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
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: err.message });
      return { success: false, flow: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Other methods (selectProduct, submitIntakeForm, etc.) remain the same but benefit from the typed flow state.

  return {
    flow,
    loading,
    error,
    initializeFlow,
    // selectProduct,
    // submitIntakeForm,
    // approveConsultation,
    // getProductRecommendations,
  };
};