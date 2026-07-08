"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, MessageSquare, Send } from "lucide-react";
import { submitContact } from "@/actions/contact.actions";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [state, action, pending] = useActionState(submitContact, undefined);

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-lg text-muted-foreground mb-12">
        Have questions or feedback? We&apos;d love to hear from you.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {[
          { icon: MessageSquare, title: "WhatsApp", value: "+91 98765 43210" },
          { icon: Mail, title: "Email", value: "hello@workforce.in" },
          { icon: Phone, title: "Phone", value: "+91 98765 43210" },
          { icon: MapPin, title: "Office", value: "Hyderabad, Telangana" },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-5 flex items-center gap-4">
              <item.icon className="h-8 w-8 text-primary flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="font-medium">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
          <form action={action} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium mb-1 block">Name</label>
                <input id="name" name="name" type="text" required maxLength={100} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium mb-1 block">Email</label>
                <input id="email" name="email" type="email" required className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium mb-1 block">Message</label>
              <textarea id="message" name="message" required maxLength={2000} className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive" role="alert">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-sm text-emerald-600" role="alert">Message sent! We&apos;ll get back to you soon.</p>
            )}
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-2 justify-center rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              )}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {pending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
