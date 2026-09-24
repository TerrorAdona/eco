import { Budget, normalizeTransactionCategory } from "@/type"
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-4xl">
                        {budget.emoji}
                    </div>
                    <div className="flex flex-col ml-3">
                        <h2 className="font-bold text-xl">{budget.name}</h2>
                        <span className="flex items-center gap-2">
                            <span className="badge badge-secondary badge-sm">{normalizeTransactionCategory(budget.category)}</span>
                            <span className="text-sm text-gray-500 text-sm">
                                {transactionCount} transaction(s)
                            </span>
                        </span>
                    </div>
                </div>
                <div className="text-xl font-bold text-accent">
                    {budget.amount} Ar
                </div>
            </div>

            <div className="mt-5 flex justify-between">
                <span className="text-sm text-gray-500 text-sm"> <span className="text-secondary font-bold">{totalTransactionAmount}</span> Ar dépenser</span>
                <span className="text-sm text-gray-500 text-sm"><span className="text-red-500 font-bold">{remainingAmount}</span> Ar restant</span>
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
            <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{percentageUsed}% utilisé</span>
                <span>{100 - percentageUsed}% restant</span>
            </div>


        </li>
    )
}


export default BudgetItem