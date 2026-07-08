import Link from "next/link";
import { Briefcase } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <Briefcase className="h-5 w-5 text-primary" />
              <span>Workforce</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Verified industrial labour hiring platform for Hyderabad. Connecting trusted employers with skilled workers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">For Workers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/jobs" className="hover:text-primary transition-colors">Browse Jobs</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Create Profile</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">For Employers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/register" className="hover:text-primary transition-colors">Post a Job</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Workforce. All rights reserved. Hyderabad, India.
        </div>
      </div>
    </footer>
  );
}
