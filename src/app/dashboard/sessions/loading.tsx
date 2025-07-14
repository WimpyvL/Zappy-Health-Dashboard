
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded-md" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-40 rounded-md hidden md:block" />
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="w-1/4"><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell className="w-[15%]"><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell className="w-[15%]"><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell className="w-[15%]"><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell className="w-[15%]"><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell className="w-[10%]"><Skeleton className="h-5 w-3/4" /></TableCell>
                <TableCell className="w-[5%]"><Skeleton className="h-5 w-1/2" /></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

       <div className="flex items-center justify-between">
         <Skeleton className="h-5 w-40 rounded-md" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}
