const PREFIX = "wf";

export function cacheKey(domain: string, ...parts: (string | number | undefined | null)[]): string {
  return `${PREFIX}:${domain}:${parts.filter((p) => p != null).join(":")}`;
}

export function tagKey(tag: string): string {
  return `${PREFIX}:tag:${tag}`;
}

export function metricKey(): string {
  return `${PREFIX}:metrics`;
}
