import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/auth/authlayout";
import { signupUser } from "@/service/authservice";

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await signupUser(formValues.email, formValues.password);
      navigate("/login");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to create your account right now. Please try again.";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
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

            <span className="text-lg font-semibold">WeTalk</span>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Create your account
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Join WeTalk and start connecting with your people.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {errorMessage ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Email
            </label>

            <Input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="h-12 rounded-xl border-white/10 bg-[#1d2027] text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
              required
            />
          </div>

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
                name="password"
                type={showPassword ? "text" : "password"}
                value={formValues.password}
                onChange={handleChange}
                placeholder="Create a password"
                className="h-12 rounded-xl border-white/10 bg-[#1d2027] pr-12 text-white placeholder:text-slate-500 focus-visible:ring-violet-500"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-violet-600 text-sm font-semibold hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />

          <span className="text-xs font-medium text-slate-500">OR</span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

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

          Sign up with Google
        </Button>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-violet-400 hover:text-violet-300"
          >
            Log in
          </Link>
        </p>

        <p className="mt-10 text-center text-xs leading-5 text-slate-600">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;