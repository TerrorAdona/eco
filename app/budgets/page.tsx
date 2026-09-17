"use client"


import Wrapper from '@/components/Wrapper'
import { useUser } from '@clerk/nextjs'
import EmojiPicker from 'emoji-picker-react'
import React, { useEffect, useState } from 'react'
import { addBudget } from '../action'

const page = () => {

    const { user } = useUser()
    const [budgetName, setBudgetName] = useState<string>("")
    const [budgetAmount, setBudgetAmount] = useState<string>("")
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
    const [selectedEmoji, setSelectedEmoji] = useState<string>("")

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
                user.primaryEmailAddress?.emailAddress as String,
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
        } catch (error) {
            
        }
    }

    return (
        <div>
            <Wrapper>
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
            </Wrapper>
        </div>
    )

}

export default page
