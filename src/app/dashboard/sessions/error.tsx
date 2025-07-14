
"use client";

import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Alert variant="destructive" className="max-w-lg">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Sessions</AlertTitle>
        <AlertDescription>
          There was an unexpected error while trying to load the sessions data. You can try refreshing the page.
          <pre className="mt-2 whitespace-pre-wrap text-xs">
            {error.message}
          </pre>
        </AlertDescription>
        </Alert>
        <Button onClick={() => reset()} className="mt-4">
            Try again
        </Button>
    </div>
  );
}
