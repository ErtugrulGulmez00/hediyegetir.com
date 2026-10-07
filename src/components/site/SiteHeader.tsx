import { Logo } from "@/components/ui/Logo";
import { CartLink } from "./CartLink";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <header>
      <p className="bg-murekkep px-4 py-1.5 text-center font-el text-lg leading-tight text-krem">
        Her parça elde yapılır · siparişini WhatsApp&apos;tan konuşuruz
      </p>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          <NavLinks />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
