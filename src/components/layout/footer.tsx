import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="mx-auto px-5 lg:px-8 py-12 max-w-7xl">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-md bg-primary text-primary-foreground font-bold text-[10px]">
                W
              </div>
              <span className="font-semibold text-sm">Workforce</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The trusted platform connecting verified industrial workers with vetted employers in Hyderabad.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              OTP verified since 2024
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">For Workers</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/jobs", label: "Browse Jobs" },
                { href: "/register", label: "Create Account" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">For Employers</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/register?role=employer", label: "Post a Job" },
                { href: "/pricing", label: "Pricing" },
                { href: "/register?role=employer", label: "Register Company" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
                { href: "/pricing", label: "Pricing" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Workforce. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Registered in India</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>256-bit encrypted</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Data protected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
