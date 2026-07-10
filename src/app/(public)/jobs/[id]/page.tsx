import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getJobById } from "@/actions/job.actions";
import { trackJobView } from "@/actions/analytics.actions";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getJobs } from "@/actions/job.actions";
import { jobPostingSchema, breadcrumbSchema } from "@/lib/jsonld";
import { Building, MapPin, Clock, Briefcase, IndianRupee, Calendar, ArrowLeft, CheckCircle } from "lucide-react";
import { ApplyButton } from "./apply-button";
import { ReportButton } from "./report-button";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const job = await getJobById(id);
  if (!job) return { title: "Job Not Found" };
  const employer = job.employer.employerProfile?.companyName || job.employer.name;
  return {
    title: `${job.title} at ${employer}`,
    description: job.description?.slice(0, 160) || `Apply for ${job.title} in ${job.city || "Hyderabad"}.`,
    openGraph: {
      title: `${job.title} at ${employer}`,
      description: job.description?.slice(0, 200) || `Apply for ${job.title}.`,
      type: "article",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} at ${employer}`,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}/jobs/${id}`,
    },
  };
}

export default async function JobDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [job, user] = await Promise.all([getJobById(id), getCurrentUser()]);

  if (!job) notFound();

  trackJobView(id).catch(() => {});

  const isOwner = user?.id === job.employerId;
  const canApply = user?.role === "WORKER" && job.status === "ACTIVE";

  const { data: relatedJobs } = await getJobs({ city: job.city }, { limit: 3 });
  const related = relatedJobs.filter((j) => j.id !== job.id).slice(0, 3);

  const schemas = [
    breadcrumbSchema([
      { name: "Jobs", url: "/jobs" },
      { name: job.title, url: `/jobs/${job.id}` },
    ]),
    jobPostingSchema({
      title: job.title,
      description: job.description || "",
      location: job.location ?? undefined,
      city: job.city ?? undefined,
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      employerName: job.employer.employerProfile?.companyName || job.employer.name || "",
      postedAt: job.createdAt,
      expiresAt: job.expiresAt,
      shiftType: job.shiftType,
      jobType: job.jobType,
      vacancies: job.vacancies ?? undefined,
    }),
  ];

  return (
    <div className="px-5 lg:px-8 py-8 max-w-5xl mx-auto">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: s }} />
      ))}
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="ghost" className="border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">{job.title}</h1>
                    {job.isFeatured && <Badge variant="info" size="sm" className="shrink-0">Featured</Badge>}
                  </div>
                  <Badge variant={job.status === "ACTIVE" ? "success" : "warning"} size="sm">
                    {job.status === "ACTIVE" ? "Active" : job.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <IndianRupee className="h-4 w-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm font-medium tabular-nums">
                    {job.salaryMin ? `${formatCurrency(job.salaryMin)}${job.salaryMax ? `-${formatCurrency(job.salaryMax)}` : ""}` : "Negotiable"}
                  </p>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm font-medium">{job.location || job.city}</p>
                  <p className="text-xs text-muted-foreground">Location</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Briefcase className="h-4 w-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm font-medium tabular-nums">{job.vacancies}</p>
                  <p className="text-xs text-muted-foreground">{job.vacancies === 1 ? "Vacancy" : "Vacancies"}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" strokeWidth={1.5} />
                  <p className="text-sm font-medium capitalize">{job.shiftType.replace("_", " ").toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground">Shift</p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold">Job Description</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description || "No description provided."}</p>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" strokeWidth={1.5} />
                <span>Posted {formatDate(new Date(job.createdAt))}</span>
                {job.expiresAt && (
                  <>
                    <span className="text-muted-foreground/40">&bull;</span>
                    <span>Expires {formatDate(new Date(job.expiresAt))}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {related.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold">Related Jobs</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {related.map((rj) => (
                  <Link key={rj.id} href={`/jobs/${rj.id}`} className="group">
                    <Card variant="interactive" className="h-full">
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{rj.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{rj.employer.employerProfile?.companyName || rj.employer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <MapPin className="h-3 w-3" strokeWidth={1.5} />
                          <span>{rj.location || rj.city}</span>
                          {rj.salaryMin && (
                            <>
                              <span className="text-muted-foreground/40">&bull;</span>
                              <span>{formatCurrency(rj.salaryMin)}{rj.salaryMax ? `-${formatCurrency(rj.salaryMax)}` : ""}</span>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-20 space-y-4">
            <Card variant="ghost" className="border">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Employer</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                    <Building className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.employer.employerProfile?.companyName || job.employer.name}</p>
                    {job.employer.employerProfile?.isVerified && (
                      <div className="flex items-center gap-1 text-xs text-info">
                        <CheckCircle className="h-3 w-3" /> Verified Employer
                      </div>
                    )}
                  </div>
                </div>

                {canApply && <ApplyButton jobId={job.id} />}

                {!user && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Login to apply for this job</p>
                    <Link href="/login">
                      <Button className="w-full" size="sm">Login</Button>
                    </Link>
                  </div>
                )}

                {isOwner && (
                  <Link href={`/employer/jobs/${job.id}/applicants`}>
                    <Button variant="outline" className="w-full" size="sm">View Applicants</Button>
                  </Link>
                )}

                {job.status === "ACTIVE" && (
                  <div className="mt-3">
                    <ReportButton targetType="JOB" targetId={job.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
