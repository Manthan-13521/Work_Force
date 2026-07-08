import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/shared/badge";
import { getJobs } from "@/actions/job.actions";
import { getPublicStats } from "@/actions/analytics.actions";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { Shield, Search, Zap, Building, Users, CheckCircle, MapPin, Clock } from "lucide-react";

export default async function HomePage() {
  const [{ data: jobs }, stats] = await Promise.all([
    getJobs(),
    getPublicStats(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Find Verified Factory Jobs in{" "}
            <span className="text-primary">Hyderabad</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            The trusted platform connecting industrial workers with verified employers. No fake listings. No spam.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jobs">
              <Button size="lg" className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Find Work
              </Button>
            </Link>
            <Link href="/register?role=employer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <Building className="mr-2 h-4 w-4" />
                Post a Job
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{stats.activeWorkers.toLocaleString("en-IN")}+</p>
              <p className="text-sm text-muted-foreground">Active Workers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.verifiedEmployers.toLocaleString("en-IN")}+</p>
              <p className="text-sm text-muted-foreground">Verified Employers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{stats.totalHires.toLocaleString("en-IN")}+</p>
              <p className="text-sm text-muted-foreground">Jobs Filled</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> For Workers</h3>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Sign Up", desc: "Create your profile in under 2 minutes with phone OTP." },
                  { step: "2", title: "Browse Jobs", desc: "Find factory jobs near you by location, trade, and salary." },
                  { step: "3", title: "Apply & Get Hired", desc: "Apply in one tap. Employers shortlist and hire directly." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-6 flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> For Employers</h3>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Create Account", desc: "Register your company and get verified by our team." },
                  { step: "2", title: "Post a Job", desc: "List factory openings in under 2 minutes." },
                  { step: "3", title: "Review & Hire", desc: "Get applications from verified workers. Shortlist and hire." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      {jobs.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Recent Jobs</h2>
              <Link href="/jobs">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.slice(0, 6).map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1">{job.title}</h3>
                        {job.isFeatured && <Badge variant="verified">Featured</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.description}</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-3.5 w-3.5" />
                          <span>{job.employer.employerProfile?.companyName || job.employer.name}</span>
                          {job.employer.employerProfile?.isVerified && <CheckCircle className="h-3 w-3 text-blue-500" />}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{job.location || job.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatRelativeTime(new Date(job.createdAt))}</span>
                        </div>
                        {job.salaryMin && (
                          <p className="font-medium text-primary">
                            {formatCurrency(job.salaryMin)}{job.salaryMax ? ` - ${formatCurrency(job.salaryMax)}` : ""}/mo
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

      {/* Trust Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Workforce</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "OTP Verified", desc: "Every user is verified with phone OTP" },
              { icon: CheckCircle, title: "Employer Verification", desc: "Companies are reviewed before posting" },
              { icon: Zap, title: "Active Jobs Only", desc: "Stale jobs auto-expire" },
              { icon: Search, title: "Report System", desc: "Flag suspicious listings instantly" },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="p-6 text-center">
                  <item.icon className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80 mb-8">
            Join hundreds of workers and employers in Hyderabad who trust Workforce for their hiring needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create Free Account
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
