import { z } from "zod";
import { ACCOUNT_CURRENCIES, ACCOUNT_TYPES, normalizeRecurringFrequency, normalizeRecurringType, normalizeTransactionCategory } from "@/type";

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(result.error.issues[0]?.message ?? "Données invalides");
    }
    return result.data;
}

const requiredName = (label: string, max: number) =>
    z.string().trim().min(1, `${label} requis`).max(max, `${label} trop long (${max} caractères maximum)`);

const requiredDescription = (max: number) =>
    z.string().trim().min(1, "Description requise").max(max, `Description trop longue (${max} caractères maximum)`);

const positiveAmount = (message: string) =>
    z.custom<number>((v) => typeof v === "number" && !Number.isNaN(v) && v > 0, message);

const nonNegativeAmount = (message: string) =>
    z.custom<number>((v) => typeof v === "number" && !Number.isNaN(v) && v >= 0, message);

const lenientCategory = z.string().optional().transform((v) => normalizeTransactionCategory(v));

const requiredDate = (requiredMessage: string, invalidMessage: string) =>
    z.string().trim().min(1, requiredMessage).refine((s) => !Number.isNaN(new Date(s).getTime()), invalidMessage);

export const budgetInputSchema = z.object({
    name: requiredName("Nom du budget", 60),
    amount: positiveAmount("Montant invalide"),
    category: lenientCategory,
});

export const budgetUpdateSchema = budgetInputSchema.extend({
    budgetId: z.string().min(1, "Budget non trouvé"),
});

export const transactionInputSchema = z.object({
    description: requiredDescription(120),
    amount: positiveAmount("Montant invalide"),
    category: lenientCategory,
});

export const transactionUpdateSchema = transactionInputSchema.extend({
    transactionId: z.string().min(1, "Transaction non trouvée"),
});

export const savingsGoalBaseSchema = z.object({
    name: requiredName("Nom de l'objectif", 60),
    targetAmount: positiveAmount("Montant cible invalide"),
    savedAmount: nonNegativeAmount("Montant épargné invalide"),
    targetDate: requiredDate("Date cible requise", "Date cible invalide"),
});

export const savingsGoalInputSchema = savingsGoalBaseSchema.refine(
    (data) => data.savedAmount <= data.targetAmount,
    { message: "Le montant épargné dépasse la cible", path: ["savedAmount"] }
);

export const savingsGoalUpdateSchema = savingsGoalInputSchema.extend({
    goalId: z.string().min(1, "Objectif non trouvé"),
});

export const contributionSchema = z.object({
    goalId: z.string().min(1, "Objectif non trouvé"),
    amount: positiveAmount("Montant invalide"),
});

export const recurringBaseSchema = z.object({
    description: requiredDescription(120),
    amount: positiveAmount("Montant invalide"),
    type: z.string().optional().transform((v) => normalizeRecurringType(v)),
    category: lenientCategory,
    frequency: z.string().optional().transform((v) => normalizeRecurringFrequency(v)),
    startDate: requiredDate("Date de début requise", "Date de début invalide"),
    endDate: z.string().trim().optional().nullable().refine(
        (s) => !s || !Number.isNaN(new Date(s).getTime()),
        "Date de fin invalide"
    ),
});

export const recurringInputSchema = recurringBaseSchema.refine(
    (data) => {
        if (!data.endDate) return true;
        return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
    },
    { message: "La date de fin doit suivre la date de début", path: ["endDate"] }
);

export const recurringUpdateSchema = recurringInputSchema.extend({
    recurringId: z.string().min(1, "Transaction récurrente non trouvée"),
});

const finiteBalance = (message: string) =>
    z.custom<number>((v) => typeof v === "number" && Number.isFinite(v), message);

export const accountInputSchema = z.object({
    name: requiredName("Nom du compte", 60),
    type: z.string().refine(
        (v): v is (typeof ACCOUNT_TYPES)[number] => (ACCOUNT_TYPES as readonly string[]).includes(v),
        "Type de compte invalide"
    ),
    currency: z.string().refine(
        (v): v is (typeof ACCOUNT_CURRENCIES)[number] => (ACCOUNT_CURRENCIES as readonly string[]).includes(v),
        "Devise invalide"
    ),
    balance: finiteBalance("Solde invalide"),
});

export const accountUpdateSchema = accountInputSchema.extend({
    accountId: z.string().min(1, "Compte non trouvé"),
});
