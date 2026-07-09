import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/employer/", "/worker/", "/api/"],
    },
    sitemap: "https://workforce.in/sitemap.xml",
  };
}
