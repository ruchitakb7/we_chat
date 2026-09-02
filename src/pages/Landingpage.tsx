import { Link, Navigate } from "react-router-dom";
import { MessageCircle, ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const LandingPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f9fc] text-slate-500">
        Loading...
      </main>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        
        {/* Left Section */}
        <section className="relative flex min-h-[500px] flex-1 items-center justify-center overflow-hidden bg-[#111827] px-8 py-16 lg:min-h-screen lg:px-16">
       
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative z-10 max-w-xl">
          
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>

              <span className="text-xl font-semibold tracking-tight text-white">
                WeTalk
              </span>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Simple. Fast. Real-time.
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Connect with your
                <span className="block text-violet-400">
                  close friends.
                </span>
              </h1>

              <p className="max-w-lg text-base leading-7 text-slate-400 sm:text-lg">
                Chat with your friends, create groups, and stay connected
                with real-time conversations — all in one simple place.
              </p>
            </div>

         
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Zap className="mb-3 h-5 w-5 text-violet-400" />

                <p className="text-sm font-medium text-white">
                  Real-time
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Instant messaging
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <MessageCircle className="mb-3 h-5 w-5 text-violet-400" />

                <p className="text-sm font-medium text-white">
                  Group chats
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Chat with everyone
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-violet-400" />

                <p className="text-sm font-medium text-white">
                  Private
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Your conversations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Section */}
        <section className="flex min-h-[500px] flex-1 items-center justify-center bg-white px-6 py-16 sm:px-10 lg:min-h-screen lg:px-16">
          
          <div className="w-full max-w-md">
            
            {/* Logo */}
            <div className="mb-10 flex justify-center lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>

                <span className="text-lg font-semibold">
                  WeTalk
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
                <MessageCircle className="h-8 w-8 text-violet-600" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome to WeTalk
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your conversations, your people, all in one place.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-10 space-y-3">
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-xl bg-violet-600 text-sm font-medium shadow-sm hover:bg-violet-700"
              >
                <Link to="/login">
                  Log in

                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-xl border-slate-200 text-sm font-medium hover:bg-slate-50"
              >
                <Link to="/signup">
                  Create an account
                </Link>
              </Button>
            </div>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs text-slate-400">
                SIMPLE & SECURE
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to our Terms of Service and
              Privacy Policy.
            </p>

            <p className="mt-8 text-center text-sm text-slate-500">
              New to WeTalk?{" "}
              <Link
                to="/signup"
                className="font-semibold text-violet-600 hover:text-violet-700"
              >
                Sign up
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LandingPage;