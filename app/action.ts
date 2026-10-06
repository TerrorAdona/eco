'use server'

import prisma from "@/lib/prisma"
import { normalizeRecurringType, normalizeTransactionCategory, normalizeUserRole, USER_ROLES } from "@/type"
import { sumExpenses } from "@/lib/budget-alerts"
import { accountInputSchema, accountUpdateSchema, budgetInputSchema, budgetUpdateSchema, contributionSchema, parseOrThrow, recurringInputSchema, recurringUpdateSchema, savingsGoalInputSchema, savingsGoalUpdateSchema, topUpSchema, transactionInputSchema, transactionUpdateSchema, transferInputSchema, transferUpdateSchema } from "@/lib/validators"
import { ADMIN_PERIODS, AdminPeriod, bucketByMonth, bucketByTime } from "@/lib/admin-stats"
import { clerkClient } from "@clerk/nextjs/server"

async function getUserOrThrow(email: string) {
    if (!email) throw new Error("Utilisateur non trouvé")
    const user = await prisma.user.findUnique({
        where: { email }
    })
    if (!user) throw new Error("Utilisateur non trouvé")
    if (!user.isActive) throw new Error("Compte désactivé")
    return user
}

export async function assertAdmin(email: string) {
    const user = await getUserOrThrow(email);
    if (normalizeUserRole(user.role) !== "ADMIN") throw new Error("Accès non autorisé");
    return user;
}

export async function getMyRole(email: string): Promise<string> {
    try {
        const user = await getUserOrThrow(email);
        return normalizeUserRole(user.role);
    } catch (error) {
        console.error("Erreur lors de la récupération du rôle : ", error);
        throw error;
    }
}

export async function getAdminStats(email: string) {
    try {
        await assertAdmin(email);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentFilter = { createdAt: { gte: thirtyDaysAgo } };
        const [
            userCount, userRecent,
            accountCount, accountRecent,
            budgetCount, budgetRecent,
            transactionCount, transactionRecent,
            goalCount, recurringCount,
            userDates, transactionDates, accountDates,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: recentFilter }),
            prisma.account.count(),
            prisma.account.count({ where: recentFilter }),
            prisma.budget.count(),
            prisma.budget.count({ where: recentFilter }),
            prisma.transaction.count(),
            prisma.transaction.count({ where: recentFilter }),
            prisma.savingsGoal.count(),
            prisma.recurringTransaction.count(),
            prisma.user.findMany({ select: { createdAt: true } }),
            prisma.transaction.findMany({ select: { createdAt: true } }),
            prisma.account.findMany({ select: { createdAt: true } }),
        ]);
        return {
            users: { total: userCount, recent: userRecent },
            accounts: { total: accountCount, recent: accountRecent },
            budgets: { total: budgetCount, recent: budgetRecent },
            transactions: { total: transactionCount, recent: transactionRecent },
            goals: { total: goalCount },
            recurring: { total: recurringCount },
            monthlyUsers: bucketByMonth(userDates.map((u) => u.createdAt), 6),
            monthlyTransactions: bucketByMonth(transactionDates.map((t) => t.createdAt), 6),
            monthlyAccounts: bucketByMonth(accountDates.map((a) => a.createdAt), 6),
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques : ", error);
        throw error;
    }
}

async function assertNotLastAdmin(targetUserId: string) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target || normalizeUserRole(target.role) !== "ADMIN") return;
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) throw new Error("Impossible : dernier administrateur");
}

async function findClerkUserIdByEmail(email: string): Promise<string | null> {
    try {
        const client = await clerkClient();
        const list = await client.users.getUserList({ emailAddress: [email] });
        return list.data[0]?.id ?? null;
    } catch (error) {
        console.error("Erreur lors de la recherche Clerk : ", error);
        return null;
    }
}

export async function getAdminUsers(email: string, search?: string, page?: number) {
    try {
        await assertAdmin(email);
        const query = search?.trim() ?? "";
        const pageSize = 10;
        const pageNumber = page && Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
        const where = query ? { email: { contains: query } } : {};
        const [total, users] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                select: { id: true, email: true, role: true, isActive: true, createdAt: true },
                orderBy: { createdAt: "desc" },
                skip: (pageNumber - 1) * pageSize,
                take: pageSize,
            }),
        ]);
        return {
            users: users.map((u) => ({ ...u, role: normalizeUserRole(u.role) })),
            total,
            page: pageNumber,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs : ", error);
        throw error;
    }
}

export async function getAdminStatistics(email: string, period?: string) {
    try {
        await assertAdmin(email);
        const config = (period && period in ADMIN_PERIODS
            ? ADMIN_PERIODS[period as AdminPeriod]
            : ADMIN_PERIODS.last30);
        const since = new Date();
        since.setDate(since.getDate() - config.days);
        const inPeriod = { createdAt: { gte: since } };
        const [
            userTotal, userActive, userInactive, adminCount, userRoleCount,
            accountTotal, budgetTotal, goalTotal, recurringTotal,
            incomeCount, expenseCount, transferCount,
            accountTypes, accountCurrencies,
            userDates, transactionRows, transferDates, accountDates, budgetDates, goalRows,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.user.count({ where: { isActive: false } }),
            prisma.user.count({ where: { role: "ADMIN" } }),
            prisma.user.count({ where: { role: "USER" } }),
            prisma.account.count(),
            prisma.budget.count(),
            prisma.savingsGoal.count(),
            prisma.recurringTransaction.count(),
            prisma.transaction.count({ where: { type: "REVENU" } }),
            prisma.transaction.count({ where: { NOT: { type: "REVENU" } } }),
            prisma.transfer.count(),
            prisma.account.groupBy({ by: ["type"], _count: { _all: true } }),
            prisma.account.groupBy({ by: ["currency"], _count: { _all: true } }),
            prisma.user.findMany({ select: { createdAt: true }, where: inPeriod }),
            prisma.transaction.findMany({ select: { createdAt: true, type: true }, where: inPeriod }),
            prisma.transfer.findMany({ select: { createdAt: true }, where: inPeriod }),
            prisma.account.findMany({ select: { createdAt: true }, where: inPeriod }),
            prisma.budget.findMany({ select: { createdAt: true }, where: inPeriod }),
            prisma.savingsGoal.findMany({ select: { savedAmount: true, targetAmount: true, createdAt: true }, where: inPeriod }),
        ]);
        const txItems = transactionRows.map((t) => ({
            date: t.createdAt,
            kind: t.type === "REVENU" ? "income" : "expense",
        }));
        const transferItems = transferDates.map((t) => ({ date: t.createdAt, kind: "transfer" }));
        const withPercent = (rows: { label: string; count: number }[]) => {
            const total = rows.reduce((acc, r) => acc + r.count, 0);
            return rows
                .map((r) => ({
                    ...r,
                    percent: total > 0 ? Math.round((r.count / total) * 100) : 0,
                }))
                .sort((a, b) => b.count - a.count);
        };
        return {
            period,
            users: {
                total: userTotal,
                active: userActive,
                inactive: userInactive,
                admins: adminCount,
                standards: userRoleCount,
                evolution: bucketByTime(userDates.map((u) => ({ date: u.createdAt, kind: "all" })), config.days, config.bucketDays),
            },
            activity: {
                transactions: incomeCount + expenseCount,
                income: incomeCount,
                expenses: expenseCount,
                transfers: transferCount,
                accounts: accountTotal,
                budgets: budgetTotal,
                goals: goalTotal,
            },
            periodActivity: {
                transactions: transactionRows.length,
                income: txItems.filter((t) => t.kind === "income").length,
                expenses: txItems.filter((t) => t.kind === "expense").length,
                transfers: transferItems.length,
                accounts: accountDates.length,
                budgets: budgetDates.length,
                goals: goalRows.length,
            },
            transactionEvolution: bucketByTime([...txItems, ...transferItems], config.days, config.bucketDays),
            userEvolution: bucketByTime(userDates.map((u) => ({ date: u.createdAt, kind: "all" })), config.days, config.bucketDays),
            transactionSplit: [
                { label: "Dépenses", count: txItems.filter((t) => t.kind === "expense").length },
                { label: "Revenus", count: txItems.filter((t) => t.kind === "income").length },
                { label: "Transferts", count: transferItems.length },
            ],
            accounts: {
                total: accountTotal,
                byType: withPercent(accountTypes.map((r) => ({ label: r.type, count: r._count._all }))),
                byCurrency: withPercent(accountCurrencies.map((r) => ({ label: r.currency, count: r._count._all }))),
            },
            budgets: { total: budgetTotal, created: budgetDates.length },
            goals: {
                total: goalTotal,
                created: goalRows.length,
                reached: goalRows.filter((g) => g.savedAmount >= g.targetAmount && g.targetAmount > 0).length,
            },
            recurring: { total: recurringTotal },
        };
    } catch (error) {
        console.error("Erreur lors de la récupération des statistiques admin : ", error);
        throw error;
    }
}

export async function getAdminUserDetail(email: string, userId: string) {
    try {
        await assertAdmin(email);
        if (!userId) throw new Error("Utilisateur non trouvé");
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                _count: { select: { budgets: true, accounts: true } },
            },
        });
        if (!user) throw new Error("Utilisateur non trouvé");
        const transactionCount = await prisma.transaction.count({
            where: { budget: { userId: user.id } },
        });
        return {
            id: user.id,
            email: user.email,
            role: normalizeUserRole(user.role),
            isActive: user.isActive,
            createdAt: user.createdAt,
            budgetCount: user._count.budgets,
            accountCount: user._count.accounts,
            transactionCount,
        };
    } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur : ", error);
        throw error;
    }
}

export async function setUserRole(email: string, targetUserId: string, role: string) {
    try {
        await assertAdmin(email);
        if (!(USER_ROLES as readonly string[]).includes(role)) throw new Error("Rôle invalide");
        const target = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!target) throw new Error("Utilisateur non trouvé");
        if (normalizeUserRole(target.role) === "ADMIN" && role !== "ADMIN") {
            await assertNotLastAdmin(targetUserId);
        }
        await prisma.user.update({
            where: { id: targetUserId },
            data: { role },
        });
    } catch (error) {
        console.error("Erreur lors de la modification du rôle : ", error);
        throw error;
    }
}

export async function setUserActive(email: string, targetUserId: string, isActive: boolean) {
    try {
        const sessionUser = await assertAdmin(email);
        if (typeof isActive !== "boolean") throw new Error("Statut invalide");
        const target = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!target) throw new Error("Utilisateur non trouvé");
        if (target.id === sessionUser.id && !isActive) {
            throw new Error("Vous ne pouvez pas désactiver votre propre compte");
        }
        if (!isActive && normalizeUserRole(target.role) === "ADMIN") {
            await assertNotLastAdmin(targetUserId);
        }
        const clerkUserId = await findClerkUserIdByEmail(target.email);
        if (clerkUserId) {
            try {
                const client = await clerkClient();
                if (isActive) {
                    await client.users.unbanUser(clerkUserId);
                } else {
                    await client.users.banUser(clerkUserId);
                }
            } catch (error) {
                console.error("Erreur Clerk lors du changement de statut : ", error);
                throw new Error("Échec de la synchronisation Clerk");
            }
        }
        try {
            await prisma.user.update({
                where: { id: targetUserId },
                data: { isActive },
            });
        } catch (error) {
            if (clerkUserId) {
                try {
                    const client = await clerkClient();
                    if (isActive) {
                        await client.users.banUser(clerkUserId);
                    } else {
                        await client.users.unbanUser(clerkUserId);
                    }
                } catch (rollbackError) {
                    console.error("Échec du rollback Clerk : ", rollbackError);
                }
            }
            throw error;
        }
    } catch (error) {
        console.error("Erreur lors du changement de statut : ", error);
        throw error;
    }
}

async function assertBudgetOwner(budgetId: string, email: string) {
    const user = await getUserOrThrow(email)
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: { transactions: { include: { account: { select: { id: true, name: true, currency: true } } } } }
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
                    email: email,
                    role: "USER"
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

export async function addBudget(email: string, name: string, amount: number, category?: string) {
    try {
        const existingUser = await getUserOrThrow(email)
        const input = parseOrThrow(budgetInputSchema, { name, amount, category })
        await prisma.budget.create({
            data: {
                name: input.name,
                amount: input.amount,
                category: input.category,
                userId: existingUser.id
            }
        })
    } catch (error) {
        console.error("Erreur lors de l'ajout du budget : ", error)
        throw error
    }
}

export async function updateBudget(email: string, budgetId: string, name: string, amount: number, category?: string) {
    try {
        const { budget } = await assertBudgetOwner(budgetId, email)
        const input = parseOrThrow(budgetUpdateSchema, { budgetId, name, amount, category })
        const totalSpent = sumExpenses(budget.transactions)
        if (input.amount < totalSpent) throw new Error("Le nouveau montant est inférieur aux dépenses déjà enregistrées")
        const newCategory = category === undefined ? budget.category : input.category
        await prisma.$transaction(async (tx) => {
            await tx.budget.update({
                where: { id: budgetId },
                data: {
                    name: input.name,
                    amount: input.amount,
                    category: newCategory
                }
            })
            if (newCategory !== budget.category) {
                await tx.transaction.updateMany({
                    where: { budgetId: budgetId },
                    data: { category: newCategory }
                })
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

async function resolveTransactionAccount(email: string, accountId?: string | null) {
    if (!accountId || accountId === "none") return null
    const { account } = await assertAccountOwner(accountId, email)
    return account
}

function balanceEffect(type: string | null | undefined, amount: number): number {
    return normalizeRecurringType(type ?? undefined) === "REVENU" ? amount : -amount
}

export async function addTransactionToBudget(
    budgetId: string,
    amount: number,
    description: string,
    email: string,
    category?: string,
    accountId?: string | null,
    type?: string
) {
    try {
        const { budget } = await assertBudgetOwner(budgetId, email)
        const input = parseOrThrow(transactionInputSchema, { description, amount, type, category })
        const resolvedAccount = await resolveTransactionAccount(email, accountId)

        if (input.type === "DEPENSE") {
            const totalExpenses = sumExpenses(budget.transactions)

            const totalWithNewTransaction = totalExpenses + input.amount;
            if (totalWithNewTransaction > budget.amount) {
                throw new Error("Le budget est depassé")
            }
        }

        if (resolvedAccount && input.type === "DEPENSE" && input.amount > resolvedAccount.balance) {
            throw new Error("Solde insuffisant sur ce compte")
        }

        await prisma.$transaction(async (tx) => {
            await tx.transaction.create({
                data: {
                    amount: input.amount,
                    description: input.description,
                    type: input.type,
                    category: budget.category,
                    budget: {
                        connect: {
                            id: budgetId
                        }
                    },
                    ...(resolvedAccount ? { account: { connect: { id: resolvedAccount.id } } } : {})
                }
            })
            if (resolvedAccount) {
                await tx.account.update({
                    where: { id: resolvedAccount.id },
                    data: { balance: { increment: balanceEffect(input.type, input.amount) } }
                })
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
    category?: string,
    accountId?: string | null,
    type?: string
) {
    try {
        const { budget, transaction } = await assertTransactionOwner(transactionId, email)
        const input = parseOrThrow(transactionUpdateSchema, { transactionId, description, amount, type, category })
        const newType = type === undefined ? transaction.type : input.type
        const newAccount = accountId === undefined
            ? (transaction.accountId ? await prisma.account.findUnique({ where: { id: transaction.accountId } }) : null)
            : await resolveTransactionAccount(email, accountId)
        const newAccountId = newAccount?.id ?? null

        if (newType === "DEPENSE") {
            const totalWithoutCurrent = sumExpenses(budget.transactions.filter((t) => t.id !== transactionId))
            if (totalWithoutCurrent + input.amount > budget.amount) {
                throw new Error("Le budget est depassé")
            }
        }

        const oldEffect = balanceEffect(transaction.type, transaction.amount)
        const newEffect = balanceEffect(newType, input.amount)
        if (newType === "DEPENSE" && newAccount) {
            const available = newAccount.balance - (transaction.accountId === newAccount.id ? oldEffect : 0)
            if (input.amount > available) {
                throw new Error("Solde insuffisant sur ce compte")
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    description: input.description,
                    amount: input.amount,
                    type: newType,
                    category: budget.category,
                    accountId: newAccountId
                }
            })
            if (transaction.accountId && newAccountId && transaction.accountId === newAccountId) {
                const delta = newEffect - oldEffect
                if (delta !== 0) {
                    await tx.account.update({
                        where: { id: newAccountId },
                        data: { balance: { increment: delta } }
                    })
                }
            } else {
                if (transaction.accountId) {
                    await tx.account.update({
                        where: { id: transaction.accountId },
                        data: { balance: { increment: -oldEffect } }
                    })
                }
                if (newAccountId) {
                    await tx.account.update({
                        where: { id: newAccountId },
                        data: { balance: { increment: newEffect } }
                    })
                }
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
        const { transaction } = await assertTransactionOwner(transactionId, email)
        const reverseEffect = -balanceEffect(transaction.type, transaction.amount)
        await prisma.$transaction(async (tx) => {
            await tx.transaction.delete({
                where: {
                    id: transactionId
                }
            })
            if (transaction.accountId) {
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: { balance: { increment: reverseEffect } }
                })
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

export async function addSavingsGoal(email: string, name: string, targetAmount: number, savedAmount: number, targetDate: string) {
    try {
        const user = await getUserOrThrow(email)
        const input = parseOrThrow(savingsGoalInputSchema, { name, targetAmount, savedAmount, targetDate })
        await prisma.savingsGoal.create({
            data: {
                name: input.name,
                targetAmount: input.targetAmount,
                savedAmount: input.savedAmount,
                targetDate: new Date(input.targetDate),
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

export async function updateSavingsGoal(email: string, goalId: string, name: string, targetAmount: number, savedAmount: number, targetDate: string) {
    try {
        await assertSavingsGoalOwner(goalId, email)
        const input = parseOrThrow(savingsGoalUpdateSchema, { goalId, name, targetAmount, savedAmount, targetDate })
        await prisma.savingsGoal.update({
            where: { id: goalId },
            data: {
                name: input.name,
                targetAmount: input.targetAmount,
                savedAmount: input.savedAmount,
                targetDate: new Date(input.targetDate)
            }
        })
    } catch (error) {
        console.error("Erreur lors de la modification de l'objectif : ", error)
        throw error
    }
}

export async function contributeToGoal(email: string, goalId: string, amount: number) {
    try {
        const { goal } = await assertSavingsGoalOwner(goalId, email)
        const input = parseOrThrow(contributionSchema, { goalId, amount })
        const remaining = goal.targetAmount - goal.savedAmount
        if (input.amount > remaining) throw new Error(`Ce versement dépasse la cible (reste ${remaining.toLocaleString("fr-FR")} Ar)`)
        await prisma.savingsGoal.update({
            where: { id: goalId },
            data: { savedAmount: goal.savedAmount + input.amount }
        })
    } catch (error) {
        console.error("Erreur lors du versement sur l'objectif : ", error)
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

async function assertAccountOwner(accountId: string, email: string) {
    const user = await getUserOrThrow(email);
    const account = await prisma.account.findUnique({
        where: { id: accountId }
    });
    if (!account) throw new Error("Compte non trouvé");
    if (account.userId !== user.id) throw new Error("Accès non autorisé");
    return { user, account };
}

export async function getAccounts(email: string) {
    try {
        const user = await getUserOrThrow(email);
        return await prisma.account.findMany({
            where: { userId: user.id },
            orderBy: { name: "asc" }
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des comptes : ", error);
        throw error;
    }
}

export async function getAccountById(accountId: string, email: string) {
    try {
        const { account } = await assertAccountOwner(accountId, email);
        return account;
    } catch (error) {
        console.error("Erreur lors de la récupération du compte : ", error);
        throw error;
    }
}

export async function addAccount(email: string, name: string, type: string, currency: string, balance: number) {
    try {
        const user = await getUserOrThrow(email);
        const input = parseOrThrow(accountInputSchema, { name, type, currency, balance });
        await prisma.account.create({
            data: {
                name: input.name,
                type: input.type,
                currency: input.currency,
                balance: input.balance,
                userId: user.id
            }
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout du compte : ", error);
        throw error;
    }
}

export async function updateAccount(email: string, accountId: string, name: string, type: string, currency: string, balance: number) {
    try {
        await assertAccountOwner(accountId, email);
        const input = parseOrThrow(accountUpdateSchema, { accountId, name, type, currency, balance });
        await prisma.account.update({
            where: { id: accountId },
            data: {
                name: input.name,
                type: input.type,
                currency: input.currency,
                balance: input.balance
            }
        });
    } catch (error) {
        console.error("Erreur lors de la modification du compte : ", error);
        throw error;
    }
}

export async function topUpAccount(email: string, accountId: string, amount: number) {
    try {
        await assertAccountOwner(accountId, email);
        const input = parseOrThrow(topUpSchema, { accountId, amount });
        await prisma.account.update({
            where: { id: accountId },
            data: { balance: { increment: input.amount } }
        });
    } catch (error) {
        console.error("Erreur lors du rechargement du compte : ", error);
        throw error;
    }
}

export async function deleteAccount(accountId: string, email: string) {
    try {
        await assertAccountOwner(accountId, email);
        const [linkedTransactions, linkedSource, linkedDest] = await Promise.all([
            prisma.transaction.count({ where: { accountId: accountId } }),
            prisma.transfer.count({ where: { sourceAccountId: accountId } }),
            prisma.transfer.count({ where: { destAccountId: accountId } }),
        ]);
        if (linkedTransactions + linkedSource + linkedDest > 0) {
            throw new Error("Ce compte est lié à des transactions ou transferts et ne peut pas être supprimé");
        }
        await prisma.account.delete({
            where: { id: accountId }
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du compte : ", error);
        throw error;
    }
}

async function assertTransferOwner(transferId: string, email: string) {
    const user = await getUserOrThrow(email);
    const transfer = await prisma.transfer.findUnique({
        where: { id: transferId },
        include: {
            sourceAccount: true,
            destAccount: true
        }
    });
    if (!transfer) throw new Error("Transfert non trouvé");
    if (transfer.userId !== user.id) throw new Error("Accès non autorisé");
    return { user, transfer };
}

async function resolveTransferAccounts(userId: string, sourceAccountId: string, destAccountId: string) {
    const [source, dest] = await Promise.all([
        prisma.account.findUnique({ where: { id: sourceAccountId } }),
        prisma.account.findUnique({ where: { id: destAccountId } }),
    ]);
    if (!source || !dest) throw new Error("Compte non trouvé");
    if (source.userId !== userId || dest.userId !== userId) throw new Error("Accès non autorisé");
    if (source.currency !== dest.currency) {
        throw new Error("Transfert multi-devises non supporté pour l'instant");
    }
    return { source, dest };
}

export async function addTransfer(email: string, sourceAccountId: string, destAccountId: string, amount: number, description?: string | null) {
    try {
        const user = await getUserOrThrow(email);
        const input = parseOrThrow(transferInputSchema, { sourceAccountId, destAccountId, amount, description });
        await resolveTransferAccounts(user.id, input.sourceAccountId, input.destAccountId);
        await prisma.$transaction(async (tx) => {
            await tx.transfer.create({
                data: {
                    amount: input.amount,
                    description: description?.trim() || null,
                    sourceAccountId: input.sourceAccountId,
                    destAccountId: input.destAccountId,
                    userId: user.id
                }
            });
            await tx.account.update({
                where: { id: input.sourceAccountId },
                data: { balance: { decrement: input.amount } }
            });
            await tx.account.update({
                where: { id: input.destAccountId },
                data: { balance: { increment: input.amount } }
            });
        });
    } catch (error) {
        console.error("Erreur lors du transfert : ", error);
        throw error;
    }
}

export async function getTransfersByUser(email: string) {
    try {
        const user = await getUserOrThrow(email);
        const transfers = await prisma.transfer.findMany({
            where: { userId: user.id },
            include: {
                sourceAccount: { select: { id: true, name: true, currency: true } },
                destAccount: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        return transfers.map((t) => ({
            ...t,
            sourceAccountName: t.sourceAccount?.name ?? "",
            destAccountName: t.destAccount?.name ?? "",
            currency: t.sourceAccount?.currency ?? ""
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des transferts : ", error);
        throw error;
    }
}

export async function updateTransfer(email: string, transferId: string, sourceAccountId: string, destAccountId: string, amount: number, description?: string | null) {
    try {
        const { user, transfer } = await assertTransferOwner(transferId, email);
        const input = parseOrThrow(transferUpdateSchema, { transferId, sourceAccountId, destAccountId, amount, description });
        await resolveTransferAccounts(user.id, input.sourceAccountId, input.destAccountId);
        await prisma.$transaction(async (tx) => {
            await tx.account.update({
                where: { id: transfer.sourceAccountId },
                data: { balance: { increment: transfer.amount } }
            });
            await tx.account.update({
                where: { id: transfer.destAccountId },
                data: { balance: { decrement: transfer.amount } }
            });
            await tx.transfer.update({
                where: { id: transferId },
                data: {
                    amount: input.amount,
                    description: description?.trim() || null,
                    sourceAccountId: input.sourceAccountId,
                    destAccountId: input.destAccountId
                }
            });
            await tx.account.update({
                where: { id: input.sourceAccountId },
                data: { balance: { decrement: input.amount } }
            });
            await tx.account.update({
                where: { id: input.destAccountId },
                data: { balance: { increment: input.amount } }
            });
        });
    } catch (error) {
        console.error("Erreur lors de la modification du transfert : ", error);
        throw error;
    }
}

export async function deleteTransfer(transferId: string, email: string) {
    try {
        const { transfer } = await assertTransferOwner(transferId, email);
        await prisma.$transaction(async (tx) => {
            await tx.transfer.delete({
                where: { id: transferId }
            });
            await tx.account.update({
                where: { id: transfer.sourceAccountId },
                data: { balance: { increment: transfer.amount } }
            });
            await tx.account.update({
                where: { id: transfer.destAccountId },
                data: { balance: { decrement: transfer.amount } }
            });
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du transfert : ", error);
        throw error;
    }
}

export async function getDashboardData(email: string) {
    try {
        const user = await getUserOrThrow(email)
        const budgets = await prisma.budget.findMany({
            where: {
                userId: user.id
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
                budget: { select: { id: true, name: true } },
                account: { select: { id: true, name: true, currency: true } }
            },
            orderBy: { createdAt: "desc" }
        })

        return transactions.map(transaction => ({
            ...transaction,
            budgetName: transaction.budget?.name ?? "",
            budgetId: transaction.budget?.id ?? transaction.budgetId,
            accountName: transaction.account?.name ?? "",
            accountId: transaction.account?.id ?? transaction.accountId,
            accountCurrency: transaction.account?.currency ?? undefined
        }));
    } catch (error) {
        console.error("Erreur lors de la récupération des transactions : ", error)
        throw error
    }
}
