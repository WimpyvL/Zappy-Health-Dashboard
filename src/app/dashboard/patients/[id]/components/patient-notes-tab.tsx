
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, FolderOpen, Loader2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/database/index';

const fetchNotes = async (patientId: string) => {
    if (!patientId) return [];
    const response = await dbService.getAll<any>('notes', {
        filters: [{ field: 'patientId', op: '==', value: patientId }],
        sortBy: 'createdAt',
        sortDirection: 'desc'
    });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch notes');
    return response.data;
};

interface PatientNotesTabProps {
  patientId: string;
}

export function PatientNotesTab({ patientId }: PatientNotesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const { data: notes = [], isLoading: notesLoading, error: notesError } = useQuery({
    queryKey: ['patientNotes', patientId],
    queryFn: () => fetchNotes(patientId),
    enabled: !!patientId,
    onError: (err: Error) => toast({ variant: "destructive", title: "Error loading notes", description: err.message }),
  });

  const filteredNotes = notes.filter((note: any) =>
    note.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (notesError) return <div>Error loading notes.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Clinical Notes <Badge variant="secondary">{filteredNotes.length}</Badge>
            </CardTitle>
        </CardHeader>
        <CardContent>
          {notesLoading ? <div className="text-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          : filteredNotes.length === 0 ? (
            <div className="text-center"><FolderOpen className="h-16 w-16 mx-auto" /><p>No notes found.</p></div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note: any) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{note.title}</h3>
                  <p className="text-sm text-muted-foreground">{note.content}</p>
                  <div className="text-xs text-muted-foreground mt-2">{format(note.createdAt.toDate(), 'MMM dd, yyyy')}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
