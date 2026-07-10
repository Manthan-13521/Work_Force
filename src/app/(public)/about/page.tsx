import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { breadcrumbSchema } from "@/lib/jsonld";
import { Briefcase, Shield, Target, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "About Workforce — Hyderabad's Verified Labour Platform",
  description: "Workforce is a Hyderabad-first verified industrial labour hiring platform. Learn about our mission to make blue-collar hiring trustworthy.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}/about`,
  },
};

export default function AboutPage() {
  const schemas = [
    breadcrumbSchema([{ name: "About", url: "/about" }]),
  ];

  return (
    <div className="px-5 lg:px-8 py-16 max-w-3xl mx-auto">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: s }} />
      ))}
      <div className="mb-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">About Workforce</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Workforce is a Hyderabad-first verified industrial labour hiring platform. We believe finding factory work should be simple, trustworthy, and fast.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { icon: Target, title: "Our Mission", desc: "To eliminate fake job listings and make blue-collar hiring in India trustworthy and efficient." },
          { icon: Shield, title: "Trust First", desc: "Every employer is verified. Workers upload ID proof. Stale jobs are removed. Reports are acted on." },
          { icon: MapPin, title: "Hyderabad Focused", desc: "Starting with Hyderabad's industrial zones \u2014 Jeedimetla, Patancheru, Bolaram, and more." },
          { icon: Briefcase, title: "Industrial Specialists", desc: "We focus on factory and manufacturing roles \u2014 assembly, machine operation, packaging, and warehouse." },
        ].map((item) => (
          <Card key={item.title} variant="ghost" className="border">
            <CardContent className="p-5">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/[0.06] text-primary mb-3">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
