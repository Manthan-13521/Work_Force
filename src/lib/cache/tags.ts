export const Tags = {
  JOBS: "jobs",
  JOB: (id: string) => `job:${id}`,
  WORKER: (id: string) => `worker:${id}`,
  EMPLOYER: (id: string) => `employer:${id}`,
  DASHBOARD_EMPLOYER: "dashboard:employer",
  DASHBOARD_WORKER: "dashboard:worker",
  DASHBOARD_ADMIN: "dashboard:admin",
  CATEGORIES: "categories",
  CITIES: "cities",
  PRICING: "pricing",
  STATISTICS: "statistics",
  NOTIFICATIONS: "notifications",
  PROFILE: "profile",
  APPLICATIONS: "applications",
  REPORTS: "reports",
  PAYMENTS: "payments",
  ANALYTICS: "analytics",
  PUBLIC_STATS: "public-stats",
  SITEMAP: "sitemap",
  HEALTH: "health",
} as const;

export type Tag = (typeof Tags)[keyof typeof Tags];
