"use client"
import { Transaction } from '@/type'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { getTransactionsByEmailAndPeriod } from '../action'
import Wrapper from '@/components/Wrapper'
import TransactionItem from '@/components/TransactionItem'

const Page = () => {

    const { user } = useUser()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    const fetchTransactions = async (period: string) => {
        if (user?.primaryEmailAddress?.emailAddress) {
            setLoading(true)
            try {
                const transactionsData = await getTransactionsByEmailAndPeriod(user.primaryEmailAddress.emailAddress, period)
                setTransactions(transactionsData.map((t) => ({ ...t, createdAt: new Date(t.createdAt) })))
            } catch (error) {
                console.error("Erreur lors de la récupération des transactions ", error);
            } finally {
                setLoading(false)
            }
        } else {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions("last30")
    }, [user?.primaryEmailAddress?.emailAddress])

    return (
        <Wrapper>

            <div className='flex justify-end mb-5'>
                <select
                    className='input input-bordered input-md'
                    defaultValue="last30"
                    onChange={(e) => fetchTransactions(e.target.value)}
                >
                    <option value="last7">Derniers 7 jours</option>
                    <option value="last30">Derniers 30 jours</option>
                    <option value="last90">Derniers 90 jours</option>
                    <option value="last365">Derniers 365 jours</option>
                </select>
            </div>

            <div className='overflow-x-auto w-full gb-base-200/35 p-5 rounded-xl'>
                {
                    loading ? (
                        <div className='flex items-center justify-center h-64'>
                            <span className="loading loading-bars loading-lg"></span>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className='flex flex-col items-center justify-center h-64'>
                            <h1>Aucune transaction</h1>
                        </div>
                    ) : (
                        <div>
                            <ul className='divide-y divide-base-300'>
                                {transactions.map((transaction) => (
                                    <li key={transaction.id}>
                                        <TransactionItem transaction={transaction} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                }
            </div>
        </Wrapper>
    )
}

export default Page