import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bug,
  Globe2,
  LayoutDashboard,
  Lock,
  Map,
  Radar,
  ServerCog,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "VectorTrace · Hantavirus Surveillance Command Center" },
      {
        name: "description",
        content:
          "Real-time hantavirus epidemiological tracking: executive dashboard, geospatial risk mapping, rapid case intake, and automated WHO outbreak-news ingestion.",
      },
    ],
  }),
});

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Executive dashboard",
    body: "Live case metrics with trend deltas, a stacked epidemic curve, severity-filtered alerts, and a regional risk ranking with CSV export.",
  },
  {
    icon: Map,
    title: "Geospatial tracker",
    body: "Leaflet mapping with case markers, rodent reservoir sites, a risk-density heat layer, and shareable focus URLs for every case.",
  },
  {
    icon: Bug,
    title: "Rapid case intake",
    body: "A four-step clinician workflow with schema-validated vocabularies, local drafts, and optimistic realtime updates.",
  },
  {
    icon: Radar,
    title: "Automated ingestion",
    body: "A scheduled edge function pulls WHO Disease Outbreak News, normalizes and dedupes items, and raises alerts on new confirmations.",
  },
  {
    icon: Lock,
    title: "Row-level security",
    body: "Supabase RLS with admin, epidemiologist, and viewer roles. Clinical details stay behind authenticated read; the public sees a safe projection.",
  },
  {
    icon: ServerCog,
    title: "Observability console",
    body: "Ingest success rates, feed uptime, and database latency percentiles in an admin-only console, code-split out of the main bundle.",
  },
];

function Landing() {
  return (
    <div className="min-h-full bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,color-mix(in_oklch,var(--teal)_22%,transparent),transparent)]"
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal/40 bg-teal/10 text-teal text-[11.5px] font-semibold">
            <Activity className="size-3.5" /> Real-time epidemiological surveillance
          </div>
          <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Track hantavirus outbreaks
            <br className="hidden sm:block" /> before they spread.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed">
            VectorTrace combines a command-center dashboard, geospatial risk mapping, and a rapid
            case intake workflow with an automated WHO Disease Outbreak News pipeline — secured by
            Postgres row-level security and deployed to the edge.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md text-[14px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open the Command Center <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://github.com/Sujaya-Nimneth/hanta-watch-central"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-md text-[14px] font-semibold border border-input hover:bg-muted transition-colors"
            >
              <Globe2 className="size-4" /> View on GitHub
            </a>
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            No account needed — the public dashboard runs on the live surveillance feed (or a
            bundled demo dataset when unconfigured).
          </p>

          <div className="mt-10 sm:mt-14 rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/60">
              <span className="size-2.5 rounded-full bg-alert/70" />
              <span className="size-2.5 rounded-full bg-warning/70" />
              <span className="size-2.5 rounded-full bg-success/70" />
              <span className="ml-3 text-[11px] text-muted-foreground font-mono truncate">
                vectortrace · command center
              </span>
            </div>
            <img
              src="/screenshots/dashboard-dark.png"
              alt="VectorTrace executive dashboard showing case metrics, the epidemic curve, and regional risk ranking"
              className="w-full"
              width={1440}
              height={900}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-center">
          A full surveillance stack, end to end
        </h2>
        <p className="mt-2 text-center text-[13px] text-muted-foreground">
          Ingestion, analytics, field tools, and infrastructure observability in one platform.
        </p>
        <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-lg p-5 hover:border-teal/40 transition-colors"
            >
              <div className="size-9 rounded-md grid place-items-center bg-teal/10 text-teal">
                <f.icon className="size-4.5" />
              </div>
              <h3 className="mt-3.5 text-[14px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[12.5px] text-muted-foreground leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-border bg-card/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight">Ready to explore the data?</h2>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              The dashboard and map are public; clinicians can sign in to submit cases.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 h-10 rounded-md text-[13.5px] font-semibold border border-input hover:bg-muted transition-colors"
            >
              <Map className="size-4" /> Open the map
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 h-10 rounded-md text-[13.5px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to dashboard <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Activity className="size-3.5 text-teal" /> VectorTrace — hantavirus surveillance
          </span>
          <span>React 19 · TanStack Start · Supabase · Cloudflare Workers</span>
        </div>
      </footer>
    </div>
  );
}
