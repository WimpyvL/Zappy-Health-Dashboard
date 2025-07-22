<<<<<<< HEAD
=======
/**
 * @fileoverview React hook for managing the telehealth flow state in components.
 */
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { telehealthFlowOrchestrator, FLOW_STATUSES } from '@/services/telehealthFlowOrchestrator';
import { categoryProductOrchestrator } from '@/services/categoryProductOrchestrator';
<<<<<<< HEAD
import { dbService } from '@/services/database';

export const useTelehealthFlow = (initialFlowId: string | null = null) => {
  const [flow, setFlow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
=======
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';

// Types
interface TelehealthFlow {
  id: string;
  patientId: string;
  categoryId: string;
  productId?: string;
  current_status: string;
  created_at: any;
  updated_at: any;
  intake_form_data?: Record<string, any>;
  consultation_data?: Record<string, any>;
  order_data?: Record<string, any>;
  invoice_data?: Record<string, any>;
}

interface FlowInitializationParams {
  patientId: string;
  categoryId: string;
  productId: string;
}

interface FlowResult {
  success: boolean;
  flow?: TelehealthFlow | null;
  error?: Error | string | null;
}

interface ApprovalData {
  approved: boolean;
  notes?: string;
  prescription_data?: Record<string, any>;
}

interface UseTelehealthFlowReturn {
  flow: TelehealthFlow | null;
  loading: boolean;
  error: string | null;
  initializeFlow: (params: FlowInitializationParams) => Promise<FlowResult>;
  selectProduct: (productId: string, subscriptionDurationId: string) => Promise<FlowResult>;
  submitIntakeForm: (formData: Record<string, any>) => Promise<FlowResult>;
  approveConsultation: (approvalData: ApprovalData) => Promise<FlowResult>;
  getProductRecommendations: (categoryId: string) => Promise<any[]>;
  isFlowActive: boolean;
}

export const useTelehealthFlow = (initialFlowId: string | null = null): UseTelehealthFlowReturn => {
  const [flow, setFlow] = useState<TelehealthFlow | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialFlowId) {
        setLoading(false);
        return;
<<<<<<< HEAD
    };

    setLoading(true);
    const unsubscribe = dbService.listen('enhanced_telehealth_flows', initialFlowId, (data) => {
        if (data) {
            setFlow(data);
=======
    }

    const db = getFirebaseFirestore();
    if (!db) {
        setError("Firebase not initialized");
        setLoading(false);
        return;
    }

    setLoading(true);
    const flowRef = doc(db, 'enhanced_telehealth_flows', initialFlowId);
    const unsubscribe: Unsubscribe = onSnapshot(flowRef, (doc) => {
        if (doc.exists()) {
            setFlow({ id: doc.id, ...doc.data() } as TelehealthFlow);
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
        } else {
            setError("Flow not found.");
            toast({ variant: "destructive", title: "Error", description: "Could not find the specified telehealth flow." });
            setFlow(null);
        }
        setLoading(false);
<<<<<<< HEAD
=======
    }, (err) => {
        console.error("Error listening to flow changes:", err);
        setError(err.message);
        setLoading(false);
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
    });

    return () => unsubscribe();
  }, [initialFlowId, toast]);

<<<<<<< HEAD
  const initializeFlow = useCallback(async ({ patientId, categoryId, productId }: { patientId: string, categoryId: string, productId?: string }) => {
=======
  const initializeFlow = useCallback(async ({ patientId, categoryId, productId }: FlowInitializationParams): Promise<FlowResult> => {
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
    setLoading(true);
    setError(null);
    try {
      const result = await telehealthFlowOrchestrator.initializeFlow({ patientId, categoryId, productId });
<<<<<<< HEAD
      if (result.success) {
        setFlow(result.flow);
=======
      if (result.success && result.flow) {
        setFlow(result.flow as TelehealthFlow);
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
        toast({ title: "Flow Started", description: "Your telehealth journey has begun." });
      } else {
        throw result.error || new Error("Failed to initialize flow.");
      }
<<<<<<< HEAD
      return result;
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: err.message });
      return { success: false, flow: null, error: err };
=======
      return { success: result.success, flow: result.flow as TelehealthFlow, error: result.error as Error | string | null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast({ variant: "destructive", title: "Error", description: errorMessage });
      return { success: false, flow: null, error: err as Error | string | null };
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
    } finally {
      setLoading(false);
    }
  }, [toast]);

<<<<<<< HEAD
  // Other methods (selectProduct, submitIntakeForm, etc.) remain the same but benefit from the typed flow state.
=======
  const selectProduct = useCallback(async (productId: string, subscriptionDurationId: string): Promise<FlowResult> => {
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
       if (result.success && result.flow) {
        setFlow(result.flow as TelehealthFlow);
        toast({ title: "Product Selected", description: "Ready for the next step." });
      } else {
        throw result.error || new Error("Failed to process product selection.");
      }
      return { success: result.success, flow: result.flow as TelehealthFlow, error: result.error as Error | string | null };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        toast({ variant: "destructive", title: "Error", description: errorMessage });
        return { success: false, flow: null, error: err as Error | string | null };
    } finally {
        setLoading(false);
    }
  }, [flow, toast]);

  const submitIntakeForm = useCallback(async (formData: Record<string, any>): Promise<FlowResult> => {
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
        if (result.success && result.flow) {
            setFlow(result.flow as TelehealthFlow);
            // Success toast is handled by the calling component for better context
        } else {
            throw result.error || new Error("Failed to submit intake form.");
        }
        return { success: result.success, flow: result.flow as TelehealthFlow, error: result.error as Error | string | null };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        toast({ variant: "destructive", title: "Submission Error", description: errorMessage });
        return { success: false, error: err as Error | string | null };
    } finally {
        setLoading(false);
    }
  }, [flow, toast]);

  const approveConsultation = useCallback(async (approvalData: ApprovalData): Promise<FlowResult> => {
    if (!flow || !flow.id) {
        const err = new Error("Flow not initialized or flow ID is missing.");
        setError(err.message);
        toast({ variant: "destructive", title: "Error", description: err.message });
        return { success: false, error: err };
    }
    setLoading(true);
    setError(null);
    try {
        const result = await telehealthFlowOrchestrator.processConsultationApproval(flow.id, approvalData);
        if (result.success && result.flow) {
            setFlow(result.flow as TelehealthFlow);
            toast({ title: "Consultation Approved", description: "Order and invoice have been generated." });
        } else {
            throw result.error || new Error("Failed to approve consultation.");
        }
        return { success: result.success, flow: result.flow as TelehealthFlow, error: result.error as Error | string | null };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        toast({ variant: "destructive", title: "Approval Error", description: errorMessage });
        return { success: false, error: err as Error | string | null };
    } finally {
        setLoading(false);
    }
  }, [flow, toast]);

  const getProductRecommendations = useCallback(async (categoryId: string): Promise<any[]> => {
      setLoading(true);
      setError(null);
      try {
          const recommendations = await categoryProductOrchestrator.getProductRecommendations(categoryId);
          return recommendations;
      } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage);
          toast({ variant: "destructive", title: "Recommendation Error", description: errorMessage });
          return [];
      } finally {
          setLoading(false);
      }
  }, [toast]);
  
  const isFlowActive = Boolean(flow && flow.current_status !== FLOW_STATUSES.COMPLETED && flow.current_status !== FLOW_STATUSES.CANCELLED);
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

  return {
    flow,
    loading,
    error,
    initializeFlow,
<<<<<<< HEAD
    // selectProduct,
    // submitIntakeForm,
    // approveConsultation,
    // getProductRecommendations,
  };
};
=======
    selectProduct,
    submitIntakeForm,
    approveConsultation,
    getProductRecommendations,
    isFlowActive,
  };
};
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb
