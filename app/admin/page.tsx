"use client"

import { getAdminStats } from '@/app/action'
import Notification from '@/components/Notification'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useState } from 'react'

type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

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

const Page = () => {
    const { user } = useUser()
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const fetchStats = useCallback(async () => {
        const email = user?.primaryEmailAddress?.emailAddress ?? ""
        if (!email) {
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            setStats(await getAdminStats(email))
        } catch (error: unknown) {
            setNotification(error instanceof Error ? `Erreur : ${error.message}` : "Erreur lors du chargement")
        } finally {
            setLoading(false)
        }
    }, [user?.primaryEmailAddress?.emailAddress])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const cards = stats ? [
        { title: "Utilisateurs", value: stats.users.total, desc: `${stats.users.recent} inscrits (30 j)` },
        { title: "Comptes", value: stats.accounts.total, desc: `${stats.accounts.recent} créés (30 j)` },
        { title: "Transactions", value: stats.transactions.total, desc: `${stats.transactions.recent} créées (30 j)` },
        { title: "Budgets", value: stats.budgets.total, desc: `${stats.budgets.recent} créés (30 j)` },
        { title: "Objectifs", value: stats.goals.total, desc: "Total épargne" },
        { title: "Récurrents", value: stats.recurring.total, desc: "Total modèles" },
    ] : [];

    return (
        <>
            {notification && (
                <Notification message={notification} onClose={closeNotification} />
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold">Administration</h1>
                    <p className="text-sm text-base-content/50 mt-1">Vue globale de l&apos;activité de l&apos;application</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/statistics" className="btn btn-outline btn-sm">Statistiques</Link>
                    <Link href="/admin/users" className="btn btn-primary btn-sm">Gérer les utilisateurs</Link>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <span className="loading loading-bars loading-lg"></span>
                </div>
            ) : !stats ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <h1>Accès refusé ou données indisponibles</h1>
                </div>
            ) : (
                <>
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
                </>
            )}
        </>
    )
}

export default Page
