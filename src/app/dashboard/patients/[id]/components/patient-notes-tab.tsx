
"use client";

import React from "react";
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
import { Search, Plus, Filter, FolderOpen, MoreVertical, MessageSquare, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data for notes, can be replaced with real data later
const mockNotes: any[] = [
  // No notes, so we will show the empty state.
];


export function PatientNotesTab() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            Clinical Notes 
            <Badge variant="secondary">{mockNotes.length}</Badge>
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
        {mockNotes.length > 0 ? (
          <div className="space-y-4">
            {/* Note items would be mapped here */}
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
