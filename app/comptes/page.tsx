"use client"

import Wrapper from '@/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import React, { useCallback, useEffect, useState } from 'react'
import { addAccount, deleteAccount, getAccounts, updateAccount } from '../action'
import Notification from '@/components/Notification'
import { ACCOUNT_CURRENCIES, ACCOUNT_CURRENCY_LABELS, ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES, Account } from '@/type'
import AccountItem from '@/components/AccountItem'
import Link from 'next/link'
import { Wallet } from 'lucide-react'

const Page = () => {

    const { isLoaded, isSignedIn, user } = useUser()
    const [accountName, setAccountName] = useState<string>("")
    const [accountType, setAccountType] = useState<string>("COURANT")
    const [accountCurrency, setAccountCurrency] = useState<string>("MGA")
    const [accountBalance, setAccountBalance] = useState<string>("")
    const [accounts, setAccounts] = useState<Account[]>([])
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null)

    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const getUserEmail = () => user?.primaryEmailAddress?.emailAddress ?? ""

    const resetForm = () => {
        setAccountName("")
        setAccountType("COURANT")
        setAccountCurrency("MGA")
        setAccountBalance("")
        setEditingAccountId(null)
    }

    const closeModal = () => {
        const modal = document.getElementById("account_modal") as HTMLDialogElement | null
        modal?.close()
    }

    const openCreateModal = () => {
        resetForm()
        const modal = document.getElementById("account_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const openEditModal = (account: Account) => {
        setAccountName(account.name)
        setAccountType(account.type)
        setAccountCurrency(account.currency)
        setAccountBalance(String(account.balance))
        setEditingAccountId(account.id)
        const modal = document.getElementById("account_modal") as HTMLDialogElement | null
        modal?.showModal()
    }

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    const fetchAccounts = useCallback(async () => {
        const email = user?.primaryEmailAddress?.emailAddress ?? ""
        if (!email) return
        try {
            const data = await getAccounts(email)
            setAccounts(data.map((a) => ({ ...a, createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt) })))
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la récupération des comptes"))
        }
    }, [user?.primaryEmailAddress?.emailAddress])

    useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    const handleSubmitAccount = async () => {
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            if (!accountName.trim()) throw new Error("Nom du compte requis")
            const balance = accountBalance === "" ? 0 : parseFloat(accountBalance)
            if (isNaN(balance)) throw new Error("Solde invalide")

            if (editingAccountId) {
                await updateAccount(email, editingAccountId, accountName, accountType, accountCurrency, balance)
                setNotification("Compte modifié avec succès")
            } else {
                await addAccount(email, accountName, accountType, accountCurrency, balance)
                setNotification("Compte ajouté avec succès")
            }

            await fetchAccounts()
            closeModal()
            resetForm()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de l'enregistrement du compte"))
        }
    }

    const handleDeleteAccount = async (accountId: string) => {
        const confirmed = window.confirm("Voulez vous réellement supprimer ce compte ?")
        if (!confirmed) return
        try {
            const email = getUserEmail()
            if (!email) throw new Error("Utilisateur non trouvé")
            await deleteAccount(accountId, email)
            setNotification("Compte supprimé avec succès")
            await fetchAccounts()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la suppression du compte"))
        }
    }

    return (
        <div>
            <Wrapper>

                {notification && (
                    <Notification message={notification} onClose={closeNotification}/>
                )}

                {!isLoaded ? (
                    <div className="flex items-center justify-center h-64">
                        <span className="loading loading-bars loading-lg"></span>
                    </div>
                ) : !isSignedIn ? (
                    <div className="flex flex-col items-center justify-center text-center min-h-[300px] px-4 rounded-2xl border-2 border-dashed border-base-300 bg-base-100">
                        <h2 className="text-lg font-semibold">Connexion requise</h2>
                        <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                            Connectez-vous pour voir et gérer vos comptes.
                        </p>
                        <Link href="/sign-in" className="btn btn-primary mt-4">Se connecter</Link>
                    </div>
                ) : (
                <>
                <button className="btn btn-outline btn-primary" onClick={openCreateModal}>Nouveau compte <Wallet /></button>
                <dialog id="account_modal" className="modal">
                    <div className="modal-box">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={resetForm}>✕</button>
                        </form>
                        <h3 className="font-bold text-lg">{editingAccountId ? "Modification du compte" : "Création d'un compte"}</h3>
                        <p className="py-4">Suivez vos soldes par compte</p>
                        <div className='w-full flex flex-col'>

                            <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder='Nom du compte' className='w-full input input-bordered mb-3' required />

                            <div className='flex gap-2 mb-3'>
                                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className='flex-1 select select-bordered' aria-label='Type de compte'>
                                    {ACCOUNT_TYPES.map((t) => (
                                        <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
                                    ))}
                                </select>
                                <select value={accountCurrency} onChange={(e) => setAccountCurrency(e.target.value)} className='flex-1 select select-bordered' aria-label='Devise'>
                                    {ACCOUNT_CURRENCIES.map((c) => (
                                        <option key={c} value={c}>{c} — {ACCOUNT_CURRENCY_LABELS[c]}</option>
                                    ))}
                                </select>
                            </div>

                            <input type="number" value={accountBalance} onChange={(e) => setAccountBalance(e.target.value)} placeholder='Solde initial' className='w-full input input-bordered mb-3' />

                            <button
                            className='btn btn-primary mt-3'
                            onClick={handleSubmitAccount}
                            >{editingAccountId ? "Mettre à jour" : "Créer"}</button>

                        </div>
                    </div>
                </dialog>

                {accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center min-h-[300px] px-4 mt-5 rounded-2xl border-2 border-dashed border-base-300 bg-base-100">
                        <h2 className="text-lg font-semibold">Aucun compte</h2>
                        <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                            Créez votre premier compte pour suivre vos soldes ici.
                        </p>
                    </div>
                ) : (
                    <ul className='grid md:grid-cols-3 gap-5 mt-5'>
                        {accounts.map((account) => (
                            <li key={account.id} className="flex flex-col gap-2">
                                <AccountItem account={account} enableHover={0} />
                                <div className="flex gap-2">
                                    <button className="btn btn-sm btn-outline flex-1" onClick={() => openEditModal(account)}>Modifier</button>
                                    <button className="btn btn-sm btn-ghost flex-1" onClick={() => handleDeleteAccount(account.id)}>Supprimer</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                </>
                )}

            </Wrapper>
        </div>
    )

}

export default Page
