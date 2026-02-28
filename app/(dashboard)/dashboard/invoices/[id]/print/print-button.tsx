"use client";

import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PrintButton() {
  const router = useRouter();
  return (
    <div className="flex gap-3">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <Button
        onClick={() => window.print()}
        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-500/20"
      >
        <Printer className="w-4 h-4 mr-2" />
        Print / Save as PDF
      </Button>
    </div>
  );
}
