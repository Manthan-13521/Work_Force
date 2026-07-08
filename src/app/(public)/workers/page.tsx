import { getWorkers } from "@/actions/worker.actions";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/shared/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { Users } from "lucide-react";

interface WorkersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WorkersPage(props: WorkersPageProps) {
  const raw = await props.searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") sp.set(k, v);
  }
  const { data: workers, hasMore, nextCursor } = await getWorkers(sp);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Browse Workers</h1>
      <p className="text-muted-foreground mb-8">
        Find skilled industrial workers in Hyderabad.
      </p>

      {workers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No workers found"
          description="Workers haven't joined yet. Check back soon."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <div key={worker.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {worker.user.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{worker.user.name || "Worker"}</p>
                    <p className="text-xs text-muted-foreground">{worker.trade || "General Worker"}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <p>{worker.user.city || "Hyderabad"}</p>
                  <p>{worker.experienceYears ? `${worker.experienceYears} years experience` : "Fresher"}</p>
                  <p>{worker.expectedSalary ? `${formatCurrency(worker.expectedSalary)}/mo expected` : ""}</p>
                  {worker.languages.length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-1">
                      {worker.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination hasMore={hasMore} nextCursor={nextCursor} />
        </>
      )}
    </div>
  );
}
