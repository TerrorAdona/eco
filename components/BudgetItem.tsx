import { Budget, normalizeTransactionCategory } from "@/type"
import CategoryIcon from "./CategoryIcon"
import React from "react"

interface BudgetItemProps {
    budget: Budget;
    enableHover?: number;
}

const BudgetItem: React.FC<BudgetItemProps> = ({ budget, enableHover }) => {

    const transactionCount = budget.transactions ? budget.transactions.length : 0;
    const totalTransactionAmount = budget.transactions
        ?
        budget.transactions.reduce((total, tx) => total + tx.amount, 0)
        :
        0;

    const percentageUsed = Math.round((totalTransactionAmount / budget.amount) * 100);

    const remainingAmount = Math.max(0, budget.amount - totalTransactionAmount);

    const hoverClasse = enableHover === 1 ? "transition-all duration-500 ease-out cursor-pointer hover:-translate-y-1 hover:scale-[1.02] hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]" : ""

    return (
        <li
            key={budget.id}
            className={`card border-2 border-base-300 bg-base-100 list-none p-2 ${hoverClasse}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <CategoryIcon category={budget.category} />
                    </span>
                    <div className="flex flex-col min-w-0">
                        <h2 className="font-bold text-xl truncate">{budget.name}</h2>
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-secondary badge-sm">{normalizeTransactionCategory(budget.category)}</span>
                            <span className="text-sm text-base-content/60">
                                {transactionCount} transaction(s)
                            </span>
                        </span>
                    </div>
                </div>
                <div className="shrink-0 text-right text-lg font-bold text-accent leading-tight">
                    {budget.amount.toLocaleString("fr-FR")} Ar
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="min-w-0">
                    <p className="text-secondary font-bold truncate">{totalTransactionAmount.toLocaleString("fr-FR")} Ar</p>
                    <p className="text-xs text-base-content/60">dépensé</p>
                </div>
                <div className="min-w-0 text-right">
                    <p className="text-error font-bold truncate">{remainingAmount.toLocaleString("fr-FR")} Ar</p>
                    <p className="text-xs text-base-content/60">restant</p>
                </div>
            </div>

            <div className="w-full bg-base-300 rounded-full h-2.5 mt-3">
                <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    aria-valuenow={percentageUsed}
                    aria-valuemin={0}
                    aria-valuemax={100}
                ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-base-content/60">
                <span>{percentageUsed}% utilisé</span>
                <span>{100 - percentageUsed}% restant</span>
            </div>


        </li>
    )
}


export default BudgetItem