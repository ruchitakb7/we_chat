import {
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

const AuthVisual = () => {
  return (
    <section className="relative hidden overflow-hidden bg-[#0d1117] lg:flex lg:w-1/2 lg:items-center lg:justify-center">
   
      <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-violet-600/20 blur-[100px]" />

      <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="relative z-10  max-w-xl">
      
        <div className="mb-16 flex items-center gap-3 self-start">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/20">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>

          <span className="text-xl font-semibold text-white">
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

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
            <Zap className="mb-3 h-5 w-5 text-violet-400" />

            <p className="text-sm font-medium text-white">
              Real-time
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Instant messaging
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
            <MessageCircle className="mb-3 h-5 w-5 text-violet-400" />

            <p className="text-sm font-medium text-white">
              Group chats
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Chat with everyone
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
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
  );
};

export default AuthVisual;