
"use client";

import React, { useState, useEffect } from "react";
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
import { Search, Plus, Filter, FolderOpen, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { db } from "@/lib/firebase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientNotesTabProps {
  patientId: string;
}

export function PatientNotesTab({ patientId }: PatientNotesTabProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchNotes = async () => {
      if (!patientId) {
          setLoading(false);
          return;
      }
      setLoading(true);
      try {
        const q = query(
          collection(db, "notes"), 
          where("patientId", "==", patientId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const notesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotes(notesData);
      } catch (error) {
        console.error("Error fetching notes: ", error);
        toast({ variant: "destructive", title: "Failed to load notes." });
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [patientId, toast]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Clinical Notes 
            <Badge variant="secondary">{notes.length}</Badge>
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notes..." className="pl-9 h-9" />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    All Types
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Consultation Note</DropdownMenuItem>
                    <DropdownMenuItem>Follow-up</DropdownMenuItem>
                    <DropdownMenuItem>Lab Review</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
             <div className="h-80 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Loading clinical notes...</p>
            </div>
        ) : notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map(note => (
                <div key={note.id} className="p-4 border rounded-md">
                    <h3 className="font-semibold">{note.title}</h3>
                    <p className="text-sm text-muted-foreground">
                        By {note.author} on {format(note.createdAt.toDate(), 'MMM dd, yyyy')}
                    </p>
                    <p className="text-sm mt-2">{note.content}</p>
                </div>
            ))}
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-center text-muted-foreground bg-gray-50 rounded-lg">
            <FolderOpen className="h-16 w-16 text-gray-400" />
            <p className="mt-4 font-semibold">No notes to display</p>
            <p className="text-sm">Click "Add Note" to create the first clinical note for this patient.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
