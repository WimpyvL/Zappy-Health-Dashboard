
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Heart, FileText, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const InfoField = ({ label, value, isLoading }: { label: string; value: string | undefined; isLoading?: boolean }) => (
  <div>
    <p className="text-xs text-muted-foreground font-semibold uppercase">{label}</p>
    {isLoading ? <Skeleton className="h-5 w-3/4 mt-1" /> : <p className="text-sm font-medium">{value || '-'}</p>}
  </div>
);

const DocumentUploadItem = ({ title, description }: { title: string, description: string }) => (
  <div className="flex justify-between items-center py-3">
    <div>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Button variant="outline" size="sm">
      <Upload className="h-3 w-3 mr-2" />
      Upload
    </Button>
  </div>
);

interface PatientInfoTabProps {
    patient: any;
    isLoading: boolean;
}

export function PatientInfoTab({ patient, isLoading }: PatientInfoTabProps) {
  const patientName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : 'N/A';
  
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </div>
          <Button variant="outline" size="sm">Edit</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <InfoField label="Full Name" value={patientName} isLoading={isLoading} />
            <InfoField label="Date of Birth" value={patient?.dob ? format(patient.dob, 'MM/dd/yyyy') : 'N/A'} isLoading={isLoading} />
            <InfoField label="Email" value={patient?.email} isLoading={isLoading} />
            <InfoField label="Phone" value={patient?.phone} isLoading={isLoading} />
            <InfoField label="Address" value={patient?.address} isLoading={isLoading} />
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Medical Information</CardTitle>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
           <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Known Allergies</label>
                <div className="p-3 border rounded-md min-h-[60px] text-sm">
                    {isLoading ? <Skeleton className="h-4 w-full" /> : (patient?.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : "No known allergies")}
                </div>
            </div>
             <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Current Medications</label>
                <div className="p-3 border rounded-md min-h-[60px] text-sm">
                    {isLoading ? <Skeleton className="h-4 w-full" /> : (patient?.medications && patient.medications.length > 0 ? patient.medications.join(', ') : "No current medications")}
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Insurance & Documents */}
      <Card className="bg-cyan-50/50">
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-lg">Insurance & Documents</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
                <InfoField label="Insurance Provider" value={patient?.insuranceProvider} isLoading={isLoading} />
                <InfoField label="Policy Number" value={patient?.policyNumber} isLoading={isLoading} />
                <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Verification Status</p>
                    <div className="flex items-center gap-2 mt-1">
                         {isLoading ? <Skeleton className="h-5 w-24" /> : <span className="text-sm font-medium text-yellow-600">Unverified</span>}
                         {isLoading ? null : <p className="text-xs text-muted-foreground">Upload required documents to verify</p>}
                    </div>
                </div>
            </div>
            <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold text-sm mb-2">Required Documents</h4>
                <div className="divide-y">
                    <DocumentUploadItem title="Insurance Card" description="PDF, JPG, PNG - Max 10MB" />
                    <DocumentUploadItem title="Photo ID" description="PDF, JPG, PNG - Max 10MB" />
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
