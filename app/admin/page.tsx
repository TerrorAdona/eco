import Wrapper from '@/components/Wrapper'
import { getAdminStats } from '@/app/action'
import Link from 'next/link'

const formatCount = (value: number) => value.toLocaleString("fr-FR");

function MonthlyBars({ title, subtitle, buckets }: { title: string; subtitle: string; buckets: { key: string; label: string; count: number }[] }) {
    const max = buckets.reduce((acc, b) => Math.max(acc, b.count), 0);
    return (
        <div className="card bg-base-100 border border-base-300 p-5">
            <h2 className="font-bold text-lg">{title}</h2>
            <p className="text-sm text-base-content/50 mb-4">{subtitle}</p>
            {max === 0 ? (
                <p className="text-sm text-base-content/50">Aucune donnée sur cette période.</p>
            ) : (
                <>
                    <div className="flex items-end gap-1 h-32">
                        {buckets.map((bucket) => (
                            <div
                                key={bucket.key}
                                title={`${bucket.label} : ${bucket.count}`}
                                className="flex-1 min-w-0 bg-primary/70 rounded-t transition-all duration-300"
                                style={{ height: `${Math.max(4, Math.round((bucket.count / max) * 100))}%` }}
                            ></div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-base-content/50 mt-2">
                        <span>{buckets[0]?.label}</span>
                        <span>{buckets[buckets.length - 1]?.label}</span>
                    </div>
                </>
            )}
        </div>
    );
}

export default async function AdminPage() {
    const stats = await getAdminStats();

    const cards = [
        { title: "Utilisateurs", value: stats.users.total, desc: `${stats.users.recent} inscrits (30 j)` },
        { title: "Comptes", value: stats.accounts.total, desc: `${stats.accounts.recent} créés (30 j)` },
        { title: "Transactions", value: stats.transactions.total, desc: `${stats.transactions.recent} créées (30 j)` },
        { title: "Budgets", value: stats.budgets.total, desc: `${stats.budgets.recent} créés (30 j)` },
        { title: "Objectifs", value: stats.goals.total, desc: "Total épargne" },
        { title: "Récurrents", value: stats.recurring.total, desc: "Total modèles" },
    ];

    return (
        <Wrapper>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold">Administration</h1>
                    <p className="text-sm text-base-content/50 mt-1">Vue globale de l&apos;activité de l&apos;application</p>
                </div>
                <Link href="/admin/users" className="btn btn-primary btn-sm">Gérer les utilisateurs</Link>
            </div>

            <ul className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {cards.map((card) => (
                    <li key={card.title} className="card bg-base-100 border border-base-300 p-5">
                        <h2 className="font-bold text-lg">{card.title}</h2>
                        <p className="text-3xl font-bold text-primary mt-1">{formatCount(card.value)}</p>
                        <p className="text-sm text-base-content/50 mt-1">{card.desc}</p>
                    </li>
                ))}
            </ul>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
                <MonthlyBars title="Inscriptions" subtitle="6 derniers mois" buckets={stats.monthlyUsers} />
                <MonthlyBars title="Transactions créées" subtitle="6 derniers mois" buckets={stats.monthlyTransactions} />
                <MonthlyBars title="Comptes créés" subtitle="6 derniers mois" buckets={stats.monthlyAccounts} />
            </div>
        </Wrapper>
    )
}
