import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useInvitationInfo, useAcceptInvitation } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Users, Mail, ArrowRight, LogIn } from "lucide-react";

export default function InvitationJoin() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { data: info, isLoading, error } = useInvitationInfo(token);
  const acceptMutation = useAcceptInvitation();

  const token_stored = localStorage.getItem("access_token");

  const handleAccept = async () => {
    if (!token) return;
    
    try {
      await acceptMutation.mutateAsync(token);
      toast.success("Welcome to the workspace!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to join workspace");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-2 border-destructive/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
              <Mail className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Invitation</CardTitle>
            <CardDescription className="text-6xl-transparent">
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">Back to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 animate-in fade-in duration-700">
      <Card className="max-w-md w-full shadow-2xl border-primary/10 overflow-hidden">
        <div className="h-2 bg-primary w-full" />
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">You're Invited!</CardTitle>
          <CardDescription className="text-base">
            <span className="font-semibold text-foreground">{info.inviter_name}</span> has invited you to join the
          </CardDescription>
          <div className="mt-2 py-2 px-4 bg-muted/50 rounded-lg inline-block border border-border">
            <h2 className="text-xl font-bold text-primary">{info.workspace_name}</h2>
          </div>
        </CardHeader>

        <CardContent className="pt-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground italic">
            Collaborate on projects, manage tasks, and stay in sync with your team.
          </p>
          
           {!token_stored && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              Please sign in or create an account to accept this invitation.
            </div>
          )}
        </CardContent>

        <CardFooter className="pb-10 px-8 flex flex-col gap-3">
          {token_stored ? (
            <Button 
              onClick={handleAccept} 
              className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20 group"
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? "Joining..." : "Accept & Join Workspace"}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <div className="w-full flex flex-col gap-2">
               <Button asChild className="w-full h-12 text-lg font-semibold">
                <Link to={`/login?redirect=/join/${token}`}>
                  Log In to Join
                  <LogIn className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/signup?invite_token=${token}`}>Create Account</Link>
              </Button>
            </div>
          )}
          
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest mt-4">
             Invitation expires on {new Date(info.expires_at).toLocaleDateString()}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
