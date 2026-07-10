import type { Metadata } from "next";
import { getWorkers } from "@/actions/worker.actions";
import { Pagination } from "@/components/shared/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { breadcrumbSchema } from "@/lib/jsonld";
import { Users, MapPin, Briefcase, IndianRupee } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Verified Industrial Workers in Hyderabad | Workforce",
  description: "Find skilled factory workers in Hyderabad. Browse verified profiles by trade, experience, and location. Hire with confidence.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}/workers`,
  },
};

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

  const schemas = [
    breadcrumbSchema([{ name: "Workers", url: "/workers" }]),
  ];

  return (
    <div className="px-5 lg:px-8 py-8 max-w-7xl mx-auto">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: s }} />
      ))}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Browse Workers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Find skilled industrial workers in Hyderabad.
        </p>
      </div>

      {workers.length === 0 ? (
        <Card variant="ghost" className="border">
          <CardContent>
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No workers found"
              description="Workers haven't joined yet. Check back soon."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workers.map((worker) => (
              <Card key={worker.id} variant="ghost" className="border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                      {worker.user.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{worker.user.name || "Worker"}</p>
                      <p className="text-xs text-muted-foreground truncate">{worker.trade || "General Worker"}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{worker.user.city || "Hyderabad"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <span>{worker.experienceYears ? `${worker.experienceYears} years experience` : "Fresher"}</span>
                    </div>
                    {worker.expectedSalary ? (
                      <div className="flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" strokeWidth={1.5} />
                        <span>{formatCurrency(worker.expectedSalary)}/mo expected</span>
                      </div>
                    ) : null}
                  </div>
                  {worker.languages.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {worker.languages.map((lang) => (
                        <Badge key={lang} variant="secondary" size="sm">{lang}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination hasMore={hasMore} nextCursor={nextCursor} />
        </div>
      )}
    </div>
  );
}
