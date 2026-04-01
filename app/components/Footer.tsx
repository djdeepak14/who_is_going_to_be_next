"use client";

import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  // Define bilingual links
  const footerLinks = [
    { href: "#", labelNp: "कानूनी", labelEn: "Legal" },
    { href: "#", labelNp: "विधि", labelEn: "Methodology" },
    { href: "#", labelNp: "गोपनीयता नीति", labelEn: "Privacy Policy" },
    { href: "#", labelNp: "सम्पर्क", labelEn: "Contact" },
  ];

  return (
    <footer className="ui-footer-shell w-full mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start py-12 px-6 md:px-12 w-full gap-10 max-w-screen-2xl mx-auto antialiased">
        
        {/* Brand & Description Section */}
        <div className="flex flex-col gap-4 max-w-md">
          <div className="text-xl font-black font-headline text-on-surface tracking-tight">
            Who Is Next
          </div>
          <p className="text-sm ui-text-muted leading-relaxed">
            {lang === "Np"
              ? "नेपालको डिजिटल युगमा सार्वजनिक हित, पारदर्शिता र पत्रकारिताको निष्ठाको लागि समर्पित प्लेटफर्म।"
              : "Dedicated to public interest transparency and journalistic integrity in the digital age of Nepal."}
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {footerLinks.map((link) => (
            <Link
              key={link.labelEn}
              href={link.href}
              className="text-sm ui-link-muted font-ui"
            >
              {lang === "Np" ? link.labelNp : link.labelEn}
            </Link>
          ))}
        </div>

        {/* Copyright Section */}
        <div className="text-xs font-medium text-outline text-left md:text-right">
          <p>
            {lang === "Np"
              ? "© २०२६ Who Is Next"
              : "© 2026 Who Is Next"}
          </p>
          <p className="mt-1">
            {lang === "Np" 
              ? "सार्वजनिक हित पारदर्शिता प्लेटफर्म, नेपाल।" 
              : "Public Interest Transparency Platform, Nepal."}
          </p>
        </div>
      </div>
    </footer>
  );
}