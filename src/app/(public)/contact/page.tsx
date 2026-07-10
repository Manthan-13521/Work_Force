"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { breadcrumbSchema } from "@/lib/jsonld";
import { Mail, Phone, MapPin, MessageSquare, Send } from "lucide-react";
import { submitContact } from "@/actions/contact.actions";

export default function ContactPage() {
  const [state, action, pending] = useActionState(submitContact, undefined);

  const schemas = [
    breadcrumbSchema([{ name: "Contact", url: "/contact" }]),
  ];

  return (
    <div className="px-5 lg:px-8 py-16 max-w-3xl mx-auto">
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: s }} />
      ))}
      <div className="mb-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">Contact Us</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Have questions or feedback? We&apos;d love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {[
          { icon: MessageSquare, title: "WhatsApp", value: "+91 98765 43210" },
          { icon: Mail, title: "Email", value: "hello@workforce.in" },
          { icon: Phone, title: "Phone", value: "+91 98765 43210" },
          { icon: MapPin, title: "Office", value: "Hyderabad, Telangana" },
        ].map((item) => (
          <Card key={item.title} variant="ghost" className="border">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary/[0.06] text-primary shrink-0">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="font-medium text-sm">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card variant="ghost" className="border">
        <CardContent className="p-6">
          <h2 className="text-base font-semibold mb-4">Send us a message</h2>
          <form action={action} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input id="name" name="name" label="Name" required maxLength={100} placeholder="Your name" />
              <Input id="email" name="email" label="Email" type="email" required placeholder="your@email.com" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="message" className="text-sm font-medium text-foreground/90 block">Message</label>
              <Textarea id="message" name="message" required maxLength={2000} placeholder="How can we help you?" rows={4} />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive" role="alert">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-success" role="alert">Message sent! We&apos;ll get back to you soon.</p>
            )}
            <Button type="submit" disabled={pending} className="gap-2">
              <Send className="h-4 w-4" />
              {pending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
