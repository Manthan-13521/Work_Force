import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers } from "@/actions/admin.actions";
import { formatDate } from "@/lib/utils";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { UserActions } from "./user-actions";
import { Search, Users } from "lucide-react";

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
    <div className="p-5 lg:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all platform users</p>
        </div>
        <form method="GET" className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search users..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm ring-offset-background transition-all duration-200 hover:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </form>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="No users found" description={search ? "Try a different search term" : "No users have joined yet"} />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                        {(u.name || u.phone || "?")[0]}
                      </div>
                      <div>
                        <p className="font-medium">{u.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{u.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.phone}</TableCell>
                  <TableCell><Badge variant={u.role === "ADMIN" ? "default" : u.role === "EMPLOYER" ? "info" : "secondary"} size="sm">{u.role}</Badge></TableCell>
                  <TableCell><Badge variant={u.status === "ACTIVE" ? "success" : u.status === "SUSPENDED" ? "danger" : "warning"} size="sm">{u.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(new Date(u.createdAt))}</TableCell>
                  <TableCell className="text-right"><UserActions userId={u.id} status={u.status} role={u.role} isVerified={u.workerProfile?.isVerified ?? u.employerProfile?.isVerified ?? false} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-border/30">
            <Pagination nextCursor={nextCursor ?? null} hasMore={hasMore} />
          </div>
        </div>
      )}
    </div>
  );
}
