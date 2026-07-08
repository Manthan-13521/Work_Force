import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers } from "@/actions/admin.actions";
import { formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { ApproveButton } from "./approve-button";
import { Building, User } from "lucide-react";

export default async function AdminApprovalsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const { data: allUsers, nextCursor, hasMore } = await getAdminUsers(undefined, { cursor, limit });

  const pendingEmployers = allUsers.filter(
    (u) => u.role === "EMPLOYER" && u.employerProfile && !u.employerProfile.isVerified
  );
  const pendingWorkers = allUsers.filter(
    (u) => u.role === "WORKER" && u.workerProfile && !u.workerProfile.isVerified && u.workerProfile.idDocUrl
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Approvals</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Employer Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingEmployers.length === 0 ? (
              <EmptyState title="No pending employers" description="All employers are verified" />
            ) : (
              <div className="space-y-3">
                {pendingEmployers.map((u) => (
                  <div key={u.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{u.employerProfile?.companyName || u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.phone}</p>
                      </div>
                      <ApproveButton userId={u.id} type="employer" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Industry: {u.employerProfile?.industry || "N/A"}</p>
                      <p>GST: {u.employerProfile?.gstNumber || "Not provided"}</p>
                      <p>Joined: {formatDate(new Date(u.createdAt))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Worker Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingWorkers.length === 0 ? (
              <EmptyState title="No pending workers" description="All workers with ID docs are verified" />
            ) : (
              <div className="space-y-3">
                {pendingWorkers.map((u) => (
                  <div key={u.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{u.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{u.phone}</p>
                      </div>
                      <ApproveButton userId={u.id} type="worker" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Trade: {u.workerProfile?.trade || "N/A"}</p>
                      <p>Has ID doc: {u.workerProfile?.idDocUrl ? "Yes" : "No"}</p>
                      <p>Joined: {formatDate(new Date(u.createdAt))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
