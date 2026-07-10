import { scoreLabel } from "./formatting";

export interface HealthScore {
  score: number;
  label: string;
  reasons: string[];
}

export function calculateEmployerHealth(params: {
  isVerified: boolean;
  activeJobs: number;
  totalApplications: number;
  totalHired: number;
  recentResponseRate?: boolean;
  reportCount: number;
}): HealthScore {
  let score = 50;
  const reasons: string[] = [];

  if (params.isVerified) {
    score += 20;
    reasons.push("Verified profile");
  } else {
    reasons.push("Complete verification to improve trust");
  }

  if (params.activeJobs >= 3) {
    score += 10;
    reasons.push("Consistent hiring");
  } else if (params.activeJobs >= 1) {
    score += 5;
    reasons.push("Active postings");
  } else {
    reasons.push("No active job postings");
  }

  if (params.totalApplications > 0) {
    score += 5;
    reasons.push("Receiving applications");
  }

  if (params.totalHired > 0) {
    score += 5;
    reasons.push("Successful hires");
  }

  if (params.recentResponseRate) {
    score += 5;
    reasons.push("Fast response time");
  }

  if (params.reportCount === 0) {
    score += 5;
    reasons.push("Low report rate");
  } else {
    score -= params.reportCount * 5;
    reasons.push(`${params.reportCount} report(s) filed`);
  }

  score = Math.max(0, Math.min(100, score));

  return { score, label: scoreLabel(score), reasons };
}

export function calculateWorkerHealth(params: {
  profileComplete: boolean;
  isVerified: boolean;
  applicationsCount: number;
  hiredCount: number;
  hasResume: boolean;
  trade?: string | null;
}): HealthScore {
  let score = 40;
  const reasons: string[] = [];

  if (params.profileComplete) {
    score += 15;
    reasons.push("Complete profile");
  } else {
    reasons.push("Complete your profile");
  }

  if (params.isVerified) {
    score += 15;
    reasons.push("Identity verified");
  } else {
    reasons.push("Verify your identity");
  }

  if (params.hasResume) {
    score += 10;
    reasons.push("Resume uploaded");
  } else {
    reasons.push("Upload your resume");
  }

  if (params.applicationsCount > 0) {
    score += 10;
    reasons.push("Active job applications");
  }

  if (params.hiredCount > 0) {
    score += 10;
    reasons.push("Previous hiring experience");
  }

  score = Math.max(0, Math.min(100, score));

  return { score, label: scoreLabel(score), reasons };
}

export function calculatePlatformHealth(params: {
  activeUsers: number;
  activeJobs: number;
  totalHires: number;
  pendingReports: number;
  revenueGrowth?: number;
}): HealthScore {
  let score = 60;
  const reasons: string[] = [];

  if (params.activeUsers > 100) {
    score += 10;
    reasons.push("Growing user base");
  } else if (params.activeUsers > 50) {
    score += 5;
    reasons.push("Active user community");
  }

  if (params.activeJobs > 50) {
    score += 10;
    reasons.push("Healthy job market");
  } else if (params.activeJobs > 20) {
    score += 5;
    reasons.push("Growing job listings");
  }

  if (params.totalHires > 20) {
    score += 10;
    reasons.push("Strong hiring activity");
  } else if (params.totalHires > 5) {
    score += 5;
    reasons.push("Successful placements");
  }

  if (params.pendingReports === 0) {
    score += 5;
    reasons.push("No pending reports");
  } else if (params.pendingReports <= 3) {
    score += 2;
    reasons.push(`${params.pendingReports} pending report(s)`);
  } else {
    score -= 5;
    reasons.push(`${params.pendingReports} pending reports need review`);
  }

  if (params.revenueGrowth !== undefined && params.revenueGrowth > 0) {
    score += 5;
    reasons.push("Revenue growing");
  }

  score = Math.max(0, Math.min(100, score));

  return { score, label: scoreLabel(score), reasons };
}
