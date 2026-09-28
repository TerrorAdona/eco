"use client"

import Wrapper from '@/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { addRecurringTransaction, deleteRecurringTransaction, getBudgetOptions, getRecurringTransactionsByUser, toggleRecurringTransaction, updateRecurringTransaction } from '../action'
import { nextOccurrences } from '@/lib/recurrence'
import Notification from '@/components/Notification'
import { DEFAULT_TRANSACTION_CATEGORY, normalizeRecurringFrequency, normalizeRecurringType, normalizeTransactionCategory, RECURRING_FREQUENCIES, RECURRING_FREQUENCY_LABELS, RECURRING_TYPE_LABELS, RECURRING_TYPES, RecurringTransaction, TRANSACTION_CATEGORIES } from '@/type'
import { CalendarClock, Pencil, Trash } from 'lucide-react'

const toDateInputValue = (value: Date | string) => {
    const date = new Date(value)
    return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

const Page = () => {

    const { user } = useUser()
    const [description, setDescription] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [type, setType] = useState<string>("DEPENSE")
    const [category, setCategory] = useState<string>(DEFAULT_TRANSACTION_CATEGORY)
    const [frequency, setFrequency] = useState<string>("MONTHLY")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [budgetId, setBudgetId] = useState<string>("none")
    const [items, setItems] = useState<RecurringTransaction[]>([])
    const [budgetOptions, setBudgetOptions] = useState<{ id: string; name: string }[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)

    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const getUserEmail = () => user?.primaryEmailAddress?.emailAddress ?? ""

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    const resetForm = () => {
        setDescription("")
        setAmount("")
        setType("DEPENSE")
        setCategory(DEFAULT_TRANSACTION_CATEGORY)
        setFrequency("MONTHLY")
        setStartDate("")
        setEndDate("")
        setBudgetId("none")
        setEditingId(null)
    }

    const closeModal = () => {
        const modal = document.getElementById("recurring_modal") as HTMLDialogElement | null
        modal?.close()
    }

    const openCreateModal = () => {
        resetForm()
        const modal = document.getElementById("recurring_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const openEditModal = (item: RecurringTransaction) => {
        setDescription(item.description)
        setAmount(String(item.amount))
        setType(normalizeRecurringType(item.type))
        setCategory(normalizeTransactionCategory(item.category))
        setFrequency(normalizeRecurringFrequency(item.frequency))
        setStartDate(toDateInputValue(item.startDate))
        setEndDate(item.endDate ? toDateInputValue(item.endDate) : "")
        setBudgetId(item.budgetId ?? "none")
        setEditingId(item.id)
        const modal = document.getElementById("recurring_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const fetchItems = useCallback(async () => {
        const email = user?.primaryEmailAddress?.emailAddress ?? ""
        if (email) {
            try {
                const [data, options] = await Promise.all([
                    getRecurringTransactionsByUser(email),
                    getBudgetOptions(email),
                ])
                setItems(data.map((r) => ({
                    ...r,
                    startDate: new Date(r.startDate),
                    endDate: r.endDate ? new Date(r.endDate) : null,
                    createdAt: new Date(r.createdAt),
                })))
                setBudgetOptions(options)
            } catch (error: unknown) {
                setNotification(getErrorMessage(error, "Erreur lors de la récupération des récurrents"))
            }
        }
    }, [user?.primaryEmailAddress?.emailAddress])

    useEffect(() => {
        fetchItems()
    }, [fetchItems])

    const upcoming = useMemo(() => {
        const now = new Date()
        return items
            .filter((item) => item.isActive)
            .flatMap((item) =>
                nextOccurrences(item.startDate, normalizeRecurringFrequency(item.frequency), item.endDate, now, 3)
                    .map((date) => ({ item, date }))
            )
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 10)
    }, [items])

    const nextDateOf = (item: RecurringTransaction) => {
        if (!item.isActive) return null
        const next = nextOccurrences(item.startDate, normalizeRecurringFrequency(item.frequency), item.endDate, new Date(), 1)
        return next.length > 0 ? next[0] : null
    }

    const handleSubmit = async () => {
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            const amountNumber = parseFloat(amount)
            if (!description.trim()) throw new Error("Description requise")
            if (isNaN(amountNumber) || amountNumber <= 0) throw new Error("Montant invalide")
            if (!startDate) throw new Error("Date de début requise")

            if (editingId) {
                await updateRecurringTransaction(email, editingId, description, amountNumber, type, category, frequency, startDate, endDate || null, budgetId)
                setNotification("Récurrent modifié avec succès")
            } else {
                await addRecurringTransaction(email, description, amountNumber, type, category, frequency, startDate, endDate || null, budgetId)
                setNotification("Récurrent ajouté avec succès")
            }

            await fetchItems()
            closeModal()
            resetForm()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de l'enregistrement"))
        }
    }

    const handleToggle = async (id: string) => {
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            await toggleRecurringTransaction(email, id)
            await fetchItems()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors du changement d'état"))
        }
    }

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm("Voulez vous réellement supprimer cette transaction récurrente ? Aucune transaction existante ne sera supprimée.")
        if (!confirmed) return
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            await deleteRecurringTransaction(id, email)
            setNotification("Récurrent supprimé avec succès")
            await fetchItems()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la suppression"))
        }
    }

    return (
        <div>
            <Wrapper>

                {notification && (
                    <Notification message={notification} onClose={closeNotification} />
                )}

                <button className="btn btn-outline btn-primary" onClick={openCreateModal}>Nouveau récurrent <CalendarClock /></button>
                <dialog id="recurring_modal" className="modal">
                    <div className="modal-box">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={resetForm}>✕</button>
                        </form>
                        <h3 className="font-bold text-lg">{editingId ? "Modification du récurrent" : "Création d'un récurrent"}</h3>
                        <p className="py-4">Planifiez une dépense ou un revenu qui se répète</p>
                        <div className='w-full flex flex-col'>

                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Description' className='w-full input input-bordered mb-3' required />

                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder='Montant' className='w-full input input-bordered mb-3' required />

                            <div className='flex gap-2 mb-3'>
                                <select value={type} onChange={(e) => setType(e.target.value)} className='flex-1 select select-bordered' aria-label='Type'>
                                    {RECURRING_TYPES.map((t) => (
                                        <option key={t} value={t}>{RECURRING_TYPE_LABELS[t]}</option>
                                    ))}
                                </select>
                                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className='flex-1 select select-bordered' aria-label='Fréquence'>
                                    {RECURRING_FREQUENCIES.map((f) => (
                                        <option key={f} value={f}>{RECURRING_FREQUENCY_LABELS[f]}</option>
                                    ))}
                                </select>
                            </div>

                            <select value={category} onChange={(e) => setCategory(e.target.value)} className='w-full select select-bordered mb-3' aria-label='Catégorie'>
                                {TRANSACTION_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <select value={budgetId} onChange={(e) => setBudgetId(e.target.value)} className='w-full select select-bordered mb-3' aria-label='Budget associé (optionnel)'>
                                <option value="none">Sans budget associé</option>
                                {budgetOptions.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>

                            <div className='flex gap-2 mb-3'>
                                <label className='flex-1 flex flex-col gap-1 text-sm'>
                                    Début
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className='w-full input input-bordered' required />
                                </label>
                                <label className='flex-1 flex flex-col gap-1 text-sm'>
                                    Fin (optionnelle)
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className='w-full input input-bordered' />
                                </label>
                            </div>

                            <button
                                className='btn btn-primary mt-3'
                                onClick={handleSubmit}
                            >{editingId ? "Mettre à jour" : "Créer"}</button>

                        </div>
                    </div>
                </dialog>

                <div className="card bg-base-100 border border-base-300 p-5 mt-5">
                    <h2 className="font-bold text-lg mb-1">Prochaines prévues</h2>
                    <p className="text-sm text-base-content/50 mb-2">Calculées automatiquement, rien n&apos;est généré sans votre action</p>
                    {upcoming.length === 0 ? (
                        <p className="text-sm text-base-content/50">Aucune occurrence à venir. Activez un récurrent pour voir ses prochaines dates.</p>
                    ) : (
                        <ul className="divide-y divide-base-300">
                            {upcoming.map(({ item, date }) => (
                                <li key={`${item.id}-${date.toISOString()}`} className="flex justify-between items-center py-2 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="badge badge-outline shrink-0">
                                            {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                                        </span>
                                        <span className="font-medium truncate">{item.description}</span>
                                        <span className="badge badge-secondary badge-sm hidden sm:inline-flex">{normalizeTransactionCategory(item.category)}</span>
                                    </div>
                                    <span className={`font-semibold text-sm shrink-0 ${normalizeRecurringType(item.type) === "REVENU" ? "text-success" : "text-primary"}`}>
                                        {normalizeRecurringType(item.type) === "REVENU" ? "+" : "-"}{item.amount.toLocaleString("fr-FR")} Ar
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <ul className='grid md:grid-cols-2 gap-5 mt-5'>
                    {items.map((item) => {
                        const next = nextDateOf(item)
                        return (
                            <li key={item.id} className={`card border-2 border-base-300 bg-base-100 list-none p-4 ${!item.isActive ? "opacity-60" : ""}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="text-3xl">🔁</div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold truncate">{item.description}</span>
                                            <span className="flex flex-wrap items-center gap-1 mt-1">
                                                <span className="badge badge-outline badge-sm">{RECURRING_FREQUENCY_LABELS[normalizeRecurringFrequency(item.frequency)]}</span>
                                                <span className="badge badge-secondary badge-sm">{normalizeTransactionCategory(item.category)}</span>
                                                <span className={`badge badge-sm ${normalizeRecurringType(item.type) === "REVENU" ? "badge-success" : "badge-accent"}`}>{RECURRING_TYPE_LABELS[normalizeRecurringType(item.type)]}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-lg font-bold shrink-0">
                                        {item.amount.toLocaleString("fr-FR")} Ar
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm">
                                    <span className="text-base-content/50">
                                        {next ? `Prochaine : ${next.toLocaleDateString("fr-FR")}` : "Terminée"}
                                        {item.budgetName ? ` · ${item.budgetName}` : ""}
                                    </span>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary"
                                        checked={item.isActive}
                                        onChange={() => handleToggle(item.id)}
                                        aria-label={item.isActive ? "Désactiver" : "Activer"}
                                    />
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button className="btn btn-sm btn-outline flex-1" onClick={() => openEditModal(item)} aria-label="Modifier">
                                        <Pencil className="h-4 w-4" /> Modifier
                                    </button>
                                    <button className="btn btn-sm btn-ghost flex-1" onClick={() => handleDelete(item.id)} aria-label="Supprimer">
                                        <Trash className="h-4 w-4" /> Supprimer
                                    </button>
                                </div>
                            </li>
                        )
                    })}
                </ul>

            </Wrapper>
        </div>
    )

}

export default Page
