import { Logo } from "@/components/ui/Logo";
import { CartLink } from "./CartLink";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <header>
      <p className="bg-murekkep px-4 py-1.5 text-center font-el text-lg leading-tight text-krem">
        Her parça elde yapılır<span className="hidden sm:inline"> · siparişini WhatsApp&apos;tan konuşuruz</span>
      </p>
      <div className="sayfa flex items-center justify-between gap-2 py-4">
        <Logo />
        <div className="flex items-center gap-1.5 sm:gap-4">
          <NavLinks />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
