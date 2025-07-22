
"use client";

import * as React from "react";
import { Tag as TagIcon, Users, ChevronsUpDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
<<<<<<< HEAD
import { useQuery } from '@tanstack/react-query';
import { dbService } from '@/services/database';
=======
import { db } from "@/lib/firebase";
>>>>>>> c86808d0b17111ddc9466985cfb4fdb8d15a6bfb

type TagItem = {
  id: string;
  name: string;
  color: string;
  patientCount: number;
  createdAt: string;
  description: string;
};

const fetchTags = async () => {
    const response = await dbService.getAll<any>('tags', { sortBy: 'name' });
    if (response.error || !response.data) throw new Error(response.error || 'Failed to fetch tags');
    return response.data.map((tag: any) => ({
        ...tag,
        patientCount: Math.floor(Math.random() * 50), // Mock patient count
        createdAt: tag.createdAt ? format(tag.createdAt.toDate(), "MMM d, yyyy") : "N/A",
    }));
};

export default function TagsPage() {
  const { toast } = useToast();
  const { data: tags = [], isLoading: loading } = useQuery<TagItem[], Error>({
    queryKey: ['tags'],
    queryFn: fetchTags,
    onError: (error) => toast({ variant: "destructive", title: "Error fetching tags", description: error.message }),
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Tags ({tags.length} total)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tags..." className="pl-9 h-9" />
                </div>
                <Button className="h-9"><Plus className="mr-2 h-4 w-4" /> Add Tag</Button>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Checkbox /></TableHead>
                <TableHead>Tag Name</TableHead>
                <TableHead>Patient Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                ))
              ) : tags.map((tag) => (
                    <TableRow key={tag.id}>
                        <TableCell><Checkbox /></TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }}></span>
                                <span className="font-medium">{tag.name}</span>
                            </div>
                        </TableCell>
                        <TableCell>{tag.patientCount}</TableCell>
                        <TableCell>{/* Actions */}</TableCell>
                    </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
