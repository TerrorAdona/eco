import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const bars = [34, 52, 30, 58, 46, 66, 74];

function LeafIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

const featureIcons = {
  pie: (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  target: (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  trend: (
    <svg
      className="size-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  ),
};

const features = [
  {
    icon: featureIcons.pie,
    title: "Suivez vos dépenses",
    text: "Notez chaque achat et gardez le fil de votre budget au quotidien.",
  },
  {
    icon: featureIcons.target,
    title: "Tenez vos budgets",
    text: "Fixez des plafonds par catégorie et restez serein jusqu'à la fin du mois.",
  },
  {
    icon: featureIcons.trend,
    title: "Visualisez vos progrès",
    text: "Des rapports clairs pour comprendre où va votre argent.",
  },
];

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-black/20">
        <LeafIcon />
      </span>
      <span
        className={`text-xl font-bold tracking-tight ${
          dark ? "text-white" : "text-gray-900"
        }`}
      >
        eco
      </span>
    </div>
  );
}

function SpendingCard() {
  return (
    <div className="mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white/70">Dépenses du mois</p>
        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
          −12 %
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-bold text-white">1 240 €</p>
      <svg viewBox="0 0 210 84" className="mt-4 w-full" aria-hidden="true">
        <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1">
          <line x1="0" y1="21" x2="210" y2="21" />
          <line x1="0" y1="42" x2="210" y2="42" />
          <line x1="0" y1="63" x2="210" y2="63" />
        </g>
        {bars.map((height, i) => (
          <rect
            key={i}
            x={i * 29 + 1}
            y={78 - height}
            width="21"
            height={height}
            rx="5"
            className={
              i === bars.length - 1 ? "fill-accent" : "fill-white/20"
            }
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-white/40">
        <span>Sem 1</span>
        <span>Sem 2</span>
        <span>Sem 3</span>
        <span>Aujourd'hui</span>
      </div>
    </div>
  );
}

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: AuthShellProps) {
  return (
    <section className="grid min-h-screen lg:grid-cols-2">

      {/* <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </Link> */}
      <aside className="relative isolate hidden overflow-hidden bg-[linear-gradient(160deg,#0d1b2e_0%,#10304c_45%,#0f3b3f_100%)] lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-28 -left-20 size-96 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute top-1/3 -right-24 size-80 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 size-96 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:26px_26px]" />
        </div>

        <div className="flex h-full flex-col justify-between p-12 xl:p-14">
          <div>
            <Logo dark />
            <h2 className="mt-14 max-w-md text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
              Reprenez le contrôle de{" "}
              <span className="text-accent">vos dépenses.</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
              ECO vous accompagne pour une meilleure gestion de vos finances
            </p>
          </div>

          <div>
            <ul className="max-w-md space-y-5">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-accent ring-1 ring-white/15">
                    {feature.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/60">
                      {feature.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <SpendingCard />
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          {/* <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </Link> */}

          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            {subtitle}
          </p>

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </section>
  );
}