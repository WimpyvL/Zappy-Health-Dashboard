"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useTelehealthFlow } from "@/hooks/useTelehealthFlow";
import { useToast } from "@/hooks/use-toast";
import { DynamicFormRenderer } from "@/components/ui/dynamic-form-renderer";
import { dynamicFormService } from "@/services/dynamicFormService";

export default function EnhancedIntakeFormPage() {
    const params = useParams();
    const router = useRouter();
    const resolvedParams = React.use(Promise.resolve(params));
    const flowId = resolvedParams.flowId as string;
    
    const { flow, loading: flowLoading, submitIntakeForm } = useTelehealthFlow(flowId);
    const { toast } = useToast();
    
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formSchema, setFormSchema] = React.useState<any>(null);
    const [formLoading, setFormLoading] = React.useState(true);
    const [formError, setFormError] = React.useState<string | null>(null);

    // Load appropriate form template based on flow context
    React.useEffect(() => {
        const loadFormTemplate = async () => {
            if (!flow) return;
            
            setFormLoading(true);
            setFormError(null);

            try {
                const result = await dynamicFormService.getFormTemplateForProduct(
                    flow.productId || null, 
                    flow.categoryId || null
                );

                if (result.success && result.formSchema) {
                    setFormSchema(result.formSchema);
                } else {
                    console.error('Error loading form template:', result.error);
                    setFormError('Could not load the appropriate form template.');
                    // Use fallback form
                    const fallbackResult = await dynamicFormService.getFormTemplateForProduct(null, null);
                    if (fallbackResult.success) {
                        setFormSchema(fallbackResult.formSchema);
                    }
                }
            } catch (error) {
                console.error('Unexpected error loading form:', error);
                setFormError('An unexpected error occurred while loading the form.');
            } finally {
                setFormLoading(false);
            }
        };

        if (flow && !flowLoading) {
            loadFormTemplate();
        }
    }, [flow, flowLoading]);

    const handleFormSubmit = async (formData: any) => {
        if (!flowId || !formSchema) {
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: "Form data or flow information is missing." 
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Process the form data using the dynamic form service
            const processedData = dynamicFormService.processFormSubmission(formSchema, formData);
            
            // Submit to the telehealth flow orchestrator
            const result = await submitIntakeForm(processedData);

            if (result.success) {
                toast({
                    title: "Intake Form Submitted Successfully",
                    description: "A healthcare provider will review your information and contact you shortly.",
                });
                // Navigate to a confirmation page or back to dashboard
                router.push("/dashboard");
            } else {
                // The hook already shows a toast on error, but let's add more context
                console.error("Intake submission failed:", result.error);
                toast({
                    variant: "destructive",
                    title: "Submission Failed",
                    description: typeof result.error === 'string' ? result.error : result.error?.message || "There was a problem submitting your form. Please try again.",
                });
            }
        } catch (error) {
            console.error("Unexpected submission error:", error);
            toast({
                variant: "destructive",
                title: "Submission Error",
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (flowLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Patient Intake Form</h1>
                        <p className="text-muted-foreground text-sm">Loading your personalized intake form...</p>
                    </div>
                </div>
                <Card className="max-w-2xl mx-auto w-full">
                    <CardContent className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading flow information...
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!flow) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Patient Intake Form</h1>
                        <p className="text-muted-foreground text-sm">Form not found</p>
                    </div>
                </div>
                <Card className="max-w-2xl mx-auto w-full">
                    <CardContent className="flex items-center justify-center h-32 text-center">
                        <div>
                            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                            <p className="text-muted-foreground">The requested intake form could not be found.</p>
                            <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard")}>
                                Return to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Patient Intake Form</h1>
                    <p className="text-muted-foreground text-sm">
                        {flow.productId ? 
                            "Complete your personalized intake form for your selected consultation." :
                            "Please provide your medical information for consultation."
                        }
                    </p>
                </div>
            </div>

            {/* Product Context Information */}
            {flow.productId && (
                <Card className="max-w-2xl mx-auto w-full bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="font-medium">
                                This form is customized for your {flow.productId?.includes('weight') ? 'Weight Management' : 
                                flow.productId?.includes('sexual') ? 'Sexual Health' :
                                flow.productId?.includes('hair') ? 'Hair Loss Treatment' : 'Healthcare'} consultation
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {formLoading ? (
                <Card className="max-w-3xl mx-auto w-full">
                    <CardContent className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading personalized form...
                    </CardContent>
                </Card>
            ) : formError ? (
                <Card className="max-w-2xl mx-auto w-full border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="text-yellow-800 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Form Loading Issue
                        </CardTitle>
                        <CardDescription className="text-yellow-700">
                            {formError} We've loaded a basic intake form for you to continue.
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : null}

            {formSchema && (
                <DynamicFormRenderer
                    schema={formSchema}
                    onSubmit={handleFormSubmit}
                    isSubmitting={isSubmitting}
                    submitButtonText="Submit Intake Form"
                    allowMultiPage={true}
                />
            )}

            {/* Privacy and Security Notice */}
            <Card className="max-w-3xl mx-auto w-full bg-gray-50">
                <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground text-center space-y-1">
                        <p>🔒 Your information is encrypted and secure</p>
                        <p>📋 This form will be reviewed by a licensed healthcare provider</p>
                        <p>💬 You will be contacted within 24-48 hours with next steps</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
