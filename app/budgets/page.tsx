"use client"


import Wrapper from '@/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import EmojiPicker from 'emoji-picker-react'
import React, { useEffect, useState } from 'react'
import { addBudget, getBudgetsByUser } from '../action'
import Notification from '@/components/Notification'
import { Budget } from '@prisma/client'

const page = () => {

    const { user } = useUser()
    const [budgetName, setBudgetName] = useState<string>("")
    const [budgetAmount, setBudgetAmount] = useState<string>("")
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
    const [selectedEmoji, setSelectedEmoji] = useState<string>("")
    const [budgets, setBudgets] = useState<Budget[]>([])

    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const handleEmojiSelect = (emojiObject : {emoji:string}) => {
        setSelectedEmoji(emojiObject.emoji)
        setShowEmojiPicker(false)
    }

    const handleAddBudget = async () => {
        try {
            const amount = parseFloat(budgetAmount)
            if(isNaN(amount) || amount <= 0) {
                throw new Error("Montant invalide")
            }
            if(!user){
                throw new Error("Utilisateur non trouvé")
            }
            await addBudget (
                user?.primaryEmailAddress?.emailAddress as String,
                budgetName,
                amount,
                selectedEmoji
            )

            const modal = document.getElementById("my_modal_3") as HTMLDialogElement
            if(modal){
                modal.close()
            }
            setBudgetName("")
            setBudgetAmount("")
            setSelectedEmoji("")
            setNotification("Budget ajouté avec succès")
        } catch (error : any) {
            setNotification("Erreur lors de l'ajout du budget : " + error.message)
        }
    }

    useEffect(() => {
        fetchBudgets()
    }, [user])

    const fetchBudgets = async () => {
        if(user?.primaryEmailAddress?.emailAddress){
            try {
                const budgets = await getBudgetsByUser(user.primaryEmailAddress.emailAddress)
                setBudgets(budgets)
            } catch (error : any) {
                setNotification("Erreur lors de la récupération des budgets : " + error.message)
            }
        }
        
    }

    return (
        <div>
            <Wrapper>

                {notification && (
                    <Notification message={notification} onClose={closeNotification}/>
                )}

                <button className="btn btn-outline btn-primary" onClick={() => (document.getElementById('my_modal_3') as HTMLDialogElement).showModal()}>Nouveau budget</button>
                <dialog id="my_modal_3" className="modal">
                    <div className="modal-box">
                        <form method="dialog">
                            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
                        </form>
                        <h3 className="font-bold text-lg">Création d'un budget</h3>
                        <p className="py-4">Permet de controler ces dépenses</p>
                        <div className='w-full flex flex-col'>

                            <input type="text" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} placeholder='Nom du budget' className='w-full input input-bordered mb-3' required />

                            <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder='Montant du budget' className='w-full input input-bordered mb-3' required />

                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`btn ${showEmojiPicker ? 'btn-primary' : 'btn-outline'}`}>
                                {selectedEmoji || "Choisir un emoji"}</button>
                            {
                                showEmojiPicker && (
                                    <div className="flex justify-center items-center pb-5">
                                        <EmojiPicker onEmojiClick={handleEmojiSelect}  />
                                    </div>
                                )
                            }


                            <button 
                            className='btn btn-primary mt-3'
                            onClick={handleAddBudget}
                            >Créer</button>

                        </div>
                    </div>
                </dialog>

                <ul className='grid md:grid-cols-3 gap-5'>
                    {budgets.map((budget) => (
                        <li key={budget.id}>
                            <div className='card card-bordered'>
                                <div className='card-body'>
                                    <h3 className='card-title'>{budget.name}</h3>
                                    <p>{budget.amount}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>

            </Wrapper>
        </div>
    )

}

export default page
