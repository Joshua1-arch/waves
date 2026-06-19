import { FOOTER_EXPLORE, FOOTER_HELP } from "@/lib/constants";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-brand-black text-brand-white">
      <div className="section-shell section-space">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-serif text-3xl text-brand-gold">WAVE & CO.</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-white/70">
              Architectural eyewear for the discerning individual. Designed in
              Antwerp, manufactured with precision.
            </p>
          </div>
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-widest text-brand-gold">
              Explore
            </p>
            <ul className="space-y-2">
              {FOOTER_EXPLORE.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-white/70 transition-colors hover:text-brand-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-widest text-brand-gold">
              Help
            </p>
            <ul className="space-y-2">
              {FOOTER_HELP.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-white/70 transition-colors hover:text-brand-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-brand-white/10 pt-8 text-[10px] uppercase tracking-widest text-brand-white/50 sm:flex-row">
          <p>© 2024 Wave & Co. Architectural Eyewear</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-brand-white">
              Instagram
            </Link>
            <Link href="#" className="hover:text-brand-white">
              Vogue
            </Link>
            <Link href="#" className="hover:text-brand-white">
              Wallpaper*
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
