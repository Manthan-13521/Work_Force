export { computeTrend, computeMultiTrend } from "./trends";
export type { Trend, Direction, Confidence } from "./trends";

export { getEmployerInsights, getWorkerInsights, getAdminInsights } from "./insights";
export type { Insight, EmployerDashboardInsights, WorkerDashboardInsights, AdminDashboardInsights } from "./insights";

export { getEmployerRecommendations, getWorkerRecommendations, getAdminRecommendations } from "./recommendations";
export type { Recommendation } from "./recommendations";

export { calculateEmployerHealth, calculateWorkerHealth, calculatePlatformHealth } from "./scoring";
export type { HealthScore } from "./scoring";

export { formatPercentage, formatDelta, timesMore, formatScore, scoreLabel } from "./formatting";
