"use client"
import { TRANSACTION_CATEGORIES, Transaction } from '@/type'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { getBudgetOptions, getTransactionsByEmailAndPeriod, TransactionFilters } from '../action'
import { csvFilename, downloadCsv, transactionsToCsv } from '@/lib/csv'
import Wrapper from '@/components/Wrapper'
import TransactionItem from '@/components/TransactionItem'
import { Download } from 'lucide-react'

const Page = () => {

    const { user } = useUser()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [budgetOptions, setBudgetOptions] = useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [period, setPeriod] = useState<string>("last30")
    const [search, setSearch] = useState<string>("")
    const [debouncedSearch, setDebouncedSearch] = useState<string>("")
    const [category, setCategory] = useState<string>("all")
    const [budgetId, setBudgetId] = useState<string>("all")
    const [minAmount, setMinAmount] = useState<string>("")
    const [maxAmount, setMaxAmount] = useState<string>("")

    const userEmail = user?.primaryEmailAddress?.emailAddress ?? ""
    const hasActiveFilters = debouncedSearch.trim() !== "" || category !== "all" || budgetId !== "all" || minAmount !== "" || maxAmount !== ""

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        if (!userEmail) {
            setLoading(false)
            return
        }
        const loadOptions = async () => {
            try {
                setBudgetOptions(await getBudgetOptions(userEmail))
            } catch (error) {
                console.error("Erreur lors de la récupération des budgets ", error);
            }
        }
        void loadOptions()
    }, [userEmail])

    useEffect(() => {
        if (!userEmail) {
            setLoading(false)
            return
        }
        setLoading(true)
        const filters: TransactionFilters = {
            search: debouncedSearch.trim() || undefined,
            category,
            budgetId,
            minAmount: minAmount !== "" ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount !== "" ? parseFloat(maxAmount) : undefined,
        }
        getTransactionsByEmailAndPeriod(userEmail, period, filters)
            .then((transactionsData) => {
                setTransactions(transactionsData.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })))
            })
            .catch((error) => {
                console.error("Erreur lors de la récupération des transactions ", error);
            })
            .finally(() => {
                setLoading(false)
            })
    }, [userEmail, period, debouncedSearch, category, budgetId, minAmount, maxAmount])

    const resetFilters = () => {
        setSearch("")
        setDebouncedSearch("")
        setCategory("all")
        setBudgetId("all")
        setMinAmount("")
        setMaxAmount("")
    }

    const handleExportCsv = () => {
        downloadCsv(csvFilename(), transactionsToCsv(transactions))
    }

    return (
        <Wrapper>

            <div className='flex flex-col lg:flex-row gap-2 mb-5'>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par description..."
                    className='input input-bordered flex-1 min-w-0'
                    aria-label="Rechercher par description"
                />
                <select
                    className='select select-bordered'
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Filtrer par catégorie"
                >
                    <option value="all">Toutes catégories</option>
                    {TRANSACTION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select
                    className='select select-bordered'
                    value={budgetId}
                    onChange={(e) => setBudgetId(e.target.value)}
                    aria-label="Filtrer par budget"
                >
                    <option value="all">Tous budgets</option>
                    {budgetOptions.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
                <div className='flex gap-2'>
                    <input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        placeholder="Min Ar"
                        min={0}
                        className='input input-bordered w-full lg:w-28'
                        aria-label="Montant minimum"
                    />
                    <input
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        placeholder="Max Ar"
                        min={0}
                        className='input input-bordered w-full lg:w-28'
                        aria-label="Montant maximum"
                    />
                </div>
                <select
                    className='input input-bordered input-md'
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    aria-label="Période"
                >
                    <option value="last7">Derniers 7 jours</option>
                    <option value="last30">Derniers 30 jours</option>
                    <option value="last90">Derniers 90 jours</option>
                    <option value="last365">Derniers 365 jours</option>
                </select>
                {hasActiveFilters && (
                    <button className='btn btn-ghost' onClick={resetFilters}>
                        Réinitialiser
                    </button>
                )}
                <button className='btn btn-outline' onClick={handleExportCsv}>
                    <Download className="h-4 w-4" /> Exporter CSV
                </button>
            </div>

            <div className='overflow-x-auto w-full gb-base-200/35 p-5 rounded-xl'>
                {
                    loading ? (
                        <div className='flex items-center justify-center h-64'>
                            <span className="loading loading-bars loading-lg"></span>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className='flex flex-col items-center justify-center h-64'>
                            <h1>{hasActiveFilters ? "Aucun résultat pour ces filtres" : "Aucune transaction"}</h1>
                        </div>
                    ) : (
                        <div>
                            <p className='text-sm text-base-content/50 mb-3'>{transactions.length} transaction{transactions.length > 1 ? "s" : ""}</p>
                            <ul className='divide-y divide-base-300'>
                                {transactions.map((transaction) => (
                                    <li key={transaction.id}>
                                        <TransactionItem transaction={transaction} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                }
            </div>
        </Wrapper>
    )
}

export default Page
