export interface AnalyticsUser {
  id: string;
  role?: string;
  email?: string;
  name?: string;
  phone?: string;
}

export interface AnalyticsGroup {
  id: string;
  name?: string;
  attributes?: Record<string, unknown>;
}

export interface PageView {
  path: string;
  title?: string;
  referrer?: string;
  search?: string;
}

export interface AnalyticsProvider {
  name: string;
  init(): void | Promise<void>;
  identify(user: AnalyticsUser): void | Promise<void>;
  group?(group: AnalyticsGroup): void | Promise<void>;
  pageView(view: PageView): void | Promise<void>;
  track(event: string, properties?: Record<string, unknown>): void | Promise<void>;
  alias?(userId: string, previousId: string): void | Promise<void>;
  reset?(): void | Promise<void>;
}
