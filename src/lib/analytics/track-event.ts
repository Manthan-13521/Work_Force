import { track } from ".";
import {
  AUTH_EVENTS,
  EMPLOYER_EVENTS,
  WORKER_EVENTS,
  PAYMENT_EVENTS,
  ADMIN_EVENTS,
  SYSTEM_EVENTS,
  type AuthEventName,
} from "./events";

type EventDefinition = {
  name: string;
  category: string;
};

function fire(eventDef: EventDefinition, properties?: Record<string, unknown>) {
  return track(eventDef.name, {
    category: eventDef.category,
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

// ── Authentication ──
export function trackAuthEvent(event: EventDefinition & { name: AuthEventName }, properties?: Record<string, unknown>) {
  return fire(event, properties);
}

export const trackLoginStarted = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.LOGIN_STARTED, props);
export const trackOtpRequested = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.OTP_REQUESTED, props);
export const trackOtpVerified = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.OTP_VERIFIED, props);
export const trackLoginSuccess = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.LOGIN_SUCCESS, props);
export const trackLoginFailure = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.LOGIN_FAILURE, props);
export const trackRegistrationStarted = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.REGISTRATION_STARTED, props);
export const trackRegistrationStep = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.REGISTRATION_STEP, props);
export const trackRegistrationCompleted = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.REGISTRATION_COMPLETED, props);
export const trackRegistrationAbandoned = (props?: Record<string, unknown>) => fire(AUTH_EVENTS.REGISTRATION_ABANDONED, props);

// ── Employer ──
export const trackJobCreated = (props?: Record<string, unknown>) => fire(EMPLOYER_EVENTS.JOB_CREATED, props);
export const trackJobPublished = (props?: Record<string, unknown>) => fire(EMPLOYER_EVENTS.JOB_PUBLISHED, props);
export const trackJobEdited = (props?: Record<string, unknown>) => fire(EMPLOYER_EVENTS.JOB_EDITED, props);
export const trackJobClosed = (props?: Record<string, unknown>) => fire(EMPLOYER_EVENTS.JOB_CLOSED, props);
export const trackCreditsPurchased = (props?: Record<string, unknown>) => fire(EMPLOYER_EVENTS.CREDITS_PURCHASED, props);
export const trackApplicantShortlisted = (props?: Record<string, unknown>) => fire(EMPLOYER_EVENTS.APPLICANT_SHORTLISTED, props);
export const trackApplicantHired = (props?: Record<string, unknown>) => fire(EMPLOYER_EVENTS.APPLICANT_HIRED, props);

// ── Worker ──
export const trackSearch = (props?: Record<string, unknown>) => fire(WORKER_EVENTS.SEARCH, props);
export const trackFilterUsed = (props?: Record<string, unknown>) => fire(WORKER_EVENTS.FILTER_USED, props);
export const trackJobViewed = (props?: Record<string, unknown>) => fire(WORKER_EVENTS.JOB_VIEWED, props);
export const trackApplyStarted = (props?: Record<string, unknown>) => fire(WORKER_EVENTS.APPLY_STARTED, props);
export const trackApplySubmitted = (props?: Record<string, unknown>) => fire(WORKER_EVENTS.APPLY_SUBMITTED, props);
export const trackResumeUploaded = (props?: Record<string, unknown>) => fire(WORKER_EVENTS.RESUME_UPLOADED, props);
export const trackProfileUpdated = (props?: Record<string, unknown>) => fire(WORKER_EVENTS.PROFILE_UPDATED, props);

// ── Payments ──
export const trackCheckoutStarted = (props?: Record<string, unknown>) => fire(PAYMENT_EVENTS.CHECKOUT_STARTED, props);
export const trackPaymentSuccess = (props?: Record<string, unknown>) => fire(PAYMENT_EVENTS.PAYMENT_SUCCESS, props);
export const trackPaymentFailure = (props?: Record<string, unknown>) => fire(PAYMENT_EVENTS.PAYMENT_FAILURE, props);
export const trackWebhookSuccess = (props?: Record<string, unknown>) => fire(PAYMENT_EVENTS.WEBHOOK_SUCCESS, props);
export const trackWebhookFailure = (props?: Record<string, unknown>) => fire(PAYMENT_EVENTS.WEBHOOK_FAILURE, props);

// ── Admin ──
export const trackReportReviewed = (props?: Record<string, unknown>) => fire(ADMIN_EVENTS.REPORT_REVIEWED, props);
export const trackUserApproved = (props?: Record<string, unknown>) => fire(ADMIN_EVENTS.USER_APPROVED, props);
export const trackUserSuspended = (props?: Record<string, unknown>) => fire(ADMIN_EVENTS.USER_SUSPENDED, props);

// ── System / Performance ──
export const trackSlowRequest = (props?: Record<string, unknown>) => fire(SYSTEM_EVENTS.SLOW_REQUEST, props);
export const trackCacheHit = (props?: Record<string, unknown>) => fire(SYSTEM_EVENTS.CACHE_HIT, props);
export const trackCacheMiss = (props?: Record<string, unknown>) => fire(SYSTEM_EVENTS.CACHE_MISS, props);
export const trackApiError = (props?: Record<string, unknown>) => fire(SYSTEM_EVENTS.API_ERROR, props);
export const trackSlowPage = (props?: Record<string, unknown>) => fire(SYSTEM_EVENTS.SLOW_PAGE, props);
