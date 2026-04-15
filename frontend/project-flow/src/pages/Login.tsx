import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();
  const { user, token, isLoading, login: authLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user && token) {
      navigate("/");
    }
  }, [user, token, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      localStorage.removeItem("active_workspace_id");

      const loginResponse = await api<any>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const userData = await api<any>("/users/me", {
        headers: { Authorization: `Bearer ${loginResponse.access_token}` },
      });

      authLogin(loginResponse.access_token, loginResponse.refresh_token, userData);

      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.data?.detail || "Invalid email or password");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to continue</p>
        </div>

        <div className="space-y-4">
          <div className="flex w-full justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (!credentialResponse.credential) return;
                setLoading(true);
                try {
                  const oauthResponse = await api<any>("/auth/oauth", {
                    method: "POST",
                    body: JSON.stringify({
                      credential: credentialResponse.credential
                    })
                  });

                  const userData = await api<any>("/users/me", {
                    headers: { Authorization: `Bearer ${oauthResponse.access_token}` },
                  });

                  authLogin(oauthResponse.access_token, oauthResponse.refresh_token, userData);
                  toast.success("Signed in with Google");
                  navigate("/");
                } catch (error) {
                  toast.error("Google sign-in failed");
                } finally {
                  setLoading(false);
                }
              }}
              onError={() => {
                toast.error("Login Failed");
              }}
              useOneTap
              theme="outline"
              size="large"
              width="320px"
              text="continue_with"
            />
          </div>

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
