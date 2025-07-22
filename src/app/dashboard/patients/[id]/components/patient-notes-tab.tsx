
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Filter, FolderOpen, Loader2, FileText, Edit, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { format } from 'date-fns';
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const useNotes = (patientId: string) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, "notes"), 
        where("patientId", "==", patientId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data: notes, isLoading: loading, error, refetch };
};

interface PatientNotesTabProps {
  patientId: string;
}

export function PatientNotesTab({ patientId }: PatientNotesTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  const {
    data: notes = [],
    isLoading: notesLoading,
    error: notesError,
    refetch: refetchNotes,
  } = useNotes(patientId);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || note.note_type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString: string | { toDate: () => Date }) => {
    if (!dateString) return 'Unknown';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString.toDate();
    return format(date, 'MMM dd, yyyy');
  };

  const handleNoteClick = (note: any) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const handleNoteCreated = () => {
    refetchNotes();
  };

  const handleNoteUpdated = () => {
    refetchNotes();
  };

  const handleNoteDeleted = () => {
    refetchNotes();
  };

  const getNoteTypeColor = (type: string) => {
    const colorMap: { [key: string]: string } = {
      general: 'bg-gray-100 text-gray-800',
      consultation: 'bg-blue-100 text-blue-800',
      follow_up: 'bg-green-100 text-green-800',
      medication_review: 'bg-purple-100 text-purple-800',
      weight_management: 'bg-orange-100 text-orange-800',
      ed: 'bg-red-100 text-red-800',
      primary_care: 'bg-indigo-100 text-indigo-800',
      mental_health: 'bg-pink-100 text-pink-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const getNoteTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      general: 'General',
      consultation: 'Consultation',
      follow_up: 'Follow-up',
      medication_review: 'Med Review',
      weight_management: 'Weight Mgmt',
      ed: 'ED',
      primary_care: 'Primary Care',
      mental_health: 'Mental Health',
    };
    return typeMap[type] || type;
  };

  if (notesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error loading notes</div>
        <div className="text-red-600 text-sm mt-1">{notesError.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg flex items-center gap-2">
                Clinical Notes 
                <Badge variant="secondary">{filteredNotes.length}</Badge>
            </CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9">
                        <Filter className="h-4 w-4 mr-2" />
                        {filterType === 'all' ? 'All Types' : filterType}
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFilterType('all')}>All Types</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('consultation')}>Consultation Note</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFilterType('follow_up')}>Follow-up</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          {notesLoading ? (
             <div className="h-80 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Loading clinical notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="h-80 flex flex-col items-center justify-center text-center text-muted-foreground bg-gray-50 rounded-lg">
              <FolderOpen className="h-16 w-16 text-gray-400" />
              <p className="mt-4 font-semibold">No notes to display</p>
              <p className="text-sm">Click "Add Note" to create the first clinical note for this patient.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleNoteClick(note)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {note.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getNoteTypeColor(note.note_type)}`}
                        >
                          {getNoteTypeDisplay(note.note_type)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {note.content}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDate(note.createdAt)}</span>
                        <span>•</span>
                        <span>
                          By {note.author || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleNoteClick(note); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Send className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
