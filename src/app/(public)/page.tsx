import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo";
import { getJobs } from "@/actions/job.actions";
import { getPublicStats } from "@/actions/analytics.actions";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Shield, Search, Building, Users, Briefcase, MapPin, Clock, ArrowRight, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Workforce — Verified Industrial Labour Hiring in Hyderabad",
  description:
    "The trusted platform connecting verified industrial workers with vetted employers in Hyderabad. No fake listings. No spam.",
  openGraph: {
    title: "Workforce — Verified Industrial Labour Hiring",
    description:
      "The trusted platform connecting verified industrial workers with vetted employers in Hyderabad.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in",
    siteName: "Workforce",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Workforce — Verified Industrial Labour Hiring",
    description:
      "The trusted platform connecting verified industrial workers with vetted employers in Hyderabad.",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in",
  },
};

export default async function HomePage() {
  const [{ data: jobs }, stats] = await Promise.all([
    getJobs(),
    getPublicStats(),
  ]);

  return (
    <div>
      <OrganizationSchema />
      <WebsiteSchema />
      <section className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 right-0 w-[800px] h-[800px] bg-primary/[0.02] rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/[0.015] rounded-full blur-3xl" />
        </div>

        <div className="relative px-5 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/[0.06] border border-primary/[0.08] text-xs font-medium text-primary mb-6">
              <Shield className="h-3 w-3" />
              Trusted by 10,000+ workers in Hyderabad
            </div>
            <h1 className="text-[2rem] md:text-[3.25rem] font-bold tracking-tight leading-[1.08] mb-5 text-balance">
              Find verified factory jobs in{" "}
              <span className="text-primary">Hyderabad</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed text-balance">
              The trusted platform connecting verified industrial workers with vetted employers. No fake listings. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/jobs">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Search className="h-4 w-4" />
                  Find Work
                </Button>
              </Link>
              <Link href="/register?role=employer">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                  <Building className="h-4 w-4" />
                  Post a Job
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/20">
        <div className="mx-auto px-5 lg:px-8 py-10 max-w-2xl">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: stats.activeWorkers.toLocaleString("en-IN") + "+", label: "Active Workers", icon: Users },
              { value: stats.verifiedEmployers.toLocaleString("en-IN") + "+", label: "Verified Employers", icon: Building },
              { value: stats.totalHires.toLocaleString("en-IN") + "+", label: "Jobs Filled", icon: Briefcase },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="space-y-1">
                <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{value}</p>
                <div className="flex items-center justify-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">How it works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three simple steps to find work or hire talent in Hyderabad.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/[0.06] border border-primary/[0.08] text-xs font-medium text-primary">
                <Users className="h-3 w-3" />
                For Workers
              </div>
              {[
                { step: "01", title: "Create your profile", desc: "Sign up with email OTP in under 2 minutes. Add your trade, experience, and preferences." },
                { step: "02", title: "Browse and apply", desc: "Find factory jobs near you by location, trade, and salary range. Apply with one tap." },
                { step: "03", title: "Get hired", desc: "Employers shortlist and contact verified workers directly. No middlemen." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/[0.08] text-primary flex items-center justify-center font-semibold text-xs transition-transform duration-150 group-hover:scale-105">
                    {item.step}
                  </div>
                  <div className="pt-0.5">
                    <h4 className="font-medium text-sm mb-0.5">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/[0.06] border border-primary/[0.08] text-xs font-medium text-primary">
                <Building className="h-3 w-3" />
                For Employers
              </div>
              {[
                { step: "01", title: "Register and get verified", desc: "Create your company profile and get verified by our team within 24 hours." },
                { step: "02", title: "Post a job", desc: "List your factory openings with salary, shift, and location. Takes under 2 minutes." },
                { step: "03", title: "Review and hire", desc: "Receive applications from pre-verified workers. Shortlist, contact, and hire." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/[0.08] text-primary flex items-center justify-center font-semibold text-xs transition-transform duration-150 group-hover:scale-105">
                    {item.step}
                  </div>
                  <div className="pt-0.5">
                    <h4 className="font-medium text-sm mb-0.5">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {jobs.length > 0 && (
        <section className="py-20 px-5 lg:px-8 bg-muted/20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">Recent job openings</h2>
                <p className="text-muted-foreground">Discover the latest factory jobs in Hyderabad.</p>
              </div>
              <Link href="/jobs">
                <Button variant="outline" size="sm" className="gap-2">
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.slice(0, 6).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="group">
                  <Card variant="interactive" className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">
                          {job.title}
                        </h3>
                        {job.isFeatured && <Badge variant="info" size="sm" className="shrink-0">Featured</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{job.employer.employerProfile?.companyName || job.employer.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{job.location || job.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                          <span>{formatRelativeTime(new Date(job.createdAt))}</span>
                        </div>
                        {job.salaryMin && (
                          <p className="font-semibold text-foreground pt-1.5 text-sm">
                            {formatCurrency(job.salaryMin)}
                            {job.salaryMax ? <span className="text-muted-foreground font-normal"> &ndash; {formatCurrency(job.salaryMax)}</span> : ""}
                            <span className="text-muted-foreground font-normal text-xs"> /mo</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 px-5 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Why choose Workforce</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Built to make industrial hiring in Hyderabad safer, faster, and more reliable.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "OTP verified", desc: "Every user is verified with email OTP &mdash; no fake accounts" },
              { icon: Star, title: "Employer verification", desc: "Companies are reviewed before they can post jobs" },
              { icon: Clock, title: "Active jobs only", desc: "Listings auto-expire so you never see stale posts" },
              { icon: Search, title: "Report system", desc: "Flag suspicious listings instantly &mdash; we take action" },
            ].map((item) => (
              <Card key={item.title} variant="ghost" className="border">
                <CardContent className="p-5">
                  <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/[0.06] text-primary mb-3">
                    <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-5 lg:px-8 bg-primary">
        <div className="mx-auto text-center max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight mb-3">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/70 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Join thousands of workers and employers in Hyderabad who trust Workforce for hiring.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/10 gap-2">
                <Search className="h-4 w-4" />
                Browse jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
