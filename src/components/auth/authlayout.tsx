import type { ReactNode } from "react";

import AuthVisual from "./authvisual";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
   <main className="min-h-screen bg-[#f8f9fc] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        <AuthVisual />

        <section className="flex min-h-screen flex-1 items-center justify-center bg-[#17191f] px-6 py-12 sm:px-10">
          {children}
        </section>
      </div>
    </main>
  );
};

export default AuthLayout;