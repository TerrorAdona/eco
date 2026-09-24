'use server'

import prisma from "@/lib/prisma"
import { normalizeTransactionCategory } from "@/type"

async function getUserOrThrow(email: string) {
    if (!email) throw new Error("Utilisateur non trouvé")
    const user = await prisma.user.findUnique({
        where: { email }
    })
    if (!user) throw new Error("Utilisateur non trouvé")
    return user
}

async function assertBudgetOwner(budgetId: string, email: string) {
    const user = await getUserOrThrow(email)
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: { transactions: true }
    })
    if (!budget) throw new Error("Budget non trouvé")
    if (budget.userId !== user.id) throw new Error("Accès non autorisé")
    return { user, budget }
}

async function assertTransactionOwner(transactionId: string, email: string) {
    const user = await getUserOrThrow(email)
    const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { budget: { include: { transactions: true } } }
    })
    if (!transaction) throw new Error("Transaction non trouvée")
    if (!transaction.budget || transaction.budget.userId !== user.id) throw new Error("Accès non autorisé")
    return { user, transaction, budget: transaction.budget }
}

export async function checkAndAddUser(email: string | undefined) {
    if (!email) return
    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })
        if (!existingUser) {
            await prisma.user.create({
                data: {
                    email: email
                }
            })
            console.log("Nouvel utilisateur ajouté dans la base de données")
        }
        else {
            console.log("L'utilisateur existe deja dans la base de données")
        }

    } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur : ", error)
    }
}

export async function addBudget(email: string, name: string, amount: number, selectedEmoji: string) {
    try {
        const existingUser = await getUserOrThrow(email)
        const trimmedName = name.trim()
        if (!trimmedName) throw new Error("Nom du budget requis")
        if (isNaN(amount) || amount <= 0) throw new Error("Montant invalide")
        await prisma.budget.create({
            data: {
                name: trimmedName,
                amount: amount,
                emoji: selectedEmoji,
                userId: existingUser.id
            }
        })
    } catch (error) {
        console.error("Erreur lors de l'ajout du budget : ", error)
        throw error
    }
}

export async function updateBudget(email: string, budgetId: string, name: string, amount: number, selectedEmoji: string) {
    try {
        const { budget } = await assertBudgetOwner(budgetId, email)
        const trimmedName = name.trim()
        if (!trimmedName) throw new Error("Nom du budget requis")
        if (isNaN(amount) || amount <= 0) throw new Error("Montant invalide")
        const totalSpent = budget.transactions.reduce((acc, t) => acc + t.amount, 0)
        if (amount < totalSpent) throw new Error("Le nouveau montant est inférieur aux dépenses déjà enregistrées")
        await prisma.budget.update({
            where: { id: budgetId },
            data: {
                name: trimmedName,
                amount: amount,
                emoji: selectedEmoji
            }
        })
    } catch (error) {
        console.error("Erreur lors de la modification du budget : ", error)
        throw error
    }
}

export async function getBudgetsByUser(email: string) {
    try {
        const existingUser = await getUserOrThrow(email)
        const budgets = await prisma.budget.findMany({
            where: {
                userId: existingUser.id
            },
            include: {
                transactions: true
            }
        })
        return budgets
    } catch (error) {
        console.error("Erreur lors de la récupération des budgets : ", error)
        throw error
    }
}

export async function getTransactionByBudgetId(budgetId: string, email: string) {
    try {
        const { budget } = await assertBudgetOwner(budgetId, email)
        return budget;
    } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
        throw error;
    }
}

export async function addTransactionToBudget(
    budgetId: string,
    amount: number,
    description: string,
    email: string,
    category?: string
) {
    try {
        const { budget } = await assertBudgetOwner(budgetId, email)
        const trimmedDescription = description.trim()
        if (!trimmedDescription) throw new Error("Description requise")
        if (isNaN(amount) || amount <= 0) throw new Error("Montant invalide")

        const totalTransactions = budget.transactions.reduce((acc, t) => {
            return acc + t.amount
        }, 0)

        const totalWithNewTransaction = totalTransactions + amount;
        if (totalWithNewTransaction > budget.amount) {
            throw new Error("Le budget est depassé")
        }


        await prisma.transaction.create({
            data: {
                amount: amount,
                description: trimmedDescription,
                category: normalizeTransactionCategory(category),
                emoji: budget.emoji,
                budget: {
                    connect: {
                        id: budgetId
                    }
                }
            }
        })
    } catch (error) {
        console.error("Erreur lors de l'ajout de la transaction : ", error)
        throw error
    }
}

export async function updateTransaction(
    transactionId: string,
    email: string,
    description: string,
    amount: number,
    category?: string
) {
    try {
        const { budget, transaction } = await assertTransactionOwner(transactionId, email)
        const trimmedDescription = description.trim()
        if (!trimmedDescription) throw new Error("Description requise")
        if (isNaN(amount) || amount <= 0) throw new Error("Montant invalide")

        const totalWithoutCurrent = budget.transactions.reduce((acc, t) => {
            return t.id === transactionId ? acc : acc + t.amount
        }, 0)
        if (totalWithoutCurrent + amount > budget.amount) {
            throw new Error("Le budget est depassé")
        }

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                description: trimmedDescription,
                amount: amount,
                category: normalizeTransactionCategory(category ?? transaction.category)
            }
        })
        void transaction
    } catch (error) {
        console.error("Erreur lors de la modification de la transaction : ", error)
        throw error
    }
}

export const deleteBudget = async (budgetId: string, email: string) => {
    try {
        await assertBudgetOwner(budgetId, email)
        await prisma.transaction.deleteMany({
            where: {
                budgetId: budgetId
            }
        })
        await prisma.budget.delete({
            where: {
                id: budgetId
            }
        })
    } catch (error) {
        console.error('Erreur lors de la suppression du budget : ', error)
        throw error
    }
}

export async function deleteTransaction(transactionId: string, email: string) {
    try {
        await assertTransactionOwner(transactionId, email)
        await prisma.transaction.delete({
            where: {
                id: transactionId
            }
        })
    } catch (error) {
        console.error('Erreur lors de la suppression de la transaction : ', error)
        throw error
    }
}

export async function getDashboardData(email: string) {
    try {
        if (!email) throw new Error("Utilisateur non trouvé")
        const budgets = await prisma.budget.findMany({
            where: {
                user: { email: email }
            },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" }
                }
            },
            orderBy: { createdAt: "desc" }
        })
        return budgets
    } catch (error) {
        console.error("Erreur lors de la récupération des données du tableau de bord : ", error)
        throw error
    }
}

export async function getTransactionsByEmailAndPeriod(email: string, period: string) {
    try {
        const now = new Date();
        let dateLimit
        switch (period) {
            case 'last30':
                dateLimit = new Date(now)
                dateLimit.setDate(now.getDate() - 30)
                break
            case 'last90':
                dateLimit = new Date(now)
                dateLimit.setDate(now.getDate() - 90)
                break
            case 'last7':
                dateLimit = new Date(now)
                dateLimit.setDate(now.getDate() - 7)
                break
            case 'last365':
                dateLimit = new Date(now)
                dateLimit.setDate(now.getDate() - 365)
                break
            default:
                throw new Error("Période invalide")
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email
            },
            include: {
                budgets: {
                    include: {
                        transactions: {
                            where: {
                                createdAt: {
                                    gte: dateLimit
                                }
                            },
                            orderBy: {
                                createdAt: "desc"
                            }
                        }
                    }
                }
            }
        })
        if (!user) {
            throw new Error("Utilisateur non trouvé")
        }

        const transactions = user.budgets.flatMap(budget =>
            budget.transactions.map(transaction => ({
                ...transaction,
                budgetName: budget.name,
                budgetId: budget.id
            }))
        )

        return transactions;
    } catch (error) {
        console.error("Erreur lors de la récupération des transactions : ", error)
        throw error
    }
}