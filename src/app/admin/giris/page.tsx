import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { NotePaper } from "@/components/ui/NotePaper";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Giriş" };

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-4 pt-16">
      <Logo />
      <NotePaper className="mt-10" tilt={-0.5} tape="zeytin">
        <h1 className="text-2xl">Yönetim girişi</h1>
        <LoginForm />
      </NotePaper>
    </div>
  );
}
