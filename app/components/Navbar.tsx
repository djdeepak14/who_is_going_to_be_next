"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useLanguage } from "@/app/context/LanguageContext";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { lang, toggleLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen]);

  const navLinks = [
    { href: "/", labelNp: "गिरफ्तारीहरू", labelEn: "Arrestees" },
    { href: "/polls", labelNp: "अर्को गिरफ्तारी पोल", labelEn: "Next Arrest Polls" },
  ];

  return (
    <nav className="ui-nav-shell fixed top-0 w-full z-50">
      <div className="flex justify-between items-center h-16 px-6 md:px-12 w-full max-w-screen-2xl mx-auto font-ui tracking-tight">
        <Link href="/" className="flex items-center gap-2 text-on-surface">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary text-sm font-black">WN</span>
          <span className="text-lg md:text-xl font-black tracking-tight">Who Is Next</span>
        </Link>

        <div className="hidden md:flex items-center gap-3 rounded-full bg-surface-container px-3 py-2 border border-outline-variant/30">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${pathname === link.href ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"}`}
            >
              {lang === "Np" ? link.labelNp : link.labelEn}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={toggleLanguage} className="px-2.5 py-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all flex items-center gap-1 border border-transparent hover:border-outline-variant/25">
            <span className="material-symbols-outlined">translate</span>
            <span className="text-xs font-bold">{lang === "Np" ? "En" : "ने"}</span>
          </button>

          <div className="md:hidden">
            <button
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
              aria-label="Open menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="material-symbols-outlined text-2xl">
                {menuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>

          <div className="hidden md:block">
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all">
                  <span className="material-symbols-outlined">login</span>
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30">
          <div
            ref={menuRef}
            className="ui-nav-panel absolute top-16 right-4 rounded-xl p-4 min-w-[200px] flex flex-col gap-2"
            role="dialog"
            aria-modal="true"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2 rounded-lg text-sm font-bold transition-all ${pathname === link.href ? "bg-primary text-on-primary shadow-sm" : "text-on-surface hover:bg-surface-container-high"}`}
                onClick={() => setMenuOpen(false)}
              >
                {lang === "Np" ? link.labelNp : link.labelEn}
              </Link>
            ))}
            <div className="border-t border-outline-variant/30 my-2" />
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all">
                  <span className="material-symbols-outlined">login</span>
                  {lang === "Np" ? "साइन इन" : "Sign In"}
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}