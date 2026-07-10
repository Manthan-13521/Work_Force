// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonLd(script: Record<string, any>): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    ...script,
  });
}

export function organizationSchema(name?: string): string {
  return jsonLd({
    "@type": "Organization",
    name: name || "Workforce",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in",
    description: "Verified industrial labour hiring platform connecting factory workers with trusted employers in Hyderabad.",
    logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}/icons/icon.svg`,
    foundingDate: "2024",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-98765-43210",
      contactType: "customer support",
      availableLanguage: ["English", "Telugu", "Hindi"],
    },
    sameAs: [
      "https://twitter.com/workforce",
      "https://linkedin.com/company/workforce",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
  });
}

export function websiteSchema(): string {
  return jsonLd({
    "@type": "WebSite",
    name: "Workforce",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}/jobs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    description: "Find verified factory jobs and skilled industrial workers in Hyderabad.",
  });
}

export function breadcrumbSchema(items: { name: string; url: string }[]): string {
  return jsonLd({
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${process.env.NEXT_PUBLIC_APP_URL || "https://workforce.in"}${item.url}`,
    })),
  });
}

export function jobPostingSchema(job: {
  title: string;
  description: string;
  location?: string;
  city?: string;
  salaryMin?: number;
  salaryMax?: number;
  employerName: string;
  postedAt: Date;
  expiresAt?: Date | null;
  shiftType?: string;
  jobType?: string;
  vacancies?: number;
}): string {
  return jsonLd({
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.postedAt.toISOString(),
    ...(job.expiresAt ? { validThrough: job.expiresAt.toISOString() } : {}),
    hiringOrganization: {
      "@type": "Organization",
      name: job.employerName,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city || job.location || "Hyderabad",
        addressRegion: "Telangana",
        addressCountry: "IN",
      },
    },
    ...(job.salaryMin || job.salaryMax
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "INR",
            ...(job.salaryMin && job.salaryMax
              ? {
                  value: {
                    "@type": "QuantitativeValue",
                    minValue: job.salaryMin,
                    maxValue: job.salaryMax,
                    unitText: "MONTH",
                  },
                }
              : {
                  value: {
                    "@type": "QuantitativeValue",
                    value: job.salaryMin || job.salaryMax,
                    unitText: "MONTH",
                  },
                }),
          },
        }
      : {}),
    ...(job.vacancies ? { numberOfOpenings: job.vacancies } : {}),
    employmentType: job.jobType || "FULL_TIME",
    ...(job.shiftType ? { workHours: job.shiftType } : {}),
  });
}

export function faqSchema(questions: { question: string; answer: string }[]): string {
  return jsonLd({
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  });
}

export function profilePageSchema(user: {
  name: string;
  description?: string;
  image?: string;
}): string {
  return jsonLd({
    "@type": "ProfilePage",
    name: user.name,
    ...(user.description ? { description: user.description } : {}),
    ...(user.image ? { image: user.image } : {}),
  });
}

export function Schemas({ schemas }: { schemas: string[] }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schema }}
        />
      ))}
    </>
  );
}
