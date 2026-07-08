import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getJobs } from "@/actions/job.actions";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { HYDERABAD_ZONES, SHIFT_TYPES } from "@/lib/constants";
import { Building, MapPin, Clock, Search, CheckCircle, Briefcase, Filter } from "lucide-react";

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Jobs</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className="lg:col-span-1">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <h2 className="font-semibold">Filters</h2>
              </div>

              <form className="space-y-4" method="GET" action="/jobs">
                <div>
                  <label className="text-sm font-medium mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      name="q"
                      type="text"
                      placeholder="Job title or keyword"
                      className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
                      defaultValue={filters.search || ""}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Location</label>
                  <select
                    name="city"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue={filters.city || ""}
                  >
                    <option value="">All Locations</option>
                    {HYDERABAD_ZONES.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Shift</label>
                  <select
                    name="shift"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue={filters.shiftType || ""}
                  >
                    <option value="">All Shifts</option>
                    {SHIFT_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Min Salary</label>
                  <select
                    name="salary"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    defaultValue={filters.salaryMin || ""}
                  >
                    <option value="">Any Salary</option>
                    <option value="5000">₹5,000+</option>
                    <option value="10000">₹10,000+</option>
                    <option value="15000">₹15,000+</option>
                    <option value="20000">₹20,000+</option>
                    <option value="25000">₹25,000+</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">Apply Filters</Button>
              </form>
            </CardContent>
          </Card>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {jobs.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No jobs found"
              description="Try adjusting your filters or check back later for new listings."
              action={
                <Link href="/jobs">
                  <Button variant="outline">Clear Filters</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1">{job.title}</h3>
                        <div className="flex gap-1">
                          {job.isFeatured && <Badge variant="verified">Featured</Badge>}
                        </div>
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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Briefcase className="h-3 w-3" />
                          <span>{job.vacancies} position{job.vacancies > 1 ? "s" : ""}</span>
                          <span>•</span>
                          <span>{job.shiftType.replace("_", " ")}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          <Pagination hasMore={hasMore} nextCursor={nextCursor} />
        </div>
      </div>
    </div>
  );
}
