import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, deleteCategory } from "@/actions/admin.actions";
import { getPaginationParams } from "@/lib/pagination";
import { Pagination } from "@/components/shared/pagination";
import { CategoryForm } from "./category-form";
import { Tags, Trash2 } from "lucide-react";

export default async function AdminCategoriesPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = new URLSearchParams(
    Object.fromEntries(
      Object.entries(searchParams).filter(([, v]) => typeof v === "string")
    ) as Record<string, string>
  );
  const { cursor, limit } = getPaginationParams(sp);
  const { data: categories, nextCursor, hasMore } = await getCategories({ cursor, limit });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <EmptyState icon={<Tags className="h-8 w-8" />} title="No categories" description="Add your first category" />
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <form action={deleteCategory.bind(null, cat.id)}>
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
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
