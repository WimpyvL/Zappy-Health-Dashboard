
"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useTelehealthFlow } from "@/hooks/useTelehealthFlow";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// This is a simplified intake form for demonstration.
// A real application would have a multi-step, dynamic form here.

export default function IntakeFormPage() {
    const params = useParams();
    const flowId = params.flowId as string;
    
    // In a real app, you would load the specific form schema based on the flow's category.
    // For now, we use a simple, static form.

    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        toast({
            title: "Intake Form Submitted",
            description: "A provider will review your information shortly.",
        });
        // In a real app, you would save the form data and update the flow status.
        // For now, we'll just navigate back to the dashboard.
        router.push("/dashboard");
    };

    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Patient Intake Form</h1>
                    <p className="text-muted-foreground">Flow ID: {flowId}</p>
                </div>
            </div>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Medical History</CardTitle>
                    <CardDescription>Please provide some basic information. This will be reviewed by a healthcare provider.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="chief_complaint">Chief Complaint</Label>
                            <Input id="chief_complaint" placeholder="e.g., I'm interested in weight management" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="allergies">Known Allergies</Label>
                            <Input id="allergies" placeholder="e.g., Penicillin, Peanuts" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="medications">Current Medications</Label>
                            <Input id="medications" placeholder="e.g., Lisinopril 10mg" />
                        </div>
                        <Button type="submit" className="w-full">
                            Submit Intake Form
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
