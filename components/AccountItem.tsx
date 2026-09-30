import { ACCOUNT_CURRENCY_LABELS, ACCOUNT_TYPE_LABELS, Account } from "@/type"
import { Banknote, PiggyBank, Wallet, type LucideIcon } from "lucide-react"
import React from "react"

const TYPE_ICONS: Record<string, LucideIcon> = {
    COURANT: Wallet,
    EPARGNE: PiggyBank,
    ESPECES: Banknote,
};

interface AccountItemProps {
    account: Account;
    enableHover?: number;
}

const AccountItem: React.FC<AccountItemProps> = ({ account, enableHover }) => {

    const Icon = TYPE_ICONS[account.type] ?? Wallet;
    const typeLabel = (ACCOUNT_TYPE_LABELS as Record<string, string>)[account.type] ?? account.type;
    const currencyLabel = (ACCOUNT_CURRENCY_LABELS as Record<string, string>)[account.currency] ?? account.currency;

    const hoverClasse = enableHover === 1 ? "transition-all duration-500 ease-out cursor-pointer hover:-translate-y-1 hover:scale-[1.02] hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]" : ""

    return (
        <li
            key={account.id}
            className={`card border-2 border-base-300 bg-base-100 list-none p-2 ${hoverClasse}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col min-w-0">
                        <h2 className="font-bold text-xl truncate">{account.name}</h2>
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-secondary badge-sm">{typeLabel}</span>
                        </span>
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-accent leading-tight">
                        {account.balance.toLocaleString("fr-FR")} {account.currency}
                    </div>
                    <div className="text-xs text-base-content/60">{currencyLabel}</div>
                </div>
            </div>
        </li>
    )
}


export default AccountItem
