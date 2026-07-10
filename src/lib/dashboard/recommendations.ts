export interface Recommendation {
  id: string;
  action: string;
  description: string;
  priority: number;
  link?: string;
  type: "action" | "improvement" | "maintenance";
}

export function getEmployerRecommendations(insights: {
  isVerified: boolean;
  activeJobs: number;
  creditRemaining: number;
  hasExpiringJobs: boolean;
  hasInactiveJobs: boolean;
  jobsWithNoApps: number;
  recentApplications: number;
}): Recommendation[] {
  const recs: Recommendation[] = [];

  if (!insights.isVerified) {
    recs.push({
      id: "verify-profile",
      action: "Complete company verification",
      description: "Verified employers attract more applicants. Complete your verification now.",
      priority: 1,
      link: "/employer/profile",
      type: "action",
    });
  }

  if (insights.creditRemaining === 0) {
    recs.push({
      id: "buy-credits",
      action: "Purchase job credits",
      description: "You have no credits remaining. Purchase a plan to post new jobs.",
      priority: 2,
      link: "/employer/payments",
      type: "action",
    });
  } else if (insights.creditRemaining <= 3) {
    recs.push({
      id: "low-credits",
      action: "Credits running low",
      description: `You have ${insights.creditRemaining} credit${insights.creditRemaining > 1 ? "s" : ""} left. Consider purchasing more.`,
      priority: 3,
      link: "/employer/payments",
      type: "maintenance",
    });
  }

  if (insights.hasExpiringJobs) {
    recs.push({
      id: "repost-expiring",
      action: "Repost expiring jobs",
      description: "Some jobs are expiring soon. Repost to maintain visibility.",
      priority: 4,
      link: "/employer/jobs",
      type: "action",
    });
  }

  if (insights.jobsWithNoApps > 0) {
    recs.push({
      id: "improve-listings",
      action: "Update job listings",
      description: `${insights.jobsWithNoApps} job${insights.jobsWithNoApps > 1 ? "s have" : " has"} no applicants. Review titles and salary ranges.`,
      priority: 5,
      link: "/employer/jobs",
      type: "improvement",
    });
  }

  if (insights.recentApplications > 0) {
    recs.push({
      id: "respond-applicants",
      action: "Review recent applicants",
      description: "You have recent applicants waiting for a response. Quick replies improve your hiring reputation.",
      priority: 6,
      link: "/employer/jobs",
      type: "action",
    });
  }

  if (insights.activeJobs === 0 && insights.creditRemaining > 0) {
    recs.push({
      id: "post-job",
      action: "Post a new job",
      description: "You have credits available but no active jobs. Start hiring today.",
      priority: 7,
      link: "/employer/jobs/new",
      type: "action",
    });
  }

  return recs;
}

export function getWorkerRecommendations(insights: {
  profileComplete: boolean;
  isVerified: boolean;
  hasApplications: boolean;
  recentShortlist: boolean;
}): Recommendation[] {
  const recs: Recommendation[] = [];

  if (!insights.isVerified) {
    recs.push({
      id: "verify-id",
      action: "Verify your identity",
      description: "Verified workers get more responses from employers.",
      priority: 1,
      link: "/worker/profile",
      type: "action",
    });
  }

  if (!insights.profileComplete) {
    recs.push({
      id: "complete-profile",
      action: "Complete your profile",
      description: "Add your trade, experience, and expected salary to get discovered.",
      priority: 2,
      link: "/worker/profile",
      type: "improvement",
    });
  }

  if (!insights.hasApplications) {
    recs.push({
      id: "browse-jobs",
      action: "Browse available jobs",
      description: "Start applying to jobs that match your skills.",
      priority: 3,
      link: "/jobs",
      type: "action",
    });
  }

  if (insights.recentShortlist) {
    recs.push({
      id: "follow-up",
      action: "Follow up on shortlists",
      description: "You've been shortlisted recently. Stay responsive to maximize your chances.",
      priority: 4,
      type: "action",
    });
  }

  return recs;
}

export function getAdminRecommendations(insights: {
  verificationBacklog: number;
  pendingReports: number;
  userGrowth: number;
}): Recommendation[] {
  const recs: Recommendation[] = [];

  if (insights.verificationBacklog > 0) {
    recs.push({
      id: "verify-employers",
      action: "Review pending verifications",
      description: `${insights.verificationBacklog} employer${insights.verificationBacklog > 1 ? "s" : ""} waiting for approval.`,
      priority: 1,
      link: "/admin/approvals",
      type: "action",
    });
  }

  if (insights.pendingReports > 0) {
    recs.push({
      id: "review-reports",
      action: "Review pending reports",
      description: `${insights.pendingReports} report${insights.pendingReports > 1 ? "s" : ""} require${insights.pendingReports === 1 ? "s" : ""} attention.`,
      priority: 2,
      link: "/admin/reports",
      type: "action",
    });
  }

  if (insights.userGrowth < 0) {
    recs.push({
      id: "growth-concern",
      action: "Investigate user growth",
      description: "New user registrations have declined. Consider outreach initiatives.",
      priority: 3,
      type: "improvement",
    });
  }

  return recs;
}
