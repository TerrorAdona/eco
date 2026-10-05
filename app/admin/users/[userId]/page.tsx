"use client"

import Wrapper from '@/components/Wrapper'
import Notification from '@/components/Notification'
import { getAdminUserDetail, setUserActive, setUserRole } from '@/app/action'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

interface AdminUserDetail {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    budgetCount: number;
    accountCount: number;
    transactionCount: number;
}

const Page = ({ params }: { params: Promise<{ userId: string }> }) => {
    const [userId, setUserId] = useState<string>("")
    const [detail, setDetail] = useState<AdminUserDetail | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [notFound, setNotFound] = useState<boolean>(false)
    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    const fetchDetail = useCallback(async (id: string) => {
        setLoading(true)
        setNotFound(false)
        try {
            const data = await getAdminUserDetail(id)
            setDetail({ ...data, createdAt: new Date(data.createdAt) })
        } catch (error: unknown) {
            if (error instanceof Error && error.message === "Utilisateur non trouvé") {
                setNotFound(true)
            } else {
                setNotification(getErrorMessage(error, "Erreur lors de la récupération de l'utilisateur"))
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            const data = await params
            setUserId(data.userId)
            fetchDetail(data.userId)
        }
        load()
    }, [params, fetchDetail])

    const handleRoleChange = async (role: string) => {
        if (!detail) return
        const confirmed = window.confirm(`Voulez-vous vraiment passer ${detail.email} au rôle ${role} ?`)
        if (!confirmed) {
            fetchDetail(userId)
            return
        }
        try {
            await setUserRole(detail.id, role)
            setNotification("Rôle modifié avec succès")
            await fetchDetail(userId)
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la modification du rôle"))
            await fetchDetail(userId)
        }
    }

    const handleToggleActive = async () => {
        if (!detail) return
        const confirmed = window.confirm(
            detail.isActive
                ? `Voulez-vous vraiment désactiver ${detail.email} ? Il ne pourra plus se connecter ni utiliser l'application.`
                : `Voulez-vous vraiment réactiver ${detail.email} ?`
        )
        if (!confirmed) return
        try {
            await setUserActive(detail.id, !detail.isActive)
            setNotification(detail.isActive ? "Utilisateur désactivé" : "Utilisateur réactivé")
            await fetchDetail(userId)
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors du changement de statut"))
        }
    }

    return (
        <Wrapper>
            {notification && (
                <Notification message={notification} onClose={closeNotification} />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h1 className="text-2xl font-bold">Fiche utilisateur</h1>
                <Link href="/admin/users" className="btn btn-ghost btn-sm">← Utilisateurs</Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <span className="loading loading-bars loading-lg"></span>
                </div>
            ) : notFound || !detail ? (
                <div className="flex flex-col items-center justify-center text-center min-h-[300px] px-4 rounded-2xl border-2 border-dashed border-base-300 bg-base-100">
                    <h2 className="text-lg font-semibold">Utilisateur introuvable</h2>
                    <p className="text-sm text-base-content/50 mt-1">Cet utilisateur n&apos;existe pas ou a été supprimé.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="card bg-base-100 border border-base-300 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="font-bold text-lg truncate" title={detail.email}>{detail.email}</h2>
                                <p className="text-sm text-base-content/50">
                                    Inscrit le {new Date(detail.createdAt).toLocaleDateString("fr-FR")} · ID <span className="font-mono text-xs">{detail.id.slice(0, 8)}…</span>
                                </p>
                            </div>
                            <span className={`badge ${detail.isActive ? "badge-success" : "badge-error"}`}>
                                {detail.isActive ? "ACTIF" : "INACTIF"}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <select
                                className="select select-bordered"
                                value={detail.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                aria-label="Rôle de l'utilisateur"
                            >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                            <button
                                className={`btn ${detail.isActive ? "btn-outline" : "btn-accent"}`}
                                onClick={handleToggleActive}
                            >
                                {detail.isActive ? "Désactiver" : "Réactiver"}
                            </button>
                        </div>
                    </div>

                    <div className="stats stats-vertical lg:stats-horizontal shadow w-full bg-base-100 border border-base-300">
                        <div className="stat">
                            <div className="stat-title">Budgets</div>
                            <div className="stat-value text-2xl">{detail.budgetCount}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Comptes</div>
                            <div className="stat-value text-2xl">{detail.accountCount}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Transactions</div>
                            <div className="stat-value text-2xl">{detail.transactionCount}</div>
                        </div>
                    </div>
                    <p className="text-xs text-base-content/50">Activité générale uniquement — aucun montant ni détail financier affiché.</p>
                </div>
            )}
        </Wrapper>
    )
}

export default Page
