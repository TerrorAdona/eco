
export interface Budget {
    id: string;
    createdAt: Date;
    name: string;
    amount: number;
    category: string;
    transactions?: Transaction[];
}

export const TRANSACTION_CATEGORIES = [
    "Alimentation",
    "Transport",
    "Logement",
    "Santé",
    "Études",
    "Loisirs",
    "Shopping",
    "Abonnements",
    "Salaire",
    "Autres",
] as const;

export type TransactionCategory = typeof TRANSACTION_CATEGORIES[number];

export const DEFAULT_TRANSACTION_CATEGORY: TransactionCategory = "Autres";

export function normalizeTransactionCategory(value: string | null | undefined): TransactionCategory {
    return (TRANSACTION_CATEGORIES as readonly string[]).includes(value ?? "")
        ? (value as TransactionCategory)
        : DEFAULT_TRANSACTION_CATEGORY;
}

export interface Transaction {
    id: string;
    amount: number;
    description: string
    type?: string;
    category: string;
    createdAt: Date;
    budgetName?: string;
    budgetId?: string | null;
    accountName?: string;
    accountId?: string | null;
    account?: { id: string; name: string } | null;
}

export const ACCOUNT_TYPES = [
    "COURANT",
    "EPARGNE",
    "ESPECES",
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    COURANT: "Compte courant",
    EPARGNE: "Épargne",
    ESPECES: "Espèces",
};

export const ACCOUNT_CURRENCIES = [
    "MGA",
    "EUR",
    "USD",
] as const;

export type AccountCurrency = typeof ACCOUNT_CURRENCIES[number];

export const ACCOUNT_CURRENCY_LABELS: Record<AccountCurrency, string> = {
    MGA: "Ariary",
    EUR: "Euro",
    USD: "Dollar",
};

export interface Account {
    id: string;
    name: string;
    type: string;
    currency: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Transfer {
    id: string;
    amount: number;
    description: string | null;
    sourceAccountId: string;
    destAccountId: string;
    sourceAccountName?: string;
    destAccountName?: string;
    currency?: string;
    createdAt: Date;
}

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: Date;
    createdAt: Date;
}

export const RECURRING_FREQUENCIES = [
    "WEEKLY",
    "MONTHLY",
    "YEARLY",
] as const;

export type RecurringFrequency = typeof RECURRING_FREQUENCIES[number];

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
    WEEKLY: "Hebdomadaire",
    MONTHLY: "Mensuelle",
    YEARLY: "Annuelle",
};

export function normalizeRecurringFrequency(value: string | null | undefined): RecurringFrequency {
    return (RECURRING_FREQUENCIES as readonly string[]).includes(value ?? "")
        ? (value as RecurringFrequency)
        : "MONTHLY";
}

export const RECURRING_TYPES = [
    "DEPENSE",
    "REVENU",
] as const;

export type RecurringType = typeof RECURRING_TYPES[number];

export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
    DEPENSE: "Dépense",
    REVENU: "Revenu",
};

export function normalizeRecurringType(value: string | null | undefined): RecurringType {
    return (RECURRING_TYPES as readonly string[]).includes(value ?? "")
        ? (value as RecurringType)
        : "DEPENSE";
}

export interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    type: string;
    category: string;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
    isActive: boolean;
    budgetId: string | null;
    budgetName?: string;
    createdAt: Date;
}