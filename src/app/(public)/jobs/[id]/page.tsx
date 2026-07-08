import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/shared/badge";
import { getJobById } from "@/actions/job.actions";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building, MapPin, Clock, Briefcase, CheckCircle, IndianRupee, Calendar } from "lucide-react";
import { ApplyButton } from "./apply-button";

export default async function JobDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const [job, user] = await Promise.all([getJobById(id), getCurrentUser()]);

  if (!job) notFound();

  // Track view asynchronously
  import("@/actions/analytics.actions").then(({ trackJobView }) => trackJobView(id));

  const isOwner = user?.id === job.employerId;
  const canApply = user?.role === "WORKER" && job.status === "ACTIVE";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/jobs" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
        &larr; Back to Jobs
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold">{job.title}</h1>
                    {job.isFeatured && <Badge variant="verified">Featured</Badge>}
                  </div>
                  <Badge variant={job.status === "ACTIVE" ? "success" : "outline"}>
                    {job.status === "ACTIVE" ? "Active" : job.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {job.salaryMin && (
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <IndianRupee className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-medium">{formatCurrency(job.salaryMin)}{job.salaryMax ? `-${formatCurrency(job.salaryMax)}` : ""}</p>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                  </div>
                )}
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{job.location || job.city}</p>
                  <p className="text-xs text-muted-foreground">Location</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Briefcase className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium">{job.vacancies}</p>
                  <p className="text-xs text-muted-foreground">Vacancies</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm font-medium capitalize">{job.shiftType.replace("_", " ").toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground">Shift</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description || "No description provided."}</p>
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Posted {formatDate(new Date(job.createdAt))}</span>
                {job.expiresAt && (
                  <>
                    <span>•</span>
                    <span>Expires {formatDate(new Date(job.expiresAt))}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Employer</h3>
              <div className="flex items-center gap-2 mb-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{job.employer.employerProfile?.companyName || job.employer.name}</p>
                  {job.employer.employerProfile?.isVerified && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <CheckCircle className="h-3 w-3" /> Verified Employer
                    </div>
                  )}
                </div>
              </div>

              {canApply && (
                <ApplyButton jobId={job.id} />
              )}

              {!user && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm text-muted-foreground">Login to apply for this job</p>
                  <Link href="/login">
                    <Button className="w-full">Login</Button>
                  </Link>
                </div>
              )}

              {isOwner && (
                <Link href={`/employer/jobs/${job.id}/applicants`}>
                  <Button variant="outline" className="w-full mt-3">View Applicants</Button>
                </Link>
              )}

              {user?.role === "WORKER" && job.status === "ACTIVE" && (
                <form action="/api/report" method="post" className="mt-4">
                  <input type="hidden" name="targetType" value="JOB" />
                  <input type="hidden" name="targetId" value={job.id} />
                  <Button variant="ghost" size="sm" className="w-full text-destructive" type="submit">
                    Report this job
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
