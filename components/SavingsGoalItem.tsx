import { SavingsGoal } from "@/type"
import { Target } from "lucide-react"
import React from "react"

interface SavingsGoalItemProps {
    goal: SavingsGoal;
    enableHover?: number;
}

const SavingsGoalItem: React.FC<SavingsGoalItemProps> = ({ goal, enableHover }) => {

    const targetDate = new Date(goal.targetDate)
    const percentage = goal.targetAmount > 0
        ? Math.round((goal.savedAmount / goal.targetAmount) * 100)
        : 0;
    const cappedPercentage = Math.min(percentage, 100)

    const remainingAmount = Math.max(0, goal.targetAmount - goal.savedAmount);
    const isReached = goal.savedAmount >= goal.targetAmount;

    const hoverClasse = enableHover === 1 ? "transition-all duration-500 ease-out cursor-pointer hover:-translate-y-1 hover:scale-[1.02] hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_20px_rgba(59,130,246,0.35)]" : ""

    return (
        <li
            key={goal.id}
            className={`card border-2 border-base-300 bg-base-100 list-none p-2 ${hoverClasse}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                        <Target className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <div className="flex flex-col min-w-0">
                        <h2 className="font-bold text-xl truncate">{goal.name}</h2>
                        <span className="flex flex-wrap items-center gap-2">
                            <span className="badge badge-outline badge-sm">
                                {targetDate.toLocaleDateString("fr-FR")}
                            </span>
                            {isReached && (
                                <span className="badge badge-success badge-sm">
                                    Atteint
                                </span>
                            )}
                        </span>
                    </div>
                </div>
                <div className="shrink-0 text-right text-lg font-bold text-accent leading-tight">
                    {goal.targetAmount.toLocaleString("fr-FR")} Ar
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="min-w-0">
                    <p className="text-secondary font-bold truncate">{goal.savedAmount.toLocaleString("fr-FR")} Ar</p>
                    <p className="text-xs text-base-content/60">épargnés</p>
                </div>
                <div className="min-w-0 text-right">
                    <p className="text-error font-bold truncate">{remainingAmount.toLocaleString("fr-FR")} Ar</p>
                    <p className="text-xs text-base-content/60">restants</p>
                </div>
            </div>

            <div className="w-full bg-base-300 rounded-full h-2.5 mt-3">
                <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${cappedPercentage}%` }}
                    aria-valuenow={cappedPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-base-content/60">
                <span>{cappedPercentage}% épargné</span>
                <span>{100 - cappedPercentage}% restant</span>
            </div>


        </li>
    )
}


export default SavingsGoalItem
