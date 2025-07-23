
"use client";

import * as React from "react";
import { ArrowLeft, Save, X, Plus, Sparkles, User, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import Loading from "./loading";
import Error from "../error";
import { useQuery } from '@tanstack/react-query';
import { databaseService, type Session, type Patient } from '@/services/database/index';

const fetchSessionData = async (sessionId: string): Promise<{ session: Session; patient: Patient | null } | null> => {
    if (!sessionId) return null;
    
    const sessionRes = await databaseService.sessions.getById(sessionId);
    if (sessionRes.error || !sessionRes.data) {
        const errorMessage = sessionRes.error?.message || 'Session not found.';
        throw new Error(errorMessage);
    }
    
    const sessionData = sessionRes.data;
    let patientData = null;

    if (sessionData.patientId) {
        const patientRes = await databaseService.patients.getById(sessionData.patientId);
        if (patientRes.data) {
            patientData = patientRes.data;
        }
    }
    return { session: sessionData, patient: patientData };
};

export default function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast();
  const router = useRouter();
  const resolvedParams = React.use(params);

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['session', resolvedParams.id],
    queryFn: () => fetchSessionData(resolvedParams.id),
    enabled: !!resolvedParams.id,
  });

  React.useEffect(() => {
    if (error) {
      toast({ variant: "destructive", title: "Error loading session", description: (error as Error).message });
    }
  }, [error, toast]);

  const { session, patient } = data || { session: null, patient: null };

  if (loading) return <Loading />;
  if (error) return <Error error={error as Error} reset={() => window.location.reload()} />;
  if (!session) return <div className="text-center p-8">Session could not be loaded.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{session.type?.replace(/_/g, ' ')} Review</h1>
           {patient && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {patient.name}</span>
                <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {patient.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {patient.phone || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>
      {/* Rest of the UI remains the same, using `session` and `patient` data */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
            <Card>
                <CardHeader><CardTitle>Medications</CardTitle></CardHeader>
                <CardContent><p>Medication details here...</p></CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader><CardTitle>Message to Patient</CardTitle></CardHeader>
                <CardContent><Textarea placeholder="Patient message..." /></CardContent>
            </Card>
        </div>
      </div>
      <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg sticky bottom-0 border-t">
          <p className="text-sm text-slate-600 flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-500" /> AI-generated content</p>
          <Button>Save</Button>
      </div>
    </div>
  );
}
