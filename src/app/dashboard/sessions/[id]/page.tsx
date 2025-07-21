
"use client";

import * as React from "react";
import {
  ArrowLeft,
  ChevronDown,
  Save,
  X,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
  XCircle,
  Sparkles,
  Edit,
  User,
  Mail,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase";
import { useRouter } from 'next/navigation';
import Loading from "./loading";
import { intakeIntegrationService } from "@/services/intakeIntegrationService";
import { consultationAI } from "@/services/consultationAI";
import { saveConsultationData, autoSaveConsultationData, publishConsultationToPatient } from "@/services/consultationService";
import AlertCenterCard from "@/components/consultation/AlertCenterCard";
import EnhancedMedicationsCard from "@/components/consultation/EnhancedMedicationsCard";

type MedicationDosageProps = {
    dose: string;
    currentDose: string;
    onClick: (dose: string) => void;
};

const MedicationDosage: React.FC<MedicationDosageProps> = ({ dose, currentDose, onClick }) => (
    <Button
        variant={currentDose === dose ? "default" : "outline"}
        size="sm"
        onClick={() => onClick(dose)}
        className="h-8 text-xs"
    >
        {dose}
    </Button>
);

const FollowUpButton = ({ label, current, onClick }: { label: string; current: string; onClick: (label: string) => void; }) => (
    <Button
        variant={current === label ? "default" : "outline"}
        size="sm"
        onClick={() => onClick(label)}
        className="h-8 text-xs"
    >
        {label}
    </Button>
);

const EducationButton = ({ label }: { label: string }) => (
    <Button variant="outline" size="sm" className="h-8 text-xs">
        {label} <Plus className="ml-2 h-3 w-3" />
    </Button>
);

export default function EditSessionPage({ params }: { params: { id: string } }) {
  const [session, setSession] = React.useState<any>(null);
  const [patient, setPatient] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Intake integration state
  const [intakeData, setIntakeData] = React.useState<any>(null);
  const [isLoadingIntakeData, setIsLoadingIntakeData] = React.useState(false);
  const [intakeDataError, setIntakeDataError] = React.useState<string | null>(null);

  // Form state
  const [currentDose, setCurrentDose] = React.useState("0.5");
  const [currentFollowUp, setCurrentFollowUp] = React.useState("4w");
  const [progressNotes, setProgressNotes] = React.useState("");
  const [assessmentPlan, setAssessmentPlan] = React.useState("");
  const [patientMessage, setPatientMessage] = React.useState("");

  // AI state
  const [isGeneratingAI, setIsGeneratingAI] = React.useState(false);

  // Save state
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  // Auto-save effect
  React.useEffect(() => {
    if (!params.id || !session) return;

    const consultationData = {
      progressNotes,
      assessmentAndPlan: assessmentPlan,
      patientMessage,
      followUpPeriod: currentFollowUp,
      currentDose,
      patientId: session.patientId
    };

    // Auto-save after 2 seconds of inactivity
    autoSaveConsultationData(params.id, consultationData);
  }, [progressNotes, assessmentPlan, patientMessage, currentFollowUp, currentDose, params.id, session]);

  // Manual save function
  const handleSave = async () => {
    if (!params.id || !session) return;

    setIsSaving(true);
    try {
      const consultationData = {
        progressNotes,
        assessmentAndPlan: assessmentPlan,
        patientMessage,
        followUpPeriod: currentFollowUp,
        currentDose,
        patientId: session.patientId
      };

      await saveConsultationData(params.id, consultationData);
      setLastSaved(new Date());
      
      toast({
        title: "Saved",
        description: "Consultation data has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Save failed:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save consultation data. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish consultation function
  const handlePublish = async () => {
    if (!params.id || !session || !patient) return;

    setIsSaving(true);
    try {
      const consultationData = {
        progressNotes,
        assessmentAndPlan: assessmentPlan,
        patientMessage,
        followUpPeriod: currentFollowUp,
        currentDose,
        patientId: session.patientId
      };

      await publishConsultationToPatient(params.id, patient.id, consultationData);
      
      toast({
        title: "Published",
        description: "Consultation has been completed and sent to patient.",
      });

      // Redirect back to sessions list
      router.push('/dashboard/sessions');
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast({
        variant: "destructive",
        title: "Publish Failed",
        description: "Failed to publish consultation. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    const fetchSessionData = async () => {
        if (!params.id) return;
        setLoading(true);
        setError(null);
        try {
            const db = getFirebaseFirestore();
            if (!db) {
                throw new Error("Firebase not initialized");
            }

            const sessionRef = doc(db, "sessions", params.id);
            const sessionSnap = await getDoc(sessionRef);

            if (!sessionSnap.exists()) {
                throw new Error("Session not found.");
            }
            
            const sessionData = { id: sessionSnap.id, ...sessionSnap.data() } as any;
            setSession(sessionData);

            // Initialize form state with existing data
            setProgressNotes(sessionData.progressNotes || "");
            setAssessmentPlan(sessionData.assessmentAndPlan || "");
            setPatientMessage(sessionData.patientMessage || "");

            if (sessionData.patientId) {
                const patientRef = doc(db, "patients", sessionData.patientId);
                const patientSnap = await getDoc(patientRef);
                if (patientSnap.exists()) {
                    setPatient({ id: patientSnap.id, ...patientSnap.data() });
                }
            }

            // Load intake data
            setIsLoadingIntakeData(true);
            try {
                const consultationData = await intakeIntegrationService.getIntakeConsultationData(params.id);
                if (consultationData) {
                    setIntakeData(consultationData);
                    
                    // Pre-populate fields if they're empty
                    if (!sessionData.progressNotes && consultationData.patientHistory) {
                        setProgressNotes(consultationData.patientHistory);
                    }
                    if (!sessionData.assessmentAndPlan && consultationData.assessment) {
                        setAssessmentPlan(consultationData.assessment);
                    }
                    if (!sessionData.patientMessage && consultationData.patientMessage) {
                        setPatientMessage(consultationData.patientMessage);
                    }
                    if (consultationData.selectedFollowup) {
                        setCurrentFollowUp(consultationData.selectedFollowup);
                    }
                }
            } catch (intakeError: any) {
                console.error("Error loading intake data:", intakeError);
                setIntakeDataError(intakeError.message);
            } finally {
                setIsLoadingIntakeData(false);
            }

        } catch (err: any) {
            console.error("Error fetching session details:", err);
            setError(err.message);
            toast({
                variant: "destructive",
                title: "Error loading session",
                description: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    fetchSessionData();
  }, [params.id, toast]);

  // AI generation functions
  const handleAICompose = async () => {
    if (!intakeData?.rawIntakeData) {
      toast({
        variant: "destructive",
        title: "No intake data",
        description: "No intake form data available for AI generation.",
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const aiNotes = await consultationAI.enhanceProgressNotes(intakeData.rawIntakeData, progressNotes);
      setProgressNotes(aiNotes);
      toast({
        title: "AI Generated",
        description: "Progress notes have been generated based on intake data.",
      });
    } catch (error: any) {
      console.error("AI generation failed:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Failed to generate progress notes. Please try again.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIAssessment = async () => {
    if (!intakeData?.rawIntakeData) {
      toast({
        variant: "destructive",
        title: "No intake data",
        description: "No intake form data available for AI generation.",
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const aiAssessment = await consultationAI.generateAssessmentPlan(intakeData.rawIntakeData, progressNotes);
      setAssessmentPlan(aiAssessment);
      toast({
        title: "AI Generated",
        description: "Assessment and plan have been generated based on intake data.",
      });
    } catch (error: any) {
      console.error("AI generation failed:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Failed to generate assessment. Please try again.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAIPatientMessage = async () => {
    if (!intakeData?.rawIntakeData) {
      toast({
        variant: "destructive",
        title: "No intake data",
        description: "No intake form data available for AI generation.",
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const aiMessage = await consultationAI.generatePatientMessage(intakeData.rawIntakeData, assessmentPlan);
      setPatientMessage(aiMessage);
      toast({
        title: "AI Generated",
        description: "Patient message has been generated based on intake data.",
      });
    } catch (error: any) {
      console.error("AI generation failed:", error);
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Failed to generate patient message. Please try again.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };


  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Session</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }
  
  if (!session) {
    return <div className="text-center p-8">Session could not be loaded.</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{session.type?.replace(/_/g, ' ')} Review</h1>
           {patient && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {patient.firstName} {patient.lastName}</span>
                <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {patient.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {patient.phone || 'N/A'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Intake Data Loading Indicator */}
      {isLoadingIntakeData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-sm text-green-700">🌱 Loading intake form data to populate consultation notes...</p>
        </div>
      )}

      {/* Intake Data Error Indicator */}
      {intakeDataError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-sm text-red-700">⚠️ Error loading intake form data: {intakeDataError}</p>
        </div>
      )}

      {/* Intake Data Summary */}
      {intakeData && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Intake Summary</CardTitle>
            <CardDescription>Information from patient's intake form</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Chief Complaint</h4>
                <p className="text-sm bg-blue-50 p-3 rounded border">
                  {intakeData.rawIntakeData?.chief_complaint || "No chief complaint provided"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Current Medications</h4>
                <p className="text-sm bg-green-50 p-3 rounded border">
                  {intakeData.rawIntakeData?.medications || "None reported"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Allergies</h4>
                <p className="text-sm bg-red-50 p-3 rounded border text-red-800">
                  {intakeData.rawIntakeData?.allergies || "None reported"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Alert Center Card */}
          <AlertCenterCard
            patientAllergies={intakeData?.rawIntakeData?.allergies ? [intakeData.rawIntakeData.allergies] : []}
            currentMedications={intakeData?.rawIntakeData?.medications ? [intakeData.rawIntakeData.medications] : []}
            selectedMedications={['Semaglutide', 'Wegovy']} // This would come from form state
            onAlertAction={(alertId, action) => {
              console.log(`Alert ${alertId} action: ${action}`);
              toast({
                title: "Alert Action",
                description: `${action} action taken for alert ${alertId}`,
              });
            }}
          />
          <Card>
            <CardHeader>
              <CardTitle>Treatment Progress</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  {intakeData && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded border">
                      ✅ Populated from intake form data
                    </div>
                  )}
                  <Textarea
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    placeholder="Treatment progress notes..."
                    rows={4}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAICompose}
                      disabled={isGeneratingAI}
                    >
                      <Sparkles className="h-4 w-4 mr-2" /> 
                      {isGeneratingAI ? "Generating..." : "AI Compose"}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Medications</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Medication
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm font-semibold flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    Weight Management
                </div>

              <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Checkbox id="semaglutide" defaultChecked />
                    <div>
                      <label htmlFor="semaglutide" className="font-semibold">Semaglutide (Wegovy)</label>
                      <p className="text-xs text-muted-foreground">Previous: 0.25mg</p>
                    </div>
                  </div>
                  <Select defaultValue="weekly">
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="mt-4 flex items-center gap-2">
                    <Button variant="outline" size="sm"><ArrowUp className="h-3 w-3 mr-1" /> Increase</Button>
                    <Button variant="outline" size="sm" className="bg-primary/10 border-primary/50 text-primary hover:bg-primary/20">- Maintain</Button>
                    <Button variant="outline" size="sm"><ArrowDown className="h-3 w-3 mr-1" /> Decrease</Button>
                    <Button variant="outline" size="sm"><XCircle className="h-3 w-3 mr-1" /> Stop</Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {["0.25", "0.5", "1.0", "1.7", "2.4", "Custom"].map(dose => (
                        <MedicationDosage key={dose} dose={dose} currentDose={currentDose} onClick={setCurrentDose} />
                    ))}
                </div>
                 <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                    <label className="text-xs font-medium text-muted-foreground">Plan</label>
                    <Select defaultValue="6m">
                        <SelectTrigger>
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="1m">1 month</SelectItem>
                        <SelectItem value="3m">3 months</SelectItem>
                        <SelectItem value="6m">6 months</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div>
                    <label className="text-xs font-medium text-muted-foreground">Approach</label>
                    <Select defaultValue="escal">
                        <SelectTrigger>
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="escal">Escal.</SelectItem>
                            <SelectItem value="maint">Maint.</SelectItem>
                            <SelectItem value="de-escal">De-Escal.</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                </div>
                <div className="mt-2">
                    <label className="text-xs font-medium text-muted-foreground">Instructions</label>
                    <div className="relative">
                        <Input defaultValue="Inject SC once wkly, Rotate sites." className="pr-10" />
                        <Button variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-1 h-7 w-7"><Pencil className="h-4 w-4" /></Button>
                    </div>
              </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Add New Medication</p>
                <p className="text-xs text-muted-foreground mb-2">Select from common medications or search for others</p>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <Button variant="outline" size="sm">Semaglutide</Button>
                    <Button variant="outline" size="sm">Metformin</Button>
                    <Button variant="outline" size="sm">Sildenafil</Button>
                    <Button variant="outline" size="sm">Tadalafil</Button>
                </div>
                <Input placeholder="Search medications..." />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Message to Patient</CardTitle>
                     <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          <Save className="mr-2 h-4 w-4" /> 
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="ghost" size="sm">
                        <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {intakeData && (
                      <div className="text-sm text-green-600 bg-green-50 p-2 rounded border">
                        ✅ Populated from intake form data
                      </div>
                    )}
                    <Textarea 
                      value={patientMessage}
                      onChange={(e) => setPatientMessage(e.target.value)}
                      placeholder="Patient message..." 
                      rows={4} 
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAIPatientMessage}
                        disabled={isGeneratingAI}
                      >
                        <Sparkles className="h-4 w-4 mr-2" /> 
                        {isGeneratingAI ? "Generating..." : "AI Generate"}
                      </Button>
                    </div>
                     <div>
                        <label className="text-sm font-medium mb-2 block">Follow-up</label>
                        <div className="flex gap-2">
                            {["2w", "4w", "6w", "Custom"].map(f => (
                                <FollowUpButton key={f} label={f} current={currentFollowUp} onClick={setCurrentFollowUp} />
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Follow-up Template</label>
                        <Select defaultValue="standard">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="standard">Standard Follow-up</SelectItem>
                                <SelectItem value="weight-loss">Weight Loss Follow-up</SelectItem>
                                <SelectItem value="ed">ED Follow-up</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Patient Education: Attach relevant instructions</label>
                        <div className="mt-2 flex flex-wrap gap-2">
                           <EducationButton label="GLP-1 Guide" />
                           <EducationButton label="ED Guide" />
                           <EducationButton label="Diet Plan" />
                           <Button variant="outline" size="sm" className="h-8 text-xs">More... <ChevronDown className="ml-1 h-3 w-3" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Assessment & Plan</CardTitle>
                    <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleAIAssessment}
                          disabled={isGeneratingAI}
                        >
                          <Sparkles className="mr-2 h-4 w-4" /> 
                          {isGeneratingAI ? "Generating..." : "AI Generate"}
                        </Button>
                        <Button variant="outline" size="sm">
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                        <Button variant="ghost" size="sm">
                            <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                      {intakeData && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded border">
                          ✅ Populated from intake form data
                        </div>
                      )}
                      <Textarea 
                          value={assessmentPlan}
                          onChange={(e) => setAssessmentPlan(e.target.value)}
                          rows={10} 
                          className="text-xs leading-5"
                          placeholder="Assessment and treatment plan..."
                      />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg sticky bottom-0 border-t">
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" /> 
              AI-generated content • Review before signing
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {isSaving ? "Saving..." : "Auto-saved"}
              </Badge>
              {lastSaved && (
                <span className="text-xs text-slate-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              variant="outline"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={isSaving || !patientMessage.trim()}
            >
              {isSaving ? "Publishing..." : "Complete & Send to Patient"}
            </Button>
          </div>
      </div>
    </div>
  );
}
