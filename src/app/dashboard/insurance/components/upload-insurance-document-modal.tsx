
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadInsuranceDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadInsuranceDocumentModal({
  isOpen,
  onClose,
}: UploadInsuranceDocumentModalProps) {
  const handleUpload = () => {
    // Handle the upload logic here
    console.log("Uploading document...");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Insurance Document</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">File *</Label>
            <Input id="file" type="file" />
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="document-title">Document Title *</Label>
            <Input
              id="document-title"
              placeholder="Enter document title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Policy Document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="policy-document">Policy Document</SelectItem>
                <SelectItem value="prior-authorization">
                  Prior Authorization
                </SelectItem>
                <SelectItem value="claim-form">Claim Form</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="patient-name">Patient Name *</Label>
            <Input
              id="patient-name"
              placeholder="Enter patient name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="policy-number">Policy Number</Label>
            <Input
              id="policy-number"
              placeholder="Enter policy number (optional)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes (optional)"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleUpload}>
            Upload Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
