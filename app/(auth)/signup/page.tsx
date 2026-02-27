"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PawPrint, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    // 1. Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      toast.error(authError?.message ?? "Signup failed");
      setLoading(false);
      return;
    }

    // 2. Safely create clinic and profile via our new Database Function
    const { error: setupError } = await supabase.rpc("create_clinic_and_profile", {
      clinic_name: clinicName,
      user_full_name: fullName,
    });

    if (setupError) {
      toast.error("Failed to setup workspace: " + setupError.message);
      setLoading(false);
      return;
    }

    toast.success("Account created! Redirecting…");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-border bg-card backdrop-blur-xl shadow-2xl relative">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <PawPrint className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Create your clinic
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Get started with CoCo Pet Control
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">
                Your name
              </Label>
              <Input
                id="fullName"
                placeholder="Dr. Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicName" className="text-foreground">
                Clinic name
              </Label>
              <Input
                id="clinicName"
                placeholder="Happy Paws Veterinary Clinic"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/20 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
