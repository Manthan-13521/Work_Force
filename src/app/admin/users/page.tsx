import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers } from "@/actions/admin.actions";
import { formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { UserActions } from "./user-actions";
import { Search } from "lucide-react";

export default async function AdminUsersPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const search = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const { data: users, nextCursor, hasMore } = await getAdminUsers(search, { cursor, limit });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <form method="GET" className="flex gap-2">
          <input
            name="q"
            type="text"
            placeholder="Search by name or phone..."
            defaultValue={search || ""}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm w-64"
          />
          <Button type="submit" variant="outline" size="sm" aria-label="Search users">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No users found" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Joined</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{u.name || "—"}</td>
                      <td className="p-3">{u.phone}</td>
                      <td className="p-3">
                        <Badge variant={u.role === "ADMIN" ? "default" : u.role === "EMPLOYER" ? "verified" : "outline"}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={u.status === "ACTIVE" ? "success" : "danger"}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(new Date(u.createdAt))}</td>
                      <td className="p-3 text-right">
                        <UserActions
                          userId={u.id}
                          role={u.role}
                          status={u.status}
                          isVerified={
                            u.role === "EMPLOYER"
                              ? u.employerProfile?.isVerified || false
                              : u.role === "WORKER"
                              ? u.workerProfile?.isVerified || false
                              : false
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Pagination hasMore={hasMore} nextCursor={nextCursor} />
    </div>
  );
}
