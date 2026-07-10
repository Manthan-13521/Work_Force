import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getJobs } from "@/actions/job.actions";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { HYDERABAD_ZONES, SHIFT_TYPES } from "@/lib/constants";
import { breadcrumbSchema, websiteSchema } from "@/lib/jsonld";
import { Building, MapPin, Clock, Search, Briefcase, Filter } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Factory Jobs in Hyderabad | Workforce",
  description: "Find verified factory jobs in Hyderabad. Assembly, packaging, machine operation, warehouse, and more. Apply to vetted employers with no fake listings.",
  openGraph: {
    title: "Browse Factory Jobs in Hyderabad | Workforce",
    description: "Find verified factory jobs in Hyderabad. Apply to vetted employers with no fake listings.",
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}/jobs`,
  },
};

export default async function BrowseJobsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);

  const filters = {
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    city: typeof searchParams.city === "string" ? searchParams.city : undefined,
    shiftType: typeof searchParams.shift === "string" ? searchParams.shift : undefined,
    salaryMin: typeof searchParams.salary === "string" ? Number(searchParams.salary) : undefined,
    search: typeof searchParams.q === "string" ? searchParams.q : undefined,
  };

  const { data: jobs, nextCursor, hasMore } = await getJobs(filters, { cursor, limit });

  const schemas = [
    breadcrumbSchema([{ name: "Jobs", url: "/jobs" }]),
    websiteSchema(),
  ];

  return (
    <div className="px-5 lg:px-8 py-8 max-w-7xl mx-auto">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: s }} />
      ))}
      <h1 className="text-2xl font-bold tracking-tight mb-8">Browse Jobs</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <Card variant="ghost" className="border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <h2 className="font-semibold text-sm">Filters</h2>
              </div>

              <form className="space-y-4" method="GET" action="/jobs">
                <div>
                  <label className="text-sm font-medium text-foreground/90 block mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
                    <input
                      name="q"
                      type="text"
                      placeholder="Job title or keyword"
                      className="w-full h-9 rounded-lg border border-input bg-background pl-9 pr-3 text-sm transition-all duration-150 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      defaultValue={filters.search || ""}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground/90 block mb-1">Location</label>
                  <select
                    name="city"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm transition-all duration-150 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={filters.city || ""}
                  >
                    <option value="">All Locations</option>
                    {HYDERABAD_ZONES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground/90 block mb-1">Shift</label>
                  <select
                    name="shift"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm transition-all duration-150 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={filters.shiftType || ""}
                  >
                    <option value="">All Shifts</option>
                    {SHIFT_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground/90 block mb-1">Min Salary</label>
                  <select
                    name="salary"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm transition-all duration-150 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={filters.salaryMin || ""}
                  >
                    <option value="">Any Salary</option>
                    <option value="5000">&#x20B9;5,000+</option>
                    <option value="10000">&#x20B9;10,000+</option>
                    <option value="15000">&#x20B9;15,000+</option>
                    <option value="20000">&#x20B9;20,000+</option>
                    <option value="25000">&#x20B9;25,000+</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">Apply Filters</Button>
              </form>
            </CardContent>
          </Card>
        </aside>

        <div className="lg:col-span-3 space-y-4">
          {jobs.length === 0 ? (
            <Card variant="ghost" className="border">
              <CardContent>
                <EmptyState
                  icon={<Search className="h-10 w-10" />}
                  title="No jobs found"
                  description="Try adjusting your filters or check back later for new listings."
                  action={
                    <Link href="/jobs">
                      <Button variant="outline">Clear Filters</Button>
                    </Link>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="group">
                    <Card variant="interactive" className="h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-1">{job.title}</h3>
                          {job.isFeatured && <Badge variant="info" size="sm" className="shrink-0">Featured</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{job.description}</p>
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
                            <p className="font-semibold text-foreground pt-0.5 text-sm">
                              {formatCurrency(job.salaryMin)}{job.salaryMax ? <span className="text-muted-foreground font-normal"> &ndash; {formatCurrency(job.salaryMax)}</span> : ""}<span className="text-muted-foreground font-normal text-xs"> /mo</span>
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                            <Briefcase className="h-3 w-3" strokeWidth={1.5} />
                            <span>{job.vacancies} position{job.vacancies > 1 ? "s" : ""}</span>
                            <span className="text-muted-foreground/40">&bull;</span>
                            <span className="capitalize">{job.shiftType.replace("_", " ")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <Pagination hasMore={hasMore} nextCursor={nextCursor} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
