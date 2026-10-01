"use client"

import Wrapper from '@/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BUDGET_ALERT_LABELS, getBudgetAlert, hasBudgetAlert, sumExpenses } from '@/lib/budget-alerts'
import { addBudget, deleteBudget, getBudgetsByUser, updateBudget } from '../action'
import Notification from '@/components/Notification'
import { Budget, DEFAULT_TRANSACTION_CATEGORY, normalizeTransactionCategory, TRANSACTION_CATEGORIES } from '@/type'
import Link from 'next/link'
import BudgetItem from '@/components/BudgetItem'
import { HandCoins } from 'lucide-react'

const Page = () => {

    const { user } = useUser()
    const [budgetName, setBudgetName] = useState<string>("")
    const [budgetAmount, setBudgetAmount] = useState<string>("")
    const [budgetCategory, setBudgetCategory] = useState<string>(DEFAULT_TRANSACTION_CATEGORY)
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)

    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const getUserEmail = () => user?.primaryEmailAddress?.emailAddress ?? ""

    const resetForm = () => {
        setBudgetName("")
        setBudgetAmount("")
        setBudgetCategory(DEFAULT_TRANSACTION_CATEGORY)
        setEditingBudgetId(null)
    }

    const closeModal = () => {
        const modal = document.getElementById("my_modal_3") as HTMLDialogElement | null
        modal?.close()
    }

    const openCreateModal = () => {
        resetForm()
        const modal = document.getElementById("my_modal_3") as HTMLDialogElement | null
        modal?.showModal()
    }

    const openEditModal = (budget: Budget) => {
        setBudgetName(budget.name)
        setBudgetAmount(String(budget.amount))
        setBudgetCategory(normalizeTransactionCategory(budget.category))
        setEditingBudgetId(budget.id)
        const modal = document.getElementById("my_modal_3") as HTMLDialogElement | null
        modal?.showModal()
    }

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    const fetchBudgets = useCallback(async () => {
        const email = user?.primaryEmailAddress?.emailAddress ?? ""
        if (email) {
            try {
                const data = await getBudgetsByUser(email)
                setBudgets(data)
            } catch (error: unknown) {
                setNotification(getErrorMessage(error, "Erreur lors de la récupération des budgets"))
            }
        }
    }, [user?.primaryEmailAddress?.emailAddress])

    useEffect(() => {
        fetchBudgets()
    }, [fetchBudgets])

    const budgetAlerts = useMemo(() => {
        return budgets
            .map((budget) => {
                const spent = sumExpenses(budget.transactions ?? [])
                const alert = getBudgetAlert(spent, budget.amount)
                return { budget, alert }
            })
            .filter(hasBudgetAlert)
            .sort((a, b) => b.alert.percentage - a.alert.percentage)
    }, [budgets])

    const alertedRef = useRef<string>("")
    useEffect(() => {
        if (notification !== "" || budgetAlerts.length === 0) return
        const key = budgetAlerts.map(({ budget, alert }) => `${budget.id}:${alert.percentage}`).join("|")
        if (alertedRef.current === key) return
        alertedRef.current = key
        const worst = budgetAlerts[0]
        const extra = budgetAlerts.length > 1 ? ` (+${budgetAlerts.length - 1} autre${budgetAlerts.length > 2 ? "s" : ""})` : ""
        setNotification(`${BUDGET_ALERT_LABELS[worst.alert.level]} : "${worst.budget.name}" à ${worst.alert.percentage}%${extra}`)
    }, [budgets, budgetAlerts, notification])

    const handleSubmitBudget = async () => {
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            const amount = parseFloat(budgetAmount)
            if (isNaN(amount) || amount <= 0) throw new Error("Montant invalide")
            if (!budgetName.trim()) throw new Error("Nom du budget requis")

            if (editingBudgetId) {
                await updateBudget(email, editingBudgetId, budgetName, amount, budgetCategory)
                setNotification("Budget modifié avec succès")
            } else {
                await addBudget(email, budgetName, amount, budgetCategory)
                setNotification("Budget ajouté avec succès")
            }

            await fetchBudgets()
            closeModal()
            resetForm()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de l'enregistrement du budget"))
        }
    }

    const handleDeleteBudget = async (budgetId: string) => {
        const confirmed = window.confirm("Voulez vous réellement supprimer ce budget et toutes les transactions associées ?")
        if (!confirmed) return
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            await deleteBudget(budgetId, email)
            setNotification("Budget supprimé avec succès")
            await fetchBudgets()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la suppression du budget"))
        }
    }

    return (
        <div>
            <Wrapper>

                {notification && (
                    <Notification message={notification} onClose={closeNotification}/>
                )}

                <button className="btn btn-outline btn-primary" onClick={openCreateModal}>Nouveau budget <HandCoins /></button>
                <dialog id="my_modal_3" className="modal">
                    <div className="modal-box">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={resetForm}>✕</button>
                        </form>
                        <h3 className="font-bold text-lg">{editingBudgetId ? "Modification du budget" : "Création d'un budget"}</h3>
                        <p className="py-4">Permet de controler ces dépenses</p>
                        <div className='w-full flex flex-col'>

                            <input type="text" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} placeholder='Nom du budget' className='w-full input input-bordered mb-3' required />

                            <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder='Montant du budget' className='w-full input input-bordered mb-3' required />

                            <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} className='w-full select select-bordered mb-3' aria-label='Catégorie du budget'>
                                {TRANSACTION_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <button
                            className='btn btn-primary mt-3'
                            onClick={handleSubmitBudget}
                            >{editingBudgetId ? "Mettre à jour" : "Créer"}</button>

                        </div>
                    </div>
                </dialog>

                <ul className='grid md:grid-cols-3 gap-5 mt-5'>
                    {budgets.map((budget) => (
                        <li key={budget.id} className="flex flex-col gap-2">
                            <Link href={`/manage/${budget.id}`}>
                                <BudgetItem budget={budget} enableHover={1} />
                            </Link>
                            <div className="flex gap-2">
                                <button className="btn btn-sm btn-outline flex-1" onClick={() => openEditModal(budget)}>Modifier</button>
                                <button className="btn btn-sm btn-ghost flex-1" onClick={() => handleDeleteBudget(budget.id)}>Supprimer</button>
                            </div>
                        </li>
                    ))}
                </ul>

            </Wrapper>
        </div>
    )

}

export default Page