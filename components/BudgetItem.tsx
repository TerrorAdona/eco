import { Budget } from "@prisma/client"
import React from "react"

interface BudgetItemProps {
    budget: Budget
}

const BudgetItem: React.FC<BudgetItemProps> = ({ budget }) => {
    return (
        <div>
            <BudgetProgress budget={budget} />
        </div>
    )
}

export default BudgetItem