import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/auth/authlayout";
import { useAuth } from "@/context/AuthContext";
import { loginUser } from "@/service/authservice";

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshUser, user:currentUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if(currentUser) {
    navigate("/dashboard", { replace: true });
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginResponse = await loginUser({
        email,
        password,
      });

      if (loginResponse?.success === false) {
        setError(loginResponse?.message || "Invalid email or password.");
        return;
      }

      const loggedIn = await refreshUser();

      if (!loggedIn) {
        setError("Login succeeded but your session could not be verified. Please try again.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Login failed:", error);

      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-[420px]">

        <div className="mb-10 flex justify-center lg:hidden">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
              <MessageCircle className="h-5 w-5" />
            </div>

            <span className="text-lg font-semibold">
              WeTalk
            </span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-9">
          <h2 className="text-3xl font-semibold tracking-tight">
            Log into WeTalk
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Welcome back. Continue your conversations.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email
            </label>

            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border-white/10 bg-[#1d2027] text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Password
            </label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-white/10 bg-[#1d2027] pr-12 text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login */}
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold hover:bg-violet-700"
          >
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </form>

        {/* Forgot password */}
        <div className="mt-5 text-center">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Forgot password?
          </Link>
        </div>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-xs font-medium text-slate-500">
            OR
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Google */}
        <Button
          onClick={() => {
            window.location.href =
              import.meta.env.VITE_API_URL + "/auth/google";
          }}
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl border-white/10 bg-transparent text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white"
        >
          <span className="mr-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700">
            G
          </span>

          Continue with Google
        </Button>

        {/* Signup */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-violet-400 hover:text-violet-300"
          >
            Sign up
          </Link>
        </p>

        <p className="mt-12 text-center text-xs leading-5 text-slate-600">
          By continuing, you agree to our Terms of Service and
          Privacy Policy.
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;