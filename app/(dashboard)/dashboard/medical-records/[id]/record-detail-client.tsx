"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  PawPrint,
  Stethoscope,
  FileText,
  ArrowLeft,
  Calendar,
  DollarSign,
  AlertCircle,
  Pill,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

/* ─── Types ─── */

interface RecordData {
  id: string;
  visit_date: string;
  chief_complaint: string | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  cost: number;
  image_urls: string[];
  created_at: string;
  pets: {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    date_of_birth: string | null;
    owners: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

/* ─── Component ─── */

export function RecordDetailClient({ record }: { record: RecordData }) {
  const pet = record.pets;
  const owner = pet?.owners;



  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/medical-records"
          className="hover:text-foreground transition-colors"
        >
          Medical Records
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">
          Record for {pet?.name ?? "Unknown"}
        </span>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Medical Record
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(record.visit_date), "MMMM dd, yyyy")}
          </p>
        </div>
        <Button
          variant="outline"
          className="border-border text-foreground hover:bg-accent"
          asChild
        >
          <Link href="/dashboard/medical-records">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Records
          </Link>
        </Button>
      </div>

      {/* ── Info Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pet & Owner */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground">Patient</h3>
            </div>
            {pet ? (
              <div className="space-y-2">
                <Link
                  href={`/dashboard/pets/${pet.id}`}
                  className="text-lg font-bold text-foreground hover:text-emerald-600 transition-colors"
                >
                  {pet.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {pet.breed || pet.species}
                </p>
                {owner && (
                  <p className="text-sm text-muted-foreground">
                    Owner: {owner.first_name} {owner.last_name}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No pet data available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Visit Cost */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-foreground">Visit Cost</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(record.cost)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Clinical Details ── */}
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-5 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-foreground">Clinical Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chief Complaint */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-semibold text-foreground">
                  Chief Complaint
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {record.chief_complaint || "No complaint recorded."}
                </p>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-foreground">
                  Diagnosis
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {record.diagnosis || "No diagnosis recorded."}
                </p>
              </div>
            </div>

            {/* Treatment */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-4 h-4 text-emerald-500" />
                <p className="text-sm font-semibold text-foreground">
                  Treatment
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {record.treatment || "No treatment recorded."}
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pill className="w-4 h-4 text-rose-500" />
                <p className="text-sm font-semibold text-foreground">
                  Notes
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {record.notes || "No notes recorded."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Attached Files ── */}
      {record.image_urls.length > 0 && (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-foreground">
                Attached Files ({record.image_urls.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {record.image_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border overflow-hidden hover:border-indigo-500/30 transition-colors"
                >
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs text-muted-foreground p-2 truncate">
                    File {i + 1}
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
