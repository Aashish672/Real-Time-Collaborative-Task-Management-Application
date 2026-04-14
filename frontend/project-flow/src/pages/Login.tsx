import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate
      const loginResponse = await api<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // 2. Fetch User Profile
      const userData = await api<any>("/users/me", {
        headers: { Authorization: `Bearer ${loginResponse.access_token}` },
      });

      // 3. Store in AuthContext
      authLogin(loginResponse.access_token, userData);
      
      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.data?.detail || "Invalid email or password");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMock = () => {
    setLoading(true);
    toast.info("Connecting to Google...");
    setTimeout(() => {
      // Keep mock for now as requested
      const mockUser = {
        id: "google-user-id",
        full_name: "Google User",
        email: "user@google.com",
      };
      authLogin("mock-google-token", mockUser);
      toast.success("Signed in with Google");
      navigate("/");
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleMock}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 sidebar-transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sidebar-transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:text-primary/80">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
