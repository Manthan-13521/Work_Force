"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalMetric = {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
};

function rating(value: number, name: string): WebVitalMetric["rating"] {
  switch (name) {
    case "LCP":
      return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "FCP":
      return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    case "INP":
      return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
    case "TTFB":
      return value <= 800 ? "good" : value <= 1800 ? "needs-improvement" : "poor";
    default:
      return "needs-improvement";
  }
}

function sendToAnalytics(metric: WebVitalMetric) {
  if (typeof window === "undefined") return;

  try {
    const payload = { ...metric, url: window.location.pathname };
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/vitals", body);
    } else {
      fetch("/api/vitals", { method: "POST", body, keepalive: true, priority: "low" });
    }
  } catch {}
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    const webVital: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: rating(metric.value, metric.name),
    };
    sendToAnalytics(webVital);
  });

  return null;
}
