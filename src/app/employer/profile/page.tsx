import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/shared/badge";
import { getCurrentUser } from "@/lib/auth";
import { CompanyProfileForm } from "./company-profile-form";

export default async function EmployerProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") redirect("/login");

  const profile = user.employerProfile;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Company Profile</h1>

      {profile && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold">{profile.companyName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={profile.isVerified ? "success" : "outline"}>
                    {profile.isVerified ? "Verified Employer" : "Pending Verification"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Industry</p>
                <p className="font-medium">{profile.industry || "Not set"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">GST</p>
                <p className="font-medium">{profile.gstNumber || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Company Details</CardTitle>
          <CardDescription>Update your company information for verification</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyProfileForm
            initialData={{
              companyName: profile?.companyName || "",
              industry: profile?.industry || "",
              gstNumber: profile?.gstNumber || "",
              address: profile?.address || "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
