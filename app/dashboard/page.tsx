"use client"
import Wrapper from '@/components/Wrapper'
import Notification from '@/components/Notification'
import BudgetItem from '@/components/BudgetItem'
import CategoryIcon from '@/components/CategoryIcon'
import SavingsGoalItem from '@/components/SavingsGoalItem'
import TransactionItem from '@/components/TransactionItem'
import { getDashboardData, getSavingsGoalsByUser } from '../action'
import { normalizeTransactionCategory, SavingsGoal, Transaction } from '@/type'
import { BUDGET_ALERT_LABELS, getBudgetAlert, hasBudgetAlert, isExpense, sumExpenses, sumIncome } from '@/lib/budget-alerts'
import { comparePeriods, detectUnusualSpending } from '@/lib/analytics'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

type DashboardBudgets = Awaited<ReturnType<typeof getDashboardData>>

const PERIODS: Record<string, { label: string; days: number; bucketDays: number }> = {
    last7: { label: "Derniers 7 jours", days: 7, bucketDays: 1 },
    last30: { label: "Derniers 30 jours", days: 30, bucketDays: 1 },
    last90: { label: "Derniers 90 jours", days: 90, bucketDays: 7 },
    last365: { label: "Derniers 365 jours", days: 365, bucketDays: 30 },
};

const formatAmount = (value: number) => `${value.toLocaleString("fr-FR")} Ar`;

const Page = () => {
    const { user } = useUser()
    const [budgets, setBudgets] = useState<DashboardBudgets>([])
    const [goals, setGoals] = useState<SavingsGoal[]>([])
    const [period, setPeriod] = useState<string>("last30")
    const [loading, setLoading] = useState<boolean>(true)
    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => setNotification("")

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    const fetchDashboard = useCallback(async () => {
        const email = user?.primaryEmailAddress?.emailAddress ?? ""
        if (!email) {
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const [data, goalsData] = await Promise.all([
                getDashboardData(email),
                getSavingsGoalsByUser(email),
            ])
            setBudgets(data)
            setGoals(goalsData.map((g) => ({ ...g, targetDate: new Date(g.targetDate), createdAt: new Date(g.createdAt) })))
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la récupération du tableau de bord"))
        } finally {
            setLoading(false)
        }
    }, [user?.primaryEmailAddress?.emailAddress])

    useEffect(() => {
        void fetchDashboard()
    }, [fetchDashboard])

    const stats = useMemo(() => {
        const config = PERIODS[period] ?? PERIODS.last30
        const now = new Date()
        const dateLimit = new Date(now)
        dateLimit.setDate(now.getDate() - config.days)

        const totalBudgets = budgets.reduce((acc, b) => acc + b.amount, 0)
        const allTransactions = budgets.flatMap((budget) =>
            budget.transactions.map((t): Transaction => ({
                ...t,
                createdAt: new Date(t.createdAt),
                budgetName: budget.name,
                budgetId: budget.id,
            }))
        )
        const totalSpentAllTime = sumExpenses(allTransactions)
        const periodTransactions = allTransactions
            .filter((t) => t.createdAt >= dateLimit)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        const periodExpenses = periodTransactions.filter(isExpense)
        const totalSpentPeriod = sumExpenses(periodTransactions)
        const totalIncomePeriod = sumIncome(periodTransactions)
        const previousLimit = new Date(dateLimit)
        previousLimit.setDate(dateLimit.getDate() - config.days)
        const previousTransactions = allTransactions.filter((t) => t.createdAt >= previousLimit && t.createdAt < dateLimit)
        const comparison = comparePeriods(
            totalSpentPeriod,
            sumExpenses(previousTransactions),
            periodExpenses.length,
            previousTransactions.filter(isExpense).length
        )
        const unusual = detectUnusualSpending(periodExpenses)

        const byCategory = new Map<string, number>()
        for (const t of periodExpenses) {
            const category = normalizeTransactionCategory(t.category)
            byCategory.set(category, (byCategory.get(category) ?? 0) + t.amount)
        }
        const categories = [...byCategory.entries()]
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)

        const bucketCount = Math.ceil(config.days / config.bucketDays)
        const buckets: { key: string; label: string; total: number }[] = Array.from(
            { length: bucketCount },
            (_, i) => {
                const bucketStart = new Date(now)
                bucketStart.setDate(now.getDate() - config.days + i * config.bucketDays)
                return {
                    key: bucketStart.toISOString(),
                    label: bucketStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
                    total: 0,
                }
            }
        )
        for (const t of periodExpenses) {
            const diffDays = Math.floor((now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            const index = bucketCount - 1 - Math.floor(diffDays / config.bucketDays)
            if (index >= 0 && index < bucketCount) buckets[index].total += t.amount
        }
        const maxBucket = buckets.reduce((acc, b) => Math.max(acc, b.total), 0)

        const totalGoalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0)
        const totalGoalSaved = goals.reduce((acc, g) => acc + g.savedAmount, 0)
        const goalPercentage = totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0
        const alerts = budgets
            .map((budget) => {
                const spent = sumExpenses(budget.transactions)
                return { budget, alert: getBudgetAlert(spent, budget.amount) }
            })
            .filter(hasBudgetAlert)
            .sort((a, b) => b.alert.percentage - a.alert.percentage)

        return {
            totalBudgets,
            totalSpentPeriod,
            remaining: Math.max(0, totalBudgets - totalSpentAllTime),
            globalPercentage: totalBudgets > 0 ? Math.round((totalSpentAllTime / totalBudgets) * 100) : 0,
            transactionCount: periodExpenses.length,
            recent: periodTransactions.slice(0, 5),
            categories,
            buckets,
            maxBucket,
            periodLabel: config.label.toLowerCase(),
            totalGoalTarget,
            totalGoalSaved,
            goalPercentage: Math.min(goalPercentage, 100),
            topGoals: goals.slice(0, 3),
            alerts,
            comparison,
            unusual,
            totalIncomePeriod,
        }
    }, [budgets, goals, period])

    return (
        <Wrapper>
            {notification && (
                <Notification message={notification} onClose={closeNotification} />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h1 className="text-2xl font-bold">Tableau de bord</h1>
                <select
                    className="select select-bordered w-full sm:w-auto"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    aria-label="Période"
                >
                    {Object.entries(PERIODS).map(([value, config]) => (
                        <option key={value} value={value}>{config.label}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <span className="loading loading-bars loading-lg"></span>
                </div>
            ) : budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center min-h-[300px] px-4 rounded-2xl border-2 border-dashed border-base-300 bg-base-100">
                    <h2 className="text-lg font-semibold">Aucun budget</h2>
                    <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                        Créez votre premier budget pour voir vos statistiques ici.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100 border border-base-300">
                        <div className="stat">
                            <div className="stat-title">Total des budgets</div>
                            <div className="stat-value text-2xl text-accent">{formatAmount(stats.totalBudgets)}</div>
                            <div className="stat-desc">{budgets.length} budget{budgets.length > 1 ? "s" : ""}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Dépensé ({stats.periodLabel})</div>
                            <div className="stat-value text-2xl text-secondary">{formatAmount(stats.totalSpentPeriod)}</div>
                            <div className="stat-desc">{stats.transactionCount} dépense{stats.transactionCount > 1 ? "s" : ""}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Revenus ({stats.periodLabel})</div>
                            <div className="stat-value text-2xl text-success">{formatAmount(stats.totalIncomePeriod)}</div>
                            <div className="stat-desc">non comptés en dépenses</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Restant</div>
                            <div className="stat-value text-2xl text-primary">{formatAmount(stats.remaining)}</div>
                            <div className="stat-desc">{stats.globalPercentage}% consommé au total</div>
                        </div>
                    </div>

                    <div className="w-full bg-base-300 rounded-full h-2.5">
                        <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(stats.globalPercentage, 100)}%` }}
                        ></div>
                    </div>

                    <div className="card bg-base-100 border border-base-300 p-5">
                        <h2 className="font-bold text-lg mb-1">Alertes budgets</h2>
                        <p className="text-sm text-base-content/50 mb-2">Seuils 80 % / 100 % / dépassement, tous budgets confondus</p>
                        {stats.alerts.length === 0 ? (
                            <p className="text-sm text-success font-medium">Aucune alerte, budgets sous contrôle.</p>
                        ) : (
                            <ul className="divide-y divide-base-300">
                                {stats.alerts.map(({ budget, alert }) => (
                                    <li key={budget.id} className="flex items-center justify-between gap-3 py-2">
                                        <Link href={`/manage/${budget.id}`} className="flex items-center gap-3 min-w-0">
                                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                                                <CategoryIcon category={budget.category} className="w-4 h-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="font-medium block truncate">{budget.name}</span>
                                                <span className="text-xs text-base-content/50">
                                                    {formatAmount(alert.spent)} / {formatAmount(budget.amount)}
                                                </span>
                                            </span>
                                        </Link>
                                        <span className={`badge shrink-0 ${alert.level === "over" ? "badge-error" : alert.level === "critical" ? "badge-warning" : "badge-info"}`}>
                                            {BUDGET_ALERT_LABELS[alert.level]} · {alert.percentage}%
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="card bg-base-100 border border-base-300 p-5">
                            <h2 className="font-bold text-lg">Dépenses par catégorie</h2>
                            <p className="text-sm text-base-content/50 mb-4">{stats.periodLabel}</p>
                            {stats.categories.length === 0 ? (
                                <p className="text-sm text-base-content/50">Aucune dépense sur cette période.</p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {stats.categories.map((category) => (
                                        <li key={category.name}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium">{category.name}</span>
                                                <span>
                                                    <span className="font-bold">{formatAmount(category.total)}</span>
                                                    <span className="text-base-content/50"> ({stats.totalSpentPeriod > 0 ? Math.round((category.total / stats.totalSpentPeriod) * 100) : 0}%)</span>
                                                </span>
                                            </div>
                                            <div className="w-full bg-base-300 rounded-full h-2">
                                                <div
                                                    className="bg-secondary h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${stats.totalSpentPeriod > 0 ? Math.min(100, Math.round((category.total / stats.totalSpentPeriod) * 100)) : 0}%` }}
                                                ></div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="card bg-base-100 border border-base-300 p-5">
                            <h2 className="font-bold text-lg">Évolution des dépenses</h2>
                            <p className="text-sm text-base-content/50 mb-4">{stats.periodLabel}</p>
                            {stats.maxBucket === 0 ? (
                                <p className="text-sm text-base-content/50">Aucune dépense sur cette période.</p>
                            ) : (
                                <>
                                    <div className="flex items-end gap-1 h-40">
                                        {stats.buckets.map((bucket) => (
                                            <div
                                                key={bucket.key}
                                                title={`${bucket.label} : ${formatAmount(bucket.total)}`}
                                                className="flex-1 min-w-0 bg-primary/70 hover:bg-primary rounded-t transition-all duration-300"
                                                style={{ height: `${Math.max(4, Math.round((bucket.total / stats.maxBucket) * 100))}%` }}
                                            ></div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-xs text-base-content/50 mt-2">
                                        <span>{stats.buckets[0]?.label}</span>
                                        <span>{stats.buckets[stats.buckets.length - 1]?.label}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="card bg-base-100 border border-base-300 p-5">
                            <h2 className="font-bold text-lg">Comparaison de période</h2>
                            <p className="text-sm text-base-content/50 mb-4">Période actuelle contre les {stats.periodLabel} précédents</p>
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="text-xs text-base-content/50">Actuelle</p>
                                    <p className="text-xl font-bold">{formatAmount(stats.comparison.currentTotal)}</p>
                                    <p className="text-xs text-base-content/50 mt-2">Précédente</p>
                                    <p className="text-lg font-semibold">{formatAmount(stats.comparison.previousTotal)}</p>
                                </div>
                                {stats.comparison.deltaPercent === null ? (
                                    <span className="badge">Sans référence</span>
                                ) : (
                                    <span className={`badge ${stats.comparison.deltaPercent > 0 ? "badge-error" : stats.comparison.deltaPercent < 0 ? "badge-success" : "badge-ghost"}`}>
                                        {stats.comparison.deltaPercent > 0 ? "+" : ""}{stats.comparison.deltaPercent}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="card bg-base-100 border border-base-300 p-5">
                            <h2 className="font-bold text-lg">Dépenses inhabituelles</h2>
                            <p className="text-sm text-base-content/50 mb-4">Montant {">"} 2× la moyenne de sa catégorie (règle fixe, min. 3 transactions)</p>
                            {stats.unusual.length === 0 ? (
                                <p className="text-sm text-base-content/50">Rien à signaler sur cette période.</p>
                            ) : (
                                <ul className="divide-y divide-base-300">
                                    {stats.unusual.map((u) => (
                                        <li key={u.id} className="flex justify-between items-center py-2 gap-3">
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{u.description}</p>
                                                <p className="text-xs text-base-content/50">{u.ratio}× la moyenne « {u.category} » ({formatAmount(u.categoryAverage)})</p>
                                            </div>
                                            <span className="font-semibold text-sm shrink-0">{formatAmount(u.amount)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="card bg-base-100 border border-base-300 p-5 lg:col-span-2">
                            <h2 className="font-bold text-lg mb-1">Dépenses récentes</h2>
                            <p className="text-sm text-base-content/50 mb-2">5 dernières transactions</p>
                            {stats.recent.length === 0 ? (
                                <p className="text-sm text-base-content/50">Aucune transaction sur cette période.</p>
                            ) : (
                            <ul className="divide-y divide-base-300">
                                {stats.recent.map((transaction) => (
                                    <TransactionItem key={transaction.id} transaction={transaction} />
                                ))}
                            </ul>
                        )}
                    </div>

                        <div className="card bg-base-100 border border-base-300 p-5">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="font-bold text-lg">Objectifs d&apos;épargne</h2>
                                <Link href="/objectifs" className="btn btn-sm btn-ghost">Voir tout</Link>
                            </div>
                            {goals.length === 0 ? (
                                <p className="text-sm text-base-content/50">Aucun objectif pour le moment.</p>
                            ) : (
                                <>
                                    <p className="text-sm text-base-content/50 mb-4">
                                        {formatAmount(stats.totalGoalSaved)} épargnés sur {formatAmount(stats.totalGoalTarget)} ({stats.goalPercentage}%)
                                    </p>
                                    <div className="w-full bg-base-300 rounded-full h-2.5 mb-4">
                                        <div
                                            className="bg-accent h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${stats.goalPercentage}%` }}
                                        ></div>
                                    </div>
                                <ul className="grid grid-cols-1 gap-5">
                                    {stats.topGoals.map((goal) => (
                                        <Link href="/objectifs" key={goal.id}>
                                            <SavingsGoalItem goal={goal} enableHover={1} />
                                        </Link>
                                    ))}
                                </ul>
                                </>
                            )}
                        </div>

                        <div className="card bg-base-100 border border-base-300 p-5">
                        <h2 className="font-bold text-lg mb-1">Détail par budget</h2>
                        <p className="text-sm text-base-content/50 mb-4">Prévu, dépensé, restant et pourcentage consommé</p>
                        <ul className="grid grid-cols-1 gap-5">
                                {budgets.map((budget) => (
                                    <Link href={`/manage/${budget.id}`} key={budget.id}>
                                        <BudgetItem budget={{ ...budget, createdAt: new Date(budget.createdAt) }} enableHover={1} />
                                    </Link>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                )}
        </Wrapper>
    )
}

export default Page