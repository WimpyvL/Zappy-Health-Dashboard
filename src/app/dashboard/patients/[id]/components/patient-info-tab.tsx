
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Heart, FileText, Upload } from "lucide-react";

const InfoField = ({ label, value }: { label: string, value: string | undefined }) => (
  <div>
    <p className="text-xs text-muted-foreground font-semibold uppercase">{label}</p>
    <p className="text-sm font-medium">{value || '-'}</p>
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
}

export function PatientInfoTab({ patient }: PatientInfoTabProps) {
  if (!patient) {
    return <div>Loading patient information...</div>;
  }
  
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
            <InfoField label="Full Name" value={patient.name} />
            <InfoField label="Date of Birth" value={patient.dob ? patient.dob.toLocaleDateString() : 'N/A'} />
            <InfoField label="Email" value={patient.email} />
            <InfoField label="Phone" value={patient.phone} />
            <InfoField label="Address" value={patient.address} />
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
                    {patient.allergies || "No known allergies"}
                </div>
            </div>
             <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Current Medications</label>
                <div className="p-3 border rounded-md min-h-[60px] text-sm">
                    {patient.medications?.join(', ') || "No current medications"}
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
                <InfoField label="Insurance Provider" value={patient.insuranceProvider} />
                <InfoField label="Policy Number" value={patient.policyNumber} />
                <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Verification Status</p>
                    <div className="flex items-center gap-2 mt-1">
                         <span className="text-sm font-medium text-yellow-600">Unverified</span>
                         <p className="text-xs text-muted-foreground">Upload required documents to verify</p>
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

    