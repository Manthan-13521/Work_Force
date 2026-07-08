import { redirect, notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getJobApplications } from "@/actions/application.actions";
import { getJobById } from "@/actions/job.actions";
import { formatCurrency } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { User, MapPin, Briefcase, IndianRupee } from "lucide-react";
import { ApplicantActions } from "./applicant-actions";

export default async function JobApplicantsPage(props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);

  const [job, { data: applications, nextCursor, hasMore }] = await Promise.all([
    getJobById(id),
    getJobApplications(id, { cursor, limit }),
  ]);

  if (!job) notFound();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <p className="text-muted-foreground">{job.location || job.city} • {applications.length} applicant{applications.length !== 1 ? "s" : ""}</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              title="No applicants yet"
              description="Wait for workers to apply to this job"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const worker = app.worker;
            const profile = worker.workerProfile;

            return (
              <Card key={app.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{worker.name || "Anonymous"}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{worker.phone}</span>
                          {profile?.isVerified && <Badge variant="success">Verified</Badge>}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  {profile && (
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      {profile.trade && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" />
                          {profile.trade}
                        </span>
                      )}
                      {profile.experienceYears && (
                        <span>{profile.experienceYears} years exp</span>
                      )}
                      {profile.expectedSalary && (
                        <span className="flex items-center gap-1">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {formatCurrency(profile.expectedSalary)}/mo expected
                        </span>
                      )}
                      {worker.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {worker.city}
                        </span>
                      )}
                    </div>
                  )}

                  {app.status === "APPLIED" && (
                    <ApplicantActions applicationId={app.id} />
                  )}

                  {app.status === "HIRED" && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <p className="text-muted-foreground mb-1">Worker&apos;s contact:</p>
                      <p className="font-medium">{worker.phone}</p>
                      <a
                        href={`https://wa.me/91${worker.phone}?text=Hi%20${encodeURIComponent(worker.name || "there")}%2C%20I%20hired%20you%20for%20${encodeURIComponent(job.title)}%20on%20Workforce`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mt-1"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Send WhatsApp
                      </a>
                    </div>
                  )}

                  {app.status === "SHORTLISTED" && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <p className="text-muted-foreground mb-1">Contact worker on WhatsApp:</p>
                      <a
                        href={`https://wa.me/91${worker.phone}?text=Hi%20${encodeURIComponent(worker.name || "there")}%2C%20I%20shortlisted%20you%20for%20${encodeURIComponent(job.title)}%20on%20Workforce`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
