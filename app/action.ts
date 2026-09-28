'use server'

import prisma from "@/lib/prisma"
import { normalizeTransactionCategory } from "@/type"
import { budgetInputSchema, budgetUpdateSchema, parseOrThrow, recurringInputSchema, recurringUpdateSchema, savingsGoalInputSchema, savingsGoalUpdateSchema, transactionInputSchema, transactionUpdateSchema } from "@/lib/validators"

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

export async function addBudget(email: string, name: string, amount: number, selectedEmoji: string, category?: string) {
    try {
        const existingUser = await getUserOrThrow(email)
        const input = parseOrThrow(budgetInputSchema, { name, amount, emoji: selectedEmoji, category })
        await prisma.budget.create({
            data: {
                name: input.name,
                amount: input.amount,
                category: input.category,
                emoji: input.emoji,
                userId: existingUser.id
            }
        })
    } catch (error) {
        console.error("Erreur lors de l'ajout du budget : ", error)
        throw error
    }
}

export async function updateBudget(email: string, budgetId: string, name: string, amount: number, selectedEmoji: string, category?: string) {
    try {
        const { budget } = await assertBudgetOwner(budgetId, email)
        const input = parseOrThrow(budgetUpdateSchema, { budgetId, name, amount, emoji: selectedEmoji, category })
        const totalSpent = budget.transactions.reduce((acc, t) => acc + t.amount, 0)
        if (input.amount < totalSpent) throw new Error("Le nouveau montant est inférieur aux dépenses déjà enregistrées")
        await prisma.budget.update({
            where: { id: budgetId },
            data: {
                name: input.name,
                amount: input.amount,
                category: category === undefined ? budget.category : input.category,
                emoji: input.emoji
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
        const input = parseOrThrow(transactionInputSchema, { description, amount, category })

        const totalTransactions = budget.transactions.reduce((acc, t) => {
            return acc + t.amount
        }, 0)

        const totalWithNewTransaction = totalTransactions + input.amount;
        if (totalWithNewTransaction > budget.amount) {
            throw new Error("Le budget est depassé")
        }


        await prisma.transaction.create({
            data: {
                amount: input.amount,
                description: input.description,
                category: input.category,
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
        const input = parseOrThrow(transactionUpdateSchema, { transactionId, description, amount, category })

        const totalWithoutCurrent = budget.transactions.reduce((acc, t) => {
            return t.id === transactionId ? acc : acc + t.amount
        }, 0)
        if (totalWithoutCurrent + input.amount > budget.amount) {
            throw new Error("Le budget est depassé")
        }

        await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                description: input.description,
                amount: input.amount,
                category: category === undefined ? transaction.category : input.category
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

async function assertSavingsGoalOwner(goalId: string, email: string) {
    const user = await getUserOrThrow(email)
    const goal = await prisma.savingsGoal.findUnique({
        where: { id: goalId }
    })
    if (!goal) throw new Error("Objectif non trouvé")
    if (goal.userId !== user.id) throw new Error("Accès non autorisé")
    return { user, goal }
}

export async function addSavingsGoal(email: string, name: string, targetAmount: number, savedAmount: number, targetDate: string, selectedEmoji: string) {
    try {
        const user = await getUserOrThrow(email)
        const input = parseOrThrow(savingsGoalInputSchema, { name, targetAmount, savedAmount, targetDate, emoji: selectedEmoji })
        await prisma.savingsGoal.create({
            data: {
                name: input.name,
                targetAmount: input.targetAmount,
                savedAmount: input.savedAmount,
                targetDate: new Date(input.targetDate),
                emoji: input.emoji,
                userId: user.id
            }
        })
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'objectif : ", error)
        throw error
    }
}

export async function getSavingsGoalsByUser(email: string) {
    try {
        const user = await getUserOrThrow(email)
        return await prisma.savingsGoal.findMany({
            where: { userId: user.id },
            orderBy: { targetDate: "asc" }
        })
    } catch (error) {
        console.error("Erreur lors de la récupération des objectifs : ", error)
        throw error
    }
}

export async function updateSavingsGoal(email: string, goalId: string, name: string, targetAmount: number, savedAmount: number, targetDate: string, selectedEmoji: string) {
    try {
        await assertSavingsGoalOwner(goalId, email)
        const input = parseOrThrow(savingsGoalUpdateSchema, { goalId, name, targetAmount, savedAmount, targetDate, emoji: selectedEmoji })
        await prisma.savingsGoal.update({
            where: { id: goalId },
            data: {
                name: input.name,
                targetAmount: input.targetAmount,
                savedAmount: input.savedAmount,
                targetDate: new Date(input.targetDate),
                emoji: input.emoji
            }
        })
    } catch (error) {
        console.error("Erreur lors de la modification de l'objectif : ", error)
        throw error
    }
}

export async function deleteSavingsGoal(goalId: string, email: string) {
    try {
        await assertSavingsGoalOwner(goalId, email)
        await prisma.savingsGoal.delete({
            where: { id: goalId }
        })
    } catch (error) {
        console.error("Erreur lors de la suppression de l'objectif : ", error)
        throw error
    }
}

async function assertRecurringOwner(recurringId: string, email: string) {
    const user = await getUserOrThrow(email)
    const recurring = await prisma.recurringTransaction.findUnique({
        where: { id: recurringId }
    })
    if (!recurring) throw new Error("Transaction récurrente non trouvée")
    if (recurring.userId !== user.id) throw new Error("Accès non autorisé")
    return { user, recurring }
}

async function resolveRecurringBudget(email: string, budgetId?: string | null) {
    if (!budgetId || budgetId === "none") return null
    const { budget } = await assertBudgetOwner(budgetId, email)
    return budget.id
}

export async function addRecurringTransaction(email: string, description: string, amount: number, type: string, category: string, frequency: string, startDate: string, endDate: string | null, budgetId: string | null) {
    try {
        const user = await getUserOrThrow(email)
        const input = parseOrThrow(recurringInputSchema, { description, amount, type, category, frequency, startDate, endDate })
        const resolvedBudgetId = await resolveRecurringBudget(email, budgetId)
        await prisma.recurringTransaction.create({
            data: {
                description: input.description,
                amount: input.amount,
                type: input.type,
                category: input.category,
                frequency: input.frequency,
                startDate: new Date(input.startDate),
                endDate: input.endDate ? new Date(input.endDate) : null,
                budgetId: resolvedBudgetId,
                userId: user.id
            }
        })
    } catch (error) {
        console.error("Erreur lors de l'ajout de la transaction récurrente : ", error)
        throw error
    }
}

export async function getRecurringTransactionsByUser(email: string) {
    try {
        const user = await getUserOrThrow(email)
        const items = await prisma.recurringTransaction.findMany({
            where: { userId: user.id },
            include: { budget: { select: { id: true, name: true } } },
            orderBy: { startDate: "asc" }
        })
        return items.map((item) => ({
            ...item,
            budgetName: item.budget?.name ?? ""
        }))
    } catch (error) {
        console.error("Erreur lors de la récupération des transactions récurrentes : ", error)
        throw error
    }
}

export async function updateRecurringTransaction(email: string, recurringId: string, description: string, amount: number, type: string, category: string, frequency: string, startDate: string, endDate: string | null, budgetId: string | null) {
    try {
        await assertRecurringOwner(recurringId, email)
        const input = parseOrThrow(recurringUpdateSchema, { recurringId, description, amount, type, category, frequency, startDate, endDate })
        const resolvedBudgetId = await resolveRecurringBudget(email, budgetId)
        await prisma.recurringTransaction.update({
            where: { id: recurringId },
            data: {
                description: input.description,
                amount: input.amount,
                type: input.type,
                category: input.category,
                frequency: input.frequency,
                startDate: new Date(input.startDate),
                endDate: input.endDate ? new Date(input.endDate) : null,
                budgetId: resolvedBudgetId
            }
        })
    } catch (error) {
        console.error("Erreur lors de la modification de la transaction récurrente : ", error)
        throw error
    }
}

export async function toggleRecurringTransaction(email: string, recurringId: string) {
    try {
        const { recurring } = await assertRecurringOwner(recurringId, email)
        await prisma.recurringTransaction.update({
            where: { id: recurringId },
            data: { isActive: !recurring.isActive }
        })
    } catch (error) {
        console.error("Erreur lors du changement d'état de la transaction récurrente : ", error)
        throw error
    }
}

export async function deleteRecurringTransaction(recurringId: string, email: string) {
    try {
        await assertRecurringOwner(recurringId, email)
        await prisma.recurringTransaction.delete({
            where: { id: recurringId }
        })
    } catch (error) {
        console.error("Erreur lors de la suppression de la transaction récurrente : ", error)
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

export interface TransactionFilters {
    search?: string;
    category?: string;
    budgetId?: string;
    minAmount?: number;
    maxAmount?: number;
}

export async function getBudgetOptions(email: string) {
    try {
        const user = await getUserOrThrow(email)
        return await prisma.budget.findMany({
            where: { userId: user.id },
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        })
    } catch (error) {
        console.error("Erreur lors de la récupération des budgets : ", error)
        throw error
    }
}

export async function getTransactionsByEmailAndPeriod(email: string, period: string, filters?: TransactionFilters) {
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

        await getUserOrThrow(email)
        const search = filters?.search?.trim()
        const rawCategory = filters?.category && filters.category !== "all" ? filters.category : undefined
        const category = rawCategory ? normalizeTransactionCategory(rawCategory) : undefined
        const applyCategory = rawCategory !== undefined && category === rawCategory
        const budgetId = filters?.budgetId && filters.budgetId !== "all" ? filters.budgetId : undefined
        const minAmount = filters?.minAmount !== undefined && !isNaN(filters.minAmount) ? filters.minAmount : undefined
        const maxAmount = filters?.maxAmount !== undefined && !isNaN(filters.maxAmount) ? filters.maxAmount : undefined

        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: { gte: dateLimit },
                budget: { user: { email: email } },
                ...(search ? { description: { contains: search } } : {}),
                ...(applyCategory ? { category: category } : {}),
                ...(budgetId ? { budgetId: budgetId } : {}),
                ...((minAmount !== undefined || maxAmount !== undefined) ? { amount: { ...(minAmount !== undefined ? { gte: minAmount } : {}), ...(maxAmount !== undefined ? { lte: maxAmount } : {}) } } : {}),
            },
            include: {
                budget: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        })

        return transactions.map(transaction => ({
            ...transaction,
            budgetName: transaction.budget?.name ?? "",
            budgetId: transaction.budget?.id ?? transaction.budgetId
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des transactions : ", error)
        throw error
    }
}
