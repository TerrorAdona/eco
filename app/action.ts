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
            include : {
                budgets : {
                    include : {
                        transactions : true
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