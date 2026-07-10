import { organizationSchema, websiteSchema } from "@/lib/jsonld";

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: organizationSchema() }}
    />
  );
}

export function WebsiteSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: websiteSchema() }}
    />
  );
}
