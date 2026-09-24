"use client"
import { addTransactionToBudget, deleteBudget, deleteTransaction, getTransactionByBudgetId, updateBudget, updateTransaction } from '@/app/action'
import BudgetItem from '@/components/BudgetItem'
import Wrapper from '@/components/Wrapper'
import { Budget, DEFAULT_TRANSACTION_CATEGORY, normalizeTransactionCategory, TRANSACTION_CATEGORIES, Transaction } from '@/type'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import Notification from '@/components/Notification'
import { Pencil, Send, Trash } from 'lucide-react'
import { useRouter } from 'next/navigation'

const Page = ({ params }: { params: Promise<{ budgetId: string }> }) => {
    const { user } = useUser()
    const router = useRouter()
    const [budgetId, setBudgetId] = useState<string>()
    const [budget, setBudget] = useState<Budget>()
    const [description, setDescription] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [category, setCategory] = useState<string>(DEFAULT_TRANSACTION_CATEGORY)
    const [notification, setNotification] = useState<string>("")
    const [showEditBudget, setShowEditBudget] = useState<boolean>(false)
    const [editName, setEditName] = useState<string>('')
    const [editAmount, setEditAmount] = useState<string>('')
    const [editEmoji, setEditEmoji] = useState<string>('')
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
    const closeNotification = () => {
        setNotification("")
    }

    const getUserEmail = () => user?.primaryEmailAddress?.emailAddress ?? ""

    async function fetchBudgetData(id: string, email: string) {
        try {
            if (id && email) {
                const budgetData = await getTransactionByBudgetId(id, email)
                setBudget(budgetData)
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du budget:', error)
        }
    }

    const userEmail = user?.primaryEmailAddress?.emailAddress ?? ""

    useEffect(() => {
        const getId = async () => {
            const data = await params
            setBudgetId(data.budgetId)
            if (userEmail) fetchBudgetData(data.budgetId, userEmail)
        }

        getId()
    }, [userEmail, params])

    const resetTransactionForm = () => {
        setAmount("")
        setDescription("")
        setCategory(DEFAULT_TRANSACTION_CATEGORY)
        setEditingTransactionId(null)
    }

    const openEditTransaction = (transaction: Transaction) => {
        setDescription(transaction.description)
        setAmount(String(transaction.amount))
        setCategory(normalizeTransactionCategory(transaction.category))
        setEditingTransactionId(transaction.id)
    }

    const handleSubmitTransaction = async () => {
        if (!amount || !description.trim()) {
            setNotification("Veuillez remplir tous les champs")
            return;
        }

        try {
            const email = getUserEmail()
            if (!email) {
                setNotification("Utilisateur non trouvé")
                return
            }
            const amountNumber = parseFloat(amount)
            if (isNaN(amountNumber) || amountNumber <= 0) {
                setNotification("Veuillez entrer un montant valide")
                return
            }
            if (editingTransactionId) {
                await updateTransaction(editingTransactionId, email, description, amountNumber, category)
                setNotification("Transaction modifiée avec succès")
            } else {
                await addTransactionToBudget(budgetId!, amountNumber, description, email, category)
                setNotification("Transaction ajoutée avec succès")
            }
            fetchBudgetData(budgetId!, email)
            resetTransactionForm()
        }
        catch (error) {
            console.error("Erreur lors de l'enregistrement de la transaction : ", error)
            setNotification(error instanceof Error ? error.message : "Budget dépassé")
        }
    }

    const handleDeleteBudget = async () => {
        const confirmed = window.confirm(
            "Voulez vous réellement supprimer ce budget et toutes les transactions associées ?"
        )

        if (confirmed) {
            try {
                const email = getUserEmail()
                if (!email) {
                    setNotification("Utilisateur non trouvé")
                    return
                }
                await deleteBudget(budgetId!, email)
                setNotification("Budget supprimé avec succès")
                router.push("/budgets")
            }
            catch (error) {
                console.error("Erreur lors de la suppression du budget : ", error)
                setNotification("Erreur lors de la suppression du budget")
            }
        }
    }

    const handleDeleteTransaction = async (transactionId: string) => {
        const confirmed = window.confirm(
            "Voulez vous réellement supprimer cette transaction ?"
        )

        if (confirmed) {
            try {
                const email = getUserEmail()
                if (!email) {
                    setNotification("Utilisateur non trouvé")
                    return
                }
                await deleteTransaction(transactionId, email)
                setNotification("Transaction supprimée avec succès")
                fetchBudgetData(budgetId!, email)

            }
            catch (error) {
                console.error("Erreur lors de la suppression de la transaction : ", error)
                setNotification("Erreur lors de la suppression de la transaction")
            }
        }
    }

    const openEditBudget = () => {
        if (!budget) return
        setEditName(budget.name)
        setEditAmount(String(budget.amount))
        setEditEmoji(budget.emoji ?? "")
        setShowEditBudget(true)
    }

    const handleUpdateBudget = async () => {
        try {
            const email = getUserEmail()
            if (!email || !budgetId) {
                setNotification("Utilisateur non trouvé")
                return
            }
            const amountNumber = parseFloat(editAmount)
            if (!editName.trim()) {
                setNotification("Nom du budget requis")
                return
            }
            if (isNaN(amountNumber) || amountNumber <= 0) {
                setNotification("Veuillez entrer un montant valide")
                return
            }
            await updateBudget(email, budgetId, editName, amountNumber, editEmoji)
            setNotification("Budget modifié avec succès")
            setShowEditBudget(false)
            fetchBudgetData(budgetId, email)
        } catch (error) {
            console.error("Erreur lors de la modification du budget : ", error)
            setNotification(error instanceof Error ? error.message : "Erreur lors de la modification du budget")
        }
    }

    return (
        <Wrapper>

            {notification && (
                <Notification message={notification} onClose={closeNotification} />
            )}

            <div className="flex items-center justify-between">
                {
                    budget &&
                    (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">

                            {/* COLONNE GAUCHE : Budget + formulaire */}
                            <div className="md:col-span-1 w-full">

                                <BudgetItem
                                    budget={budget}
                                    enableHover={0}
                                />

                                <div className="flex gap-2 mt-4">
                                    <button
                                        className="btn btn-outline flex-1"
                                        onClick={openEditBudget}
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        className="btn flex-1"
                                        onClick={() => handleDeleteBudget()}
                                    >
                                        Supprimer
                                    </button>
                                </div>

                                {showEditBudget && (
                                    <div className="space-y-3 flex flex-col mt-4 p-4 border border-base-300 rounded-xl bg-base-100">
                                        <h3 className="font-bold">Modifier le budget</h3>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Nom du budget"
                                            className="input input-bordered w-full"
                                        />
                                        <input
                                            type="number"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            placeholder="Montant du budget"
                                            className="input input-bordered w-full"
                                        />
                                        <input
                                            type="text"
                                            value={editEmoji}
                                            onChange={(e) => setEditEmoji(e.target.value)}
                                            placeholder="Emoji (optionnel)"
                                            className="input input-bordered w-full"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleUpdateBudget} className="btn btn-primary flex-1">
                                                Enregistrer
                                            </button>
                                            <button onClick={() => setShowEditBudget(false)} className="btn btn-ghost flex-1">
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Formulaire réutilisé pour création et modification */}
                                <div className="space-y-4 flex flex-col mt-4">
                                    <h3 className="font-bold text-sm">{editingTransactionId ? "Modifier la transaction" : "Nouvelle transaction"}</h3>

                                    <input
                                        type="text"
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Description de la transaction"
                                        required
                                        className="input input-bordered w-full"
                                    />

                                    <input
                                        type="number"
                                        id="amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Montant de la transaction"
                                        required
                                        className="input input-bordered w-full"
                                    />

                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="select select-bordered w-full"
                                        aria-label="Catégorie de la transaction"
                                    >
                                        {TRANSACTION_CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>

                                    <button
                                        onClick={handleSubmitTransaction}
                                        className="btn btn-primary w-full"
                                    >
                                        {editingTransactionId ? "Mettre à jour la transaction" : "Ajouter une transaction"}
                                    </button>
                                    {editingTransactionId && (
                                        <button
                                            onClick={resetTransactionForm}
                                            className="btn btn-ghost w-full"
                                        >
                                            Annuler la modification
                                        </button>
                                    )}

                                </div>
                            </div>


                            {/* COLONNE DROITE : Transactions */}
                            <div className="md:col-span-2 w-full">

                                {budget?.transactions && budget.transactions.length > 0 ? (

                                    <div className="flex flex-col gap-4 w-full">

                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                                Transactions
                                            </h2>

                                            <span className="text-xs text-base-content/50">
                                                {budget.transactions.length} opération
                                                {budget.transactions.length > 1 ? "s" : ""}
                                            </span>
                                        </div>

                                        <ul className="flex flex-col gap-2 w-full">

                                            {budget.transactions.map((transaction) => (

                                                <li
                                                    key={transaction.id}
                                                    className="
                                group
                                flex items-center justify-between
                                gap-3
                                p-3
                                rounded-xl
                                border border-base-300
                                bg-base-100
                                transition-all duration-300
                                hover:-translate-y-[2px]
                                hover:border-primary/50
                                hover:bg-primary/5
                                hover:shadow-md
                            "
                                                >

                                                    {/* Informations */}
                                                    <div className="flex items-center gap-3 min-w-0">

                                                        <div className="flex flex-col min-w-0">

                                                            <span className="font-medium truncate">
                                                                {transaction.description}
                                                            </span>

                                                            <span className="badge badge-secondary badge-sm w-fit">
                                                                {normalizeTransactionCategory(transaction.category)}
                                                            </span>

                                                            <span className="badge badge-outline">
                                                                {new Date(
                                                                    transaction.createdAt
                                                                ).toLocaleString("fr-FR", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>

                                                        </div>

                                                    </div>


                                                    {/* Montant */}
                                                    <div
                                                        className="
                                    shrink-0
                                    px-3 py-1.5
                                    rounded-lg
                                    bg-primary/10
                                    text-primary
                                    font-semibold
                                    text-sm
                                    transition-all duration-300
                                    group-hover:bg-primary
                                    group-hover:text-primary-content
                                "
                                                    >
                                                        -{transaction.amount.toLocaleString("fr-FR")} Ar
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            aria-label="Modifier la transaction"
                                                            onClick={() => openEditTransaction(transaction)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            className="btn btn-ghost btn-sm"
                                                            aria-label="Supprimer la transaction"
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                </li>

                                            ))}

                                        </ul>

                                    </div>

                                ) : (

                                    /* Aucun transaction */
                                    <div
                                        className="
                    flex flex-col
                    items-center
                    justify-center
                    text-center
                    min-h-[300px]
                    px-4
                    rounded-2xl
                    border-2
                    border-dashed
                    border-base-300
                    bg-base-100
                "
                                    >

                                        <div
                                            className="
                        flex items-center justify-center
                        w-16 h-16
                        rounded-2xl
                        bg-accent/10
                        mb-4
                        transition-all duration-300
                        hover:scale-110
                        hover:bg-accent/20
                    "
                                        >
                                            <Send
                                                strokeWidth={1.5}
                                                className="w-8 h-8 text-accent"
                                            />
                                        </div>

                                        <h2 className="text-lg font-semibold">
                                            Aucune transaction
                                        </h2>

                                        <p className="text-sm text-base-content/50 mt-1 max-w-xs">
                                            Aucune dépense n&apos;a encore été enregistrée dans ce budget.
                                        </p>

                                    </div>

                                )}

                            </div>

                        </div>

                    )
                }
            </div>
        </Wrapper>
    )
}

export default Page