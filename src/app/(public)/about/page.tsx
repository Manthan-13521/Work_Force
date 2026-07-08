import { Briefcase, Shield, Target, MapPin } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">About Workforce</h1>
      <p className="text-lg text-muted-foreground mb-12">
        Workforce is Hyderabad-first verified industrial labour hiring platform. We believe finding factory work should be simple, trustworthy, and fast.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {[
          { icon: Target, title: "Our Mission", desc: "To eliminate fake job listings and make blue-collar hiring in India trustworthy and efficient." },
          { icon: Shield, title: "Trust First", desc: "Every employer is verified. Workers upload ID proof. Stale jobs are removed. Reports are acted on." },
          { icon: MapPin, title: "Hyderabad Focused", desc: "Starting with Hyderabad's industrial zones — Jeedimetla, Patancheru, Bolaram, and more." },
          { icon: Briefcase, title: "Industrial Specialists", desc: "We focus on factory and manufacturing roles — assembly, machine operation, packaging, and warehouse." },
        ].map((item) => (
          <div key={item.title} className="p-6 rounded-lg border">
            <item.icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
