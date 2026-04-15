import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Signup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const invite_token = searchParams.get("invite_token");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { user, token, isLoading, login: authLogin } = useAuth();

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
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_data");

            await api("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password,
                    full_name: name,
                    invite_token: invite_token,
                }),
            });

            const loginResponse = await api<any>("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            const userData = await api<any>("/users/me", {
                headers: { Authorization: `Bearer ${loginResponse.access_token}` },
            });

            authLogin(loginResponse.access_token, loginResponse.refresh_token, userData);
            toast.success("Account created successfully!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.data?.detail || "Registration failed.");
            console.error("Signup error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold text-foreground">Create an account</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Join ProjectFlow to manage your tasks better.</p>
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
                                            credential: credentialResponse.credential,
                                            invite_token: invite_token
                                        })
                                    });

                                    localStorage.removeItem("active_workspace_id");

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
                                toast.error("Signup Failed");
                            }}
                            useOneTap
                            theme="outline"
                            size="large"
                            width="320px"
                            text="signup_with"
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
                            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                placeholder="John Doe"
                                required
                            />
                        </div>
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
                            {loading ? "Creating account..." : "Sign up"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
