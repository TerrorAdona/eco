import Link from "next/link";
import Navbar from "@/components/Navbar";
import budgets from "@/components/data";
import BudgetItem from "@/components/BudgetItem";
import { TRANSACTION_CATEGORIES } from "@/type";
import {
  ArrowLeftRight,
  Bell,
  ChartNoAxesColumn,
  Download,
  PiggyBank,
  Target,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Budgets par catégorie",
    text: "Définissez des enveloppes Alimentation, Transport, Logement et suivez leur consommation en temps réel.",
  },
  {
    icon: ArrowLeftRight,
    title: "Revenus et dépenses",
    text: "Enregistrez chaque mouvement, liez-le à un compte et gardez des soldes toujours justes.",
  },
  {
    icon: Target,
    title: "Objectifs d'épargne",
    text: "Fixez un montant cible et une échéance, versez au fil des mois et visualisez votre progression.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Tableau de bord",
    text: "Dépenses par catégorie, évolution, comparaison de périodes et dépenses inhabituelles détectées.",
  },
  {
    icon: Bell,
    title: "Alertes de dépassement",
    text: "Soyez prévenu à 80 % et 100 % de consommation de chaque budget, avant qu'il ne soit trop tard.",
  },
  {
    icon: Download,
    title: "Export CSV",
    text: "Exportez vos transactions filtrées avec date, montant, catégorie, budget et devise.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Créez votre compte",
    text: "Inscription gratuite en quelques secondes, connexion sécurisée.",
  },
  {
    number: "2",
    title: "Fixez vos budgets",
    text: "Créez vos enveloppes par catégorie avec un montant et un compte.",
  },
  {
    number: "3",
    title: "Suivez en temps réel",
    text: "Chaque dépense met à jour budgets, soldes, alertes et graphiques.",
  },
];

export default function Home() {
  return (
    <div>
      <Navbar />

      <section className="px-5 md:px-[10%] py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-start">
          <span className="badge badge-primary badge-lg mb-4">Gestion financière personnelle</span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Gérez efficacement <br />
            <span className="text-primary">vos dépenses.</span>
          </h1>
          <p className="py-6 text-base-content/70 text-lg">
            eco centralise budgets, transactions, comptes, épargne et alertes
            pour une meilleure gestion de vos finances au quotidien.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={"/sign-up"} className="btn btn-md md:btn-lg btn-accent">
              Créer un compte
            </Link>
            <Link href={"/sign-in"} className="btn btn-md md:btn-lg btn-outline btn-accent">
              Se connecter
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mt-8">
            {TRANSACTION_CATEGORIES.slice(0, 6).map((c) => (
              <span key={c} className="badge badge-outline">
                {c}
              </span>
            ))}
            <span className="badge badge-ghost">+4 autres</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card bg-base-100 border border-base-300 shadow-xl p-2">
            <BudgetItem budget={budgets[0]} enableHover={0} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="stats shadow bg-base-100 border border-base-300">
              <div className="stat p-4">
                <div className="stat-title text-xs">Dépensé</div>
                <div className="stat-value text-xl text-secondary">90 000 Ar</div>
              </div>
            </div>
            <div className="stats shadow bg-base-100 border border-base-300">
              <div className="stat p-4">
                <div className="stat-title text-xs">Épargné</div>
                <div className="stat-value text-xl text-accent">150 000 Ar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-[10%] py-14 bg-base-200/50">
        <h2 className="text-3xl font-bold text-center">Tout pour vos finances</h2>
        <p className="text-center text-base-content/60 mt-2 mb-10">
          Six outils complémentaires dans une seule application.
        </p>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="card bg-base-100 border border-base-300 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
                <feature.icon className="w-6 h-6" aria-hidden="true" />
              </span>
              <h3 className="font-bold text-lg">{feature.title}</h3>
              <p className="text-sm text-base-content/60 mt-1">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 md:px-[10%] py-14">
        <h2 className="text-3xl font-bold text-center">Comment ça marche</h2>
        <p className="text-center text-base-content/60 mt-2 mb-10">
          Trois étapes pour reprendre le contrôle.
        </p>
        <ol className="grid md:grid-cols-3 gap-5">
          {STEPS.map((step) => (
            <li key={step.number} className="card bg-base-100 border border-base-300 p-6">
              <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-content font-bold text-lg mb-4">
                {step.number}
              </span>
              <h3 className="font-bold text-lg">{step.title}</h3>
              <p className="text-sm text-base-content/60 mt-1">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-5 md:px-[10%] pb-14">
        <div className="card bg-gradient-to-br from-primary to-accent text-primary-content p-10 text-center shadow-xl">
          <PiggyBank className="w-12 h-12 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-3xl font-bold">Prêt à reprendre le contrôle ?</h2>
          <p className="mt-2 opacity-80">
            Créez votre premier budget dès aujourd&apos;hui, gratuitement.
          </p>
          <Link href={"/sign-up"} className="btn btn-lg btn-neutral mt-6">
            Commencer maintenant
          </Link>
        </div>
      </section>

      <footer className="px-5 md:px-[10%] py-8 border-t border-base-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-base-content/50">
        <span className="font-bold text-base-content">eco</span>
        <span>Vos finances, simplement.</span>
      </footer>
    </div>
  );
}
