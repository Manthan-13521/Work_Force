export type EventCategory =
  | "authentication"
  | "employer"
  | "worker"
  | "payment"
  | "admin"
  | "system"
  | "engagement"
  | "performance";

export type AnalyticsEvent = {
  name: string;
  category: EventCategory;
  properties?: Record<string, unknown>;
};

// ── Authentication ──
export const AUTH_EVENTS = {
  LOGIN_STARTED: { name: "login_started", category: "authentication" as const },
  OTP_REQUESTED: { name: "otp_requested", category: "authentication" as const },
  OTP_VERIFIED: { name: "otp_verified", category: "authentication" as const },
  LOGIN_SUCCESS: { name: "login_success", category: "authentication" as const },
  LOGIN_FAILURE: { name: "login_failure", category: "authentication" as const },
  REGISTRATION_STARTED: { name: "registration_started", category: "authentication" as const },
  REGISTRATION_STEP: { name: "registration_step", category: "authentication" as const },
  REGISTRATION_COMPLETED: { name: "registration_completed", category: "authentication" as const },
  REGISTRATION_ABANDONED: { name: "registration_abandoned", category: "authentication" as const },
} as const;

// ── Employer ──
export const EMPLOYER_EVENTS = {
  JOB_CREATED: { name: "job_created", category: "employer" as const },
  JOB_DRAFT_SAVED: { name: "job_draft_saved", category: "employer" as const },
  JOB_PUBLISHED: { name: "job_published", category: "employer" as const },
  JOB_EDITED: { name: "job_edited", category: "employer" as const },
  JOB_CLOSED: { name: "job_closed", category: "employer" as const },
  CREDITS_PURCHASED: { name: "credits_purchased", category: "employer" as const },
  JOB_VIEWED: { name: "job_viewed", category: "employer" as const },
  APPLICANT_SHORTLISTED: { name: "applicant_shortlisted", category: "employer" as const },
  APPLICANT_HIRED: { name: "applicant_hired", category: "employer" as const },
} as const;

// ── Worker ──
export const WORKER_EVENTS = {
  SEARCH: { name: "search", category: "worker" as const },
  FILTER_USED: { name: "filter_used", category: "worker" as const },
  JOB_VIEWED: { name: "job_viewed", category: "worker" as const },
  APPLY_STARTED: { name: "apply_started", category: "worker" as const },
  APPLY_SUBMITTED: { name: "apply_submitted", category: "worker" as const },
  RESUME_UPLOADED: { name: "resume_uploaded", category: "worker" as const },
  PROFILE_UPDATED: { name: "profile_updated", category: "worker" as const },
} as const;

// ── Payments ──
export const PAYMENT_EVENTS = {
  CHECKOUT_STARTED: { name: "checkout_started", category: "payment" as const },
  PAYMENT_SUCCESS: { name: "payment_success", category: "payment" as const },
  PAYMENT_FAILURE: { name: "payment_failure", category: "payment" as const },
  WEBHOOK_SUCCESS: { name: "webhook_success", category: "payment" as const },
  WEBHOOK_FAILURE: { name: "webhook_failure", category: "payment" as const },
  PLAN_VIEWED: { name: "plan_viewed", category: "payment" as const },
  PLAN_SELECTED: { name: "plan_selected", category: "payment" as const },
} as const;

// ── Admin ──
export const ADMIN_EVENTS = {
  REPORT_REVIEWED: { name: "report_reviewed", category: "admin" as const },
  USER_APPROVED: { name: "user_approved", category: "admin" as const },
  USER_SUSPENDED: { name: "user_suspended", category: "admin" as const },
  CATEGORY_CREATED: { name: "category_created", category: "admin" as const },
  DASHBOARD_VIEWED: { name: "dashboard_viewed", category: "admin" as const },
} as const;

// ── System ──
export const SYSTEM_EVENTS = {
  API_ERROR: { name: "api_error", category: "system" as const },
  SLOW_REQUEST: { name: "slow_request", category: "system" as const },
  CACHE_HIT: { name: "cache_hit", category: "system" as const },
  CACHE_MISS: { name: "cache_miss", category: "system" as const },
  PAGE_LOADED: { name: "page_loaded", category: "performance" as const },
  SLOW_PAGE: { name: "slow_page", category: "performance" as const },
} as const;

// ── Enums for types ──
export type AuthEventName = (typeof AUTH_EVENTS)[keyof typeof AUTH_EVENTS]["name"];
export type EmployerEventName = (typeof EMPLOYER_EVENTS)[keyof typeof EMPLOYER_EVENTS]["name"];
export type WorkerEventName = (typeof WORKER_EVENTS)[keyof typeof WORKER_EVENTS]["name"];
export type PaymentEventName = (typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS]["name"];
export type AdminEventName = (typeof ADMIN_EVENTS)[keyof typeof ADMIN_EVENTS]["name"];
export type SystemEventName = (typeof SYSTEM_EVENTS)[keyof typeof SYSTEM_EVENTS]["name"];

export type AllEventName =
  | AuthEventName
  | EmployerEventName
  | WorkerEventName
  | PaymentEventName
  | AdminEventName
  | SystemEventName;

export const ALL_EVENTS = {
  ...AUTH_EVENTS,
  ...EMPLOYER_EVENTS,
  ...WORKER_EVENTS,
  ...PAYMENT_EVENTS,
  ...ADMIN_EVENTS,
  ...SYSTEM_EVENTS,
} as const;
