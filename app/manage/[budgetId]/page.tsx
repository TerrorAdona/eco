"use client"
import { addTransactionToBudget, getTransactionByBudgetId } from '@/app/action'
import BudgetItem from '@/components/BudgetItem'
import Wrapper from '@/components/Wrapper'
import { Budget } from '@/type'
import { describe } from 'node:test'
import { useEffect, useState } from 'react'
import Notification from '@/components/Notification'
import { Send } from 'lucide-react'

const page = ({ params }: { params: Promise<{ budgetId: string }> }) => {

    const [budgetId, setBudgetId] = useState<string>()
    const [budget, setBudget] = useState<Budget>()
    const [description, setDescription] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    async function fetchBudgetData(budgetId: string) {
        try {
            if (budgetId) {
                const budgetData = await getTransactionByBudgetId(budgetId)
                setBudget(budgetData)
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du budget:', error)
        }
    }

    useEffect(() => {
        const getId = async () => {
            const data = await params
            setBudgetId(data.budgetId)
            fetchBudgetData(data.budgetId)
        }

        getId()
    }, [])

    const handleAddTransaction = async () => {
        if (!amount || !description) {
            setNotification("Veuillez remplir tous les champs")
            return;
        }

        try {
            const amountNumber = parseFloat(amount)
            if (isNaN(amountNumber) || amountNumber <= 0) {
                setNotification("Veuillez entrer un montant valide")
                return
            }
            const newTransaction = await addTransactionToBudget(budgetId!, amountNumber, description)
            setNotification("Transaction ajoutée avec succès")
            fetchBudgetData(budgetId!)

            setAmount("")
            setDescription("")
        }
        catch (error) {
            console.error("Erreur lors de l'ajout de la transaction : ", error)
            setNotification("Budget dépassé")
        }
    }

    // const fetchData = async () => {
    //     const data = await params
    //     setBudgetId(data.budgetId)
    // }

    // fetchData()

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

                                <button className="btn mt-4 w-full">
                                    Supprimer le budget
                                </button>

                                {/* Formulaire */}
                                <div className="space-y-4 flex flex-col mt-4">

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

                                    <button
                                        onClick={handleAddTransaction}
                                        className="btn btn-primary w-full"
                                    >
                                        Ajouter une transaction
                                    </button>

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

                                                        {/* <div
                                                            className="
                                        flex items-center justify-center
                                        w-10 h-10
                                        rounded-xl
                                        bg-primary/10
                                        text-xl
                                        shrink-0
                                        transition-transform duration-300
                                        group-hover:scale-110
                                    "
                                                        >
                                                            {transaction.emoji}
                                                        </div> */}

                                                        <div className="flex flex-col min-w-0">

                                                            <span className="font-medium truncate">
                                                                {transaction.description}
                                                            </span>

                                                            <span className="text-xs text-base-content/50">
                                                                {new Date(
                                                                    transaction.createdAt
                                                                ).toLocaleDateString("fr-FR", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
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
                                            Aucune dépense n'a encore été enregistrée dans ce budget.
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

export default page