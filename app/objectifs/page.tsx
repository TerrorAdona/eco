"use client"

import Wrapper from '@/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useState } from 'react'
import { addSavingsGoal, deleteSavingsGoal, getSavingsGoalsByUser, updateSavingsGoal } from '../action'
import Notification from '@/components/Notification'
import { SavingsGoal } from '@/type'
import SavingsGoalItem from '@/components/SavingsGoalItem'
import { HandCoins } from 'lucide-react'

const toDateInputValue = (value: Date | string) => {
    const date = new Date(value)
    return isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

const Page = () => {

    const { user } = useUser()
    const [goalName, setGoalName] = useState<string>("")
    const [targetAmount, setTargetAmount] = useState<string>("")
    const [savedAmount, setSavedAmount] = useState<string>("")
    const [targetDate, setTargetDate] = useState<string>("")
    const [goals, setGoals] = useState<SavingsGoal[]>([])
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null)

    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const getUserEmail = () => user?.primaryEmailAddress?.emailAddress ?? ""

    const resetForm = () => {
        setGoalName("")
        setTargetAmount("")
        setSavedAmount("")
        setTargetDate("")
        setEditingGoalId(null)
    }

    const closeModal = () => {
        const modal = document.getElementById("goal_modal") as HTMLDialogElement | null
        modal?.close()
    }

    const openCreateModal = () => {
        resetForm()
        const modal = document.getElementById("goal_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const openEditModal = (goal: SavingsGoal) => {
        setGoalName(goal.name)
        setTargetAmount(String(goal.targetAmount))
        setSavedAmount(String(goal.savedAmount))
        setTargetDate(toDateInputValue(goal.targetDate))
        setEditingGoalId(goal.id)
        const modal = document.getElementById("goal_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    const fetchGoals = useCallback(async () => {
        const email = user?.primaryEmailAddress?.emailAddress ?? ""
        if (email) {
            try {
                const data = await getSavingsGoalsByUser(email)
                setGoals(data.map((g) => ({ ...g, targetDate: new Date(g.targetDate), createdAt: new Date(g.createdAt) })))
            } catch (error: unknown) {
                setNotification(getErrorMessage(error, "Erreur lors de la récupération des objectifs"))
            }
        }
    }, [user?.primaryEmailAddress?.emailAddress])

    useEffect(() => {
        fetchGoals()
    }, [fetchGoals])

    const handleSubmitGoal = async () => {
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            const target = parseFloat(targetAmount)
            const saved = savedAmount === "" ? 0 : parseFloat(savedAmount)
            if (isNaN(target) || target <= 0) throw new Error("Montant cible invalide")
            if (isNaN(saved) || saved < 0) throw new Error("Montant épargné invalide")
            if (!goalName.trim()) throw new Error("Nom de l'objectif requis")
            if (!targetDate) throw new Error("Date cible requise")

            if (editingGoalId) {
                await updateSavingsGoal(email, editingGoalId, goalName, target, saved, targetDate)
                setNotification("Objectif modifié avec succès")
            } else {
                await addSavingsGoal(email, goalName, target, saved, targetDate)
                setNotification("Objectif ajouté avec succès")
            }

            await fetchGoals()
            closeModal()
            resetForm()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de l'enregistrement de l'objectif"))
        }
    }

    const handleDeleteGoal = async (goalId: string) => {
        const confirmed = window.confirm("Voulez vous réellement supprimer cet objectif ?")
        if (!confirmed) return
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            await deleteSavingsGoal(goalId, email)
            setNotification("Objectif supprimé avec succès")
            await fetchGoals()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la suppression de l'objectif"))
        }
    }

    return (
        <div>
            <Wrapper>

                {notification && (
                    <Notification message={notification} onClose={closeNotification}/>
                )}

                <button className="btn btn-outline btn-primary" onClick={openCreateModal}>Nouvel objectif <HandCoins /></button>
                <dialog id="goal_modal" className="modal">
                    <div className="modal-box">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={resetForm}>✕</button>
                        </form>
                        <h3 className="font-bold text-lg">{editingGoalId ? "Modification de l'objectif" : "Création d'un objectif"}</h3>
                        <p className="py-4">Épargnez étape par étape pour vos projets</p>
                        <div className='w-full flex flex-col'>

                            <input type="text" value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Nom de l'objectif" className='w-full input input-bordered mb-3' required />

                            <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder='Montant cible' className='w-full input input-bordered mb-3' required />

                            <input type="number" value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} placeholder='Montant déjà épargné' className='w-full input input-bordered mb-3' />

                            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className='w-full input input-bordered mb-3' required />

                            <button
                            className='btn btn-primary mt-3'
                            onClick={handleSubmitGoal}
                            >{editingGoalId ? "Mettre à jour" : "Créer"}</button>

                        </div>
                    </div>
                </dialog>

                <ul className='grid md:grid-cols-3 gap-5 mt-5'>
                    {goals.map((goal) => (
                        <li key={goal.id} className="flex flex-col gap-2">
                            <SavingsGoalItem goal={goal} enableHover={0} />
                            <div className="flex gap-2">
                                <button className="btn btn-sm btn-outline flex-1" onClick={() => openEditModal(goal)}>Modifier</button>
                                <button className="btn btn-sm btn-ghost flex-1" onClick={() => handleDeleteGoal(goal.id)}>Supprimer</button>
                            </div>
                        </li>
                    ))}
                </ul>

            </Wrapper>
        </div>
    )

}

export default Page
