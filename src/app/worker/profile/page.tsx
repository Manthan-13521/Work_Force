import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/shared/badge";
import { getCurrentUser } from "@/lib/auth";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Camera, IdCard, User as UserIcon } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { UploadForm } from "./upload-form";

export default async function WorkerProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "WORKER") redirect("/login");

  const profile = user.workerProfile;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              {profile?.photoUrl ? (
                <Image src={profile.photoUrl} alt="" width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user.name || "Add your name"}</h2>
              <p className="text-sm text-muted-foreground">{profile?.trade || "No trade selected"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={profile?.isVerified ? "success" : "outline"}>
                  {profile?.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">City</p>
              <p className="font-medium">{user.city || "Not set"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Experience</p>
              <p className="font-medium">{profile?.experienceYears ? `${profile.experienceYears} years` : "Not set"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expected Salary</p>
              <p className="font-medium">{profile?.expectedSalary ? formatCurrency(profile.expectedSalary) + "/mo" : "Not set"}</p>
            </div>
          </div>

          {profile?.languages && profile.languages.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">Languages</p>
              <div className="flex gap-2">
                {profile.languages.map((lang) => (
                  <Badge key={lang} variant="outline">{lang}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <UploadForm
              action="photo"
              label={profile?.photoUrl ? "Change Photo" : "Upload Photo"}
              icon={<Camera className="h-4 w-4" />}
            />
            <UploadForm
              action="id"
              label={profile?.idDocUrl ? "Change ID" : "Upload ID Proof"}
              icon={<IdCard className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your trade, experience, and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialData={{
              trade: profile?.trade || "",
              experienceYears: profile?.experienceYears || 0,
              expectedSalary: profile?.expectedSalary || 0,
              city: user.city || "",
              languages: profile?.languages || [],
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
