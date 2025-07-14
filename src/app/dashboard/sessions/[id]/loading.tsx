"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div>
          <Skeleton className="h-8 w-48 mb-1 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-1/3 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-1/4 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-1/3 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>
      </div>
      
       <div className="flex justify-between items-center bg-slate-100 p-4 rounded-lg">
          <Skeleton className="h-5 w-1/3 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
      </div>
    </div>
  );
}
