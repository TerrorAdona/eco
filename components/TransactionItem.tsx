import { normalizeRecurringType, normalizeTransactionCategory, Transaction } from '@/type';
import Link from 'next/link';
import React from 'react'

interface TransactionItemProps {
    transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
    const createdAt = new Date(transaction.createdAt)

    return (
        <li key={transaction.id} className='flex justify-between items-center'>
            <div className='my-4'>
                <button className='btn'>
                    <div className="badge badge-accent">{normalizeRecurringType(transaction.type) === "REVENU" ? "+" : "-"} {transaction.amount} Ar</div>
                    {transaction.budgetName}
                </button>
            </div>
            <div className='md:hidden flex flex-col items-end'>
                <span className='font-bold text-sm'>{transaction.description}</span>
                <span className="badge badge-secondary badge-sm">{normalizeTransactionCategory(transaction.category)}</span>
                {transaction.accountName && (
                    <span className="badge badge-accent badge-sm">{transaction.accountName}</span>
                )}
                <span className='text-sm'>
                    {createdAt.toLocaleDateString("fr-FR")} à {" "}
                    {createdAt.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </span>
            </div>


            <div className='hidden md:flex items-center gap-2'>
                <span className='font-bold text-sm'>
                    {transaction.description}
                </span>
                <span className="badge badge-secondary badge-sm">{normalizeTransactionCategory(transaction.category)}</span>
                {transaction.accountName && (
                    <span className="badge badge-accent badge-sm">{transaction.accountName}</span>
                )}
            </div>

            <div className='hidden md:flex'>
                {createdAt.toLocaleDateString("fr-FR")} à {" "}
                {createdAt.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </div>

            <div className='hidden md:flex'>
                <Link href={`/manage/${transaction.budgetId}`}  className='btn'>
                Voir plus
                </Link>
            </div>



        </li>
    )
}

export default TransactionItem