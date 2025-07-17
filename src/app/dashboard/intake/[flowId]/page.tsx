
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTelehealthFlow } from "@/hooks/useTelehealthFlow.js";
import { useToast } from "@/hooks/use-toast";

// This is a simplified intake form for demonstration.
// A real application would have a multi-step, dynamic form here.

export default function IntakeFormPage() {
    const params = useParams();
    const router = useRouter();
    const flowId = params.flowId as string;
    
    const { flow, loading: flowLoading, submitIntakeForm } = useTelehealthFlow(flowId);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    // Simple state for our static form
    const [formData, setFormData] = React.useState({
        chief_complaint: '',
        allergies: '',
        medications: '',
    });

    React.useEffect(() => {
        if(flow?.product_id) {
            // Pre-fill form based on product context if needed
            let complaint = '';
            if (flow.product_id.includes('_wm')) complaint = 'Interested in weight management options.';
            if (flow.product_id.includes('_sh')) complaint = 'Interested in sexual health consultation.';
            if (flow.product_id.includes('_hl')) complaint = 'Seeking treatment for hair loss.';
            setFormData(prev => ({ ...prev, chief_complaint: complaint }));
        }
    }, [flow]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!flowId) {
            toast({ variant: "destructive", title: "Error", description: "Flow ID is missing." });
            return;
        }

        setIsSubmitting(true);
        const result = await submitIntakeForm(formData);

        if (result.success) {
            toast({
                title: "Intake Form Submitted",
                description: "A provider will review your information shortly.",
            });
            // Navigate to a success page or back to the dashboard
            router.push("/dashboard");
        } else {
            // The hook already shows a toast on error
            console.error("Intake submission failed:", result.error);
        }
        setIsSubmitting(false);
    };

    if (flowLoading) {
        return <div>Loading Flow Information...</div>
    }

    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Patient Intake Form</h1>
                    <p className="text-muted-foreground text-sm">Please provide your medical information.</p>
                </div>
            </div>

            <Card className="max-w-2xl mx-auto w-full">
                <CardHeader>
                    <CardTitle>Medical History</CardTitle>
                    <CardDescription>This information will be reviewed by a licensed healthcare provider.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="chief_complaint">Chief Complaint</Label>
                            <Input id="chief_complaint" placeholder="e.g., I'm interested in weight management" required value={formData.chief_complaint} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="allergies">Known Allergies</Label>
                            <Input id="allergies" placeholder="e.g., Penicillin, Peanuts" value={formData.allergies} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="medications">Current Medications</Label>
                            <Input id="medications" placeholder="e.g., Lisinopril 10mg" value={formData.medications} onChange={handleChange} />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Submitting...' : 'Submit Intake Form'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
