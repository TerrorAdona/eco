"use client"

import Wrapper from '@/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useState } from 'react'
import { addTransfer, deleteTransfer, getAccounts, getTransfersByUser, updateTransfer } from '../action'
import Notification from '@/components/Notification'
import { Transfer } from '@/type'
import { ArrowLeftRight } from 'lucide-react'

const Page = () => {

    const { user } = useUser()
    const [sourceAccountId, setSourceAccountId] = useState<string>("")
    const [destAccountId, setDestAccountId] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [transfers, setTransfers] = useState<Transfer[]>([])
    const [accountOptions, setAccountOptions] = useState<{ id: string; name: string; currency: string }[]>([])
    const [editingTransferId, setEditingTransferId] = useState<string | null>(null)

    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const getUserEmail = () => user?.primaryEmailAddress?.emailAddress ?? ""

    const resetForm = () => {
        setSourceAccountId("")
        setDestAccountId("")
        setAmount("")
        setDescription("")
        setEditingTransferId(null)
    }

    const closeModal = () => {
        const modal = document.getElementById("transfer_modal") as HTMLDialogElement | null
        modal?.close()
    }

    const openCreateModal = () => {
        resetForm()
        const modal = document.getElementById("transfer_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const openEditModal = (transfer: Transfer) => {
        setSourceAccountId(transfer.sourceAccountId)
        setDestAccountId(transfer.destAccountId)
        setAmount(String(transfer.amount))
        setDescription(transfer.description ?? "")
        setEditingTransferId(transfer.id)
        const modal = document.getElementById("transfer_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    const fetchData = useCallback(async () => {
        const email = user?.primaryEmailAddress?.emailAddress ?? ""
        if (!email) return
        try {
            const [data, accounts] = await Promise.all([
                getTransfersByUser(email),
                getAccounts(email),
            ])
            setTransfers(data.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })))
            setAccountOptions(accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency })))
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la récupération des transferts"))
        }
    }, [user?.primaryEmailAddress?.emailAddress])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSubmit = async () => {
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            const amountNumber = parseFloat(amount)
            if (!sourceAccountId) throw new Error("Compte source requis")
            if (!destAccountId) throw new Error("Compte destination requis")

            if (editingTransferId) {
                await updateTransfer(email, editingTransferId, sourceAccountId, destAccountId, amountNumber, description || null)
                setNotification("Transfert modifié avec succès")
            } else {
                await addTransfer(email, sourceAccountId, destAccountId, amountNumber, description || null)
                setNotification("Transfert effectué avec succès")
            }

            await fetchData()
            closeModal()
            resetForm()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors du transfert"))
        }
    }

    const handleDelete = async (transferId: string) => {
        const confirmed = window.confirm("Voulez vous réellement supprimer ce transfert ? Les soldes seront rétablis.")
        if (!confirmed) return
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            await deleteTransfer(transferId, email)
            setNotification("Transfert supprimé avec succès")
            await fetchData()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la suppression du transfert"))
        }
    }

    return (
        <div>
            <Wrapper>

                {notification && (
                    <Notification message={notification} onClose={closeNotification}/>
                )}

                <button className="btn btn-outline btn-primary" onClick={openCreateModal}>Nouveau transfert <ArrowLeftRight /></button>
                <dialog id="transfer_modal" className="modal">
                    <div className="modal-box">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={resetForm}>✕</button>
                        </form>
                        <h3 className="font-bold text-lg">{editingTransferId ? "Modification du transfert" : "Nouveau transfert"}</h3>
                        <p className="py-4">Déplacez de l&apos;argent entre vos comptes, sans impact sur vos dépenses</p>
                        <div className='w-full flex flex-col'>

                            <div className='flex gap-2 mb-3'>
                                <select value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)} className='flex-1 select select-bordered' aria-label='Compte source' required>
                                    <option value="">Compte source</option>
                                    {accountOptions.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                                <select value={destAccountId} onChange={(e) => setDestAccountId(e.target.value)} className='flex-1 select select-bordered' aria-label='Compte destination' required>
                                    <option value="">Compte destination</option>
                                    {accountOptions.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder='Montant' className='w-full input input-bordered mb-3' required />

                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Description (optionnelle)' className='w-full input input-bordered mb-3' />

                            <button
                            className='btn btn-primary mt-3'
                            onClick={handleSubmit}
                            >{editingTransferId ? "Mettre à jour" : "Confirmer le transfert"}</button>

                        </div>
                    </div>
                </dialog>

                {transfers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center min-h-[300px] px-4 mt-5 rounded-2xl border-2 border-dashed border-base-300 bg-base-100">
                        <h2 className="text-lg font-semibold">Aucun transfert</h2>
                        <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                            Transférez de l&apos;argent entre vos comptes en toute sécurité.
                        </p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2 mt-5">
                        {transfers.map((transfer) => (
                            <li
                                key={transfer.id}
                                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-base-300 bg-base-100"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                        <ArrowLeftRight className="w-5 h-5" aria-hidden="true" />
                                    </span>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-medium truncate">
                                            {transfer.sourceAccountName} → {transfer.destAccountName}
                                        </span>
                                        <span className="text-xs text-base-content/50 truncate">
                                            {transfer.description || "Transfert"} · {new Date(transfer.createdAt).toLocaleDateString("fr-FR")}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-semibold text-sm">
                                        {transfer.amount.toLocaleString("fr-FR")} {transfer.currency || "Ar"}
                                    </span>
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(transfer)} aria-label="Modifier le transfert">
                                        Modifier
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(transfer.id)} aria-label="Supprimer le transfert">
                                        Supprimer
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

            </Wrapper>
        </div>
    )

}

export default Page
