"use client"

import Notification from '@/components/Notification'
import { getAdminStatistics } from '@/app/action'
import { ADMIN_PERIODS, AdminPeriod } from '@/lib/admin-stats'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useState } from 'react'

type AdminStatistics = Awaited<ReturnType<typeof getAdminStatistics>>;

const KIND_COLORS: Record<string, string> = {
    expense: "bg-secondary",
    income: "bg-accent",
    transfer: "bg-primary",
};

const KIND_LABELS: Record<string, string> = {
    expense: "Dépenses",
    income: "Revenus",
    transfer: "Transferts",
};

const PIE_COLORS = ["#5e81ac", "#88c0d0", "#a3be8c"];

const Page = () => {
    const { user } = useUser()
    const [period, setPeriod] = useState<AdminPeriod>("last30")
    const [stats, setStats] = useState<AdminStatistics | null>(null)
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
            setStats(await getAdminStatistics(email, period))
        } catch (error: unknown) {
            setNotification(error instanceof Error ? `Erreur : ${error.message}` : "Erreur lors du chargement")
        } finally {
            setLoading(false)
        }
    }, [user?.primaryEmailAddress?.emailAddress, period])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    const splitTotal = stats?.transactionSplit.reduce((acc, s) => acc + s.count, 0) ?? 0;
    const pieBackground = stats && splitTotal > 0
        ? (() => {
            let acc = 0;
            const parts = stats.transactionSplit.map((s, i) => {
                const start = (acc / splitTotal) * 360;
                acc += s.count;
                const end = (acc / splitTotal) * 360;
                return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}deg ${end}deg`;
            });
            return `conic-gradient(${parts.join(", ")})`;
        })()
        : "conic-gradient(var(--color-base-300) 0deg 360deg)";

    return (
        <>
            {notification && (
                <Notification message={notification} onClose={closeNotification} />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl font-bold">Statistiques</h1>
                    <p className="text-sm text-base-content/50 mt-1">Analyse globale de l&apos;utilisation de l&apos;application</p>
                </div>
                <div className="flex gap-2">
                    <select
                        className="select select-bordered"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as AdminPeriod)}
                        aria-label="Période analysée"
                    >
                        {Object.entries(ADMIN_PERIODS).map(([value, config]) => (
                            <option key={value} value={value}>{config.label}</option>
                        ))}
                    </select>
                    <Link href="/admin" className="btn btn-ghost btn-sm self-center">← Admin</Link>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <span className="loading loading-bars loading-lg"></span>
                </div>
            ) : !stats ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <h1>Aucune donnée</h1>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="card bg-base-100 border border-base-300 p-5">
                        <h2 className="font-bold text-lg mb-4">Utilisateurs</h2>
                        <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100">
                            <div className="stat">
                                <div className="stat-title">Total</div>
                                <div className="stat-value text-2xl">{stats.users.total.toLocaleString("fr-FR")}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Actifs / Inactifs</div>
                                <div className="stat-value text-2xl">{stats.users.active.toLocaleString("fr-FR")} <span className="text-base font-normal text-base-content/50">/ {stats.users.inactive.toLocaleString("fr-FR")}</span></div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Admins / Standards</div>
                                <div className="stat-value text-2xl">{stats.users.admins.toLocaleString("fr-FR")} <span className="text-base font-normal text-base-content/50">/ {stats.users.standards.toLocaleString("fr-FR")}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 border border-base-300 p-5">
                        <h2 className="font-bold text-lg mb-1">Activité globale</h2>
                        <p className="text-sm text-base-content/50 mb-4">Totaux tous utilisateurs confondus</p>
                        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { title: "Transactions", value: stats.activity.transactions },
                                { title: "Revenus", value: stats.activity.income },
                                { title: "Dépenses", value: stats.activity.expenses },
                                { title: "Transferts", value: stats.activity.transfers },
                                { title: "Comptes", value: stats.activity.accounts },
                                { title: "Budgets", value: stats.activity.budgets },
                                { title: "Objectifs", value: stats.activity.goals },
                                { title: "Récurrents", value: stats.recurring.total },
                            ].map((card) => (
                                <li key={card.title} className="border border-base-300 rounded-xl p-4">
                                    <h3 className="text-sm text-base-content/60">{card.title}</h3>
                                    <p className="text-2xl font-bold text-primary mt-1">{card.value.toLocaleString("fr-FR")}</p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="card bg-base-100 border border-base-300 p-5">
                            <h2 className="font-bold text-lg">Évolution des transactions</h2>
                            <p className="text-sm text-base-content/50 mb-4">{ADMIN_PERIODS[period].label.toLowerCase()}</p>
                            {stats.transactionEvolution.every((b) => b.total === 0) ? (
                                <p className="text-sm text-base-content/50">Aucune donnée sur cette période.</p>
                            ) : (
                                <>
                                    <div className="flex items-end gap-1 h-40">
                                        {stats.transactionEvolution.map((bucket) => {
                                            const max = Math.max(...stats.transactionEvolution.map((x) => x.total), 1);
                                            return (
                                                <div key={bucket.key} className="flex-1 min-w-0 flex flex-col justify-end gap-px h-full" title={`${bucket.label} : ${bucket.total}`}>
                                                    {(["expense", "income", "transfer"] as const).map((kind) => {
                                                        const count = bucket.counts[kind] ?? 0;
                                                        if (count === 0) return null;
                                                        return (
                                                            <div
                                                                key={kind}
                                                                className={`${KIND_COLORS[kind]} rounded-t-sm transition-all duration-300`}
                                                                style={{ height: `${Math.max(3, Math.round((count / max) * 100))}%` }}
                                                            ></div>
                                                        );
                                                    })}
                                                    <div className="flex-1 min-h-0"></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-base-content/60">
                                        {Object.entries(KIND_LABELS).map(([kind, label]) => (
                                            <span key={kind} className="flex items-center gap-1">
                                                <span className={`inline-block size-3 rounded-sm ${KIND_COLORS[kind]}`}></span>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="card bg-base-100 border border-base-300 p-5">
                            <h2 className="font-bold text-lg">Répartition des transactions</h2>
                            <p className="text-sm text-base-content/50 mb-4">{ADMIN_PERIODS[period].label.toLowerCase()}</p>
                            {splitTotal === 0 ? (
                                <p className="text-sm text-base-content/50">Aucune donnée sur cette période.</p>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-5">
                                    <div
                                        className="size-40 shrink-0 rounded-full"
                                        style={{ background: pieBackground }}
                                        role="img"
                                        aria-label="Répartition revenus, dépenses, transferts"
                                    ></div>
                                    <ul className="flex flex-col gap-2 w-full">
                                        {stats.transactionSplit.map((s, i) => (
                                            <li key={s.label} className="flex items-center justify-between text-sm gap-2">
                                                <span className="flex items-center gap-2">
                                                    <span className="inline-block size-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                                                    {s.label}
                                                </span>
                                                <span className="font-bold">{s.count.toLocaleString("fr-FR")} ({Math.round((s.count / splitTotal) * 100)}%)</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="card bg-base-100 border border-base-300 p-5">
                            <h2 className="font-bold text-lg mb-1">Comptes</h2>
                            <p className="text-sm text-base-content/50 mb-4">{stats.accounts.total.toLocaleString("fr-FR")} au total (types et devises, sans soldes)</p>
                            <h3 className="text-sm font-semibold mb-2">Par type</h3>
                            <ul className="flex flex-col gap-2 mb-4">
                                {stats.accounts.byType.map((r) => (
                                    <li key={r.label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium">{r.label}</span>
                                            <span>{r.count.toLocaleString("fr-FR")} ({r.percent}%)</span>
                                        </div>
                                        <div className="w-full bg-base-300 rounded-full h-2">
                                            <div className="bg-primary h-2 rounded-full" style={{ width: `${r.percent}%` }}></div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <h3 className="text-sm font-semibold mb-2">Par devise</h3>
                            <ul className="flex flex-col gap-2">
                                {stats.accounts.byCurrency.map((r) => (
                                    <li key={r.label} className="flex justify-between text-sm">
                                        <span className="font-medium">{r.label}</span>
                                        <span className="font-bold">{r.count.toLocaleString("fr-FR")} ({r.percent}%)</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="card bg-base-100 border border-base-300 p-5">
                                <h2 className="font-bold text-lg mb-1">Budgets</h2>
                                <p className="text-sm text-base-content/50">{stats.budgets.total.toLocaleString("fr-FR")} au total, {stats.periodActivity.budgets.toLocaleString("fr-FR")} créés sur la période</p>
                            </div>
                            <div className="card bg-base-100 border border-base-300 p-5">
                                <h2 className="font-bold text-lg mb-1">Objectifs d&apos;épargne</h2>
                                <p className="text-sm text-base-content/50">
                                    {stats.goals.total.toLocaleString("fr-FR")} au total, {stats.goals.reached.toLocaleString("fr-FR")} atteints, {stats.periodActivity.goals.toLocaleString("fr-FR")} créés sur la période
                                </p>
                            </div>
                            <div className="card bg-base-100 border border-base-300 p-5">
                                <h2 className="font-bold text-lg mb-1">Inscriptions</h2>
                                <p className="text-sm text-base-content/50 mb-4">{ADMIN_PERIODS[period].label.toLowerCase()}</p>
                                {stats.userEvolution.every((b) => b.total === 0) ? (
                                    <p className="text-sm text-base-content/50">Aucune inscription sur cette période.</p>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-1 h-24">
                                            {stats.userEvolution.map((bucket) => {
                                                const max = Math.max(...stats.userEvolution.map((x) => x.total), 1);
                                                return (
                                                    <div
                                                        key={bucket.key}
                                                        title={`${bucket.label} : ${bucket.total}`}
                                                        className="flex-1 min-w-0 bg-accent/80 rounded-t transition-all duration-300"
                                                        style={{ height: `${Math.max(4, Math.round((bucket.total / max) * 100))}%` }}
                                                    ></div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex justify-between text-xs text-base-content/50 mt-2">
                                            <span>{stats.userEvolution[0]?.label}</span>
                                            <span>{stats.userEvolution[stats.userEvolution.length - 1]?.label}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Page
