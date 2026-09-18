'use server'

import prisma from "@/lib/prisma"

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
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })
        if (!existingUser) {
            throw new Error("Utilisateur non trouvé")
        }
        await prisma.budget.create({
            data: {
                name: name,
                amount: amount,
                emoji: selectedEmoji,
                userId: existingUser.id
            }
        })
        console.log("Nouveau budget ajouté dans la base de données")
    } catch (error) {
        console.error("Erreur lors de l'ajout du budget : ", error)
        throw error
    }
}

export async function getBudgetsByUser(email: string) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            },
            include: {
                budgets: {
                    include: {
                        transactions: true
                    }
                }
            }
        })
        if (!existingUser) {
            throw new Error("Utilisateur non trouvé")
        }
        const budgets = await prisma.budget.findMany({
            where: {
                userId: existingUser.id
            }
        })
        return budgets
    } catch (error) {
        console.error("Erreur lors de la récupération des budgets : ", error)
        throw error
    }
}

// export async function getTransactionByBudgetId(budgetId: string) {
//     try {
//         const transactions = await prisma.transaction.findMany({
//             where: {
//                 budgetId: budgetId
//             }
//         })
//         return transactions
//     } catch (error) {
//         console.error("Erreur lors de la récupération des transactions : ", error)
//         throw error
//     }
// }

export async function getTransactionByBudgetId(budgetId: string) {
    try {
        const budget = await prisma.budget.findUnique({
            where: {
                id: budgetId
            },
            include: {
                transactions: true
            }
        })
        if (!budget) {
            throw new Error('Budget non trouvé.');
        }

        return budget;
    } catch (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
        throw error;
    }
}

export async function addTransactionToBudget(
    budgetId: string,
    amount: number,
    description: string
) {
    try {
        const budget = await prisma.budget.findUnique({
            where: {
                id: budgetId
            },
            include: {
                transactions: true
            }
        })
        if (!budget) {
            throw new Error("Budget non trouvé")
        }

        const totalTransactions = budget.transactions.reduce((acc, t) => {
            return acc + t.amount
        }, 0)

        const totalWithNewTransaction = totalTransactions + amount;
        if (totalWithNewTransaction > budget.amount) {
            throw new Error("Le budget est depassé")
        }


        const newTransaction = await prisma.transaction.create({
            data: {
                amount: amount,
                description: description,
                emoji: budget.emoji,
                budget: {
                    connect: {
                        id: budgetId
                    }
                }
            }
        })
        console.log("Nouvelle transaction ajoutée dans la base de données")
    } catch (error) {
        console.error("Erreur lors de l'ajout de la transaction : ", error)
        throw error
    }
}