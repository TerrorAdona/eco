"use client"

import Wrapper from '@/components/Wrapper'
import Notification from '@/components/Notification'
import { getAdminUsers, setUserActive, setUserRole } from '@/app/action'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

interface AdminUserRow {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
}

const Page = () => {
    const [users, setUsers] = useState<AdminUserRow[]>([])
    const [search, setSearch] = useState<string>("")
    const [debouncedSearch, setDebouncedSearch] = useState<string>("")
    const [page, setPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [notification, setNotification] = useState<string>("")
    const closeNotification = () => {
        setNotification("")
    }

    const getErrorMessage = (error: unknown, fallback: string) => {
        return error instanceof Error ? `${fallback} : ${error.message}` : fallback
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [search])

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getAdminUsers(debouncedSearch || undefined, page)
            setUsers(data.users.map((u) => ({ ...u, createdAt: new Date(u.createdAt) })))
            setTotal(data.total)
            setTotalPages(data.totalPages)
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la récupération des utilisateurs"))
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, page])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleRoleChange = async (userId: string, email: string, role: string) => {
        const confirmed = window.confirm(`Voulez-vous vraiment passer ${email} au rôle ${role} ?`)
        if (!confirmed) {
            await fetchUsers()
            return
        }
        try {
            await setUserRole(userId, role)
            setNotification("Rôle modifié avec succès")
            await fetchUsers()
        } catch (error: unknown) {
            setNotification(getErrorMessage(error, "Erreur lors de la modification du rôle"))
            await fetchUsers()
        }
    }

    const handleToggleActive = async (userId: string, email: string, isActive: boolean) => {
        const confirmed = window.confirm(
            isActive
                ? `Voulez-vous vraiment désactiver ${email} ? Il ne pourra plus se connecter ni utiliser l'application.`
                : `Voulez-vous vraiment réactiver ${email} ?`
        )
        if (!confirmed) return
        try {
            await setUserActive(userId, !isActive)
            setNotification(isActive ? "Utilisateur désactivé" : "Utilisateur réactivé")
            await fetchUsers()
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
                <div>
                    <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
                    <p className="text-sm text-base-content/50 mt-1">Comptes utilisateurs, rôles et statuts</p>
                </div>
                <Link href="/admin" className="btn btn-ghost btn-sm">← Tableau de bord admin</Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-5">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par email..."
                    className="input input-bordered flex-1 min-w-0"
                    aria-label="Rechercher un utilisateur"
                />
            </div>

            <div className="overflow-x-auto w-full bg-base-100 border border-base-300 p-5 rounded-xl">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <span className="loading loading-bars loading-lg"></span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <h1>{debouncedSearch ? "Aucun résultat pour cette recherche" : "Aucun utilisateur"}</h1>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-base-content/50 mb-3">{total} utilisateur{total > 1 ? "s" : ""} — page {page}/{totalPages}</p>
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Utilisateur</th>
                                    <th>Email</th>
                                    <th>Rôle</th>
                                    <th>Inscription</th>
                                    <th>Statut</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="font-mono text-xs" title={u.id}>{u.id.slice(0, 8)}…</td>
                                        <td className="max-w-45 truncate" title={u.email}>{u.email}</td>
                                        <td>
                                            <select
                                                className="select select-bordered select-sm"
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, u.email, e.target.value)}
                                                aria-label={`Rôle de ${u.email}`}
                                            >
                                                <option value="USER">USER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </td>
                                        <td className="whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                                        <td>
                                            <span className={`badge badge-sm ${u.isActive ? "badge-success" : "badge-error"}`}>
                                                {u.isActive ? "ACTIF" : "INACTIF"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-1 justify-end">
                                                <Link href={`/admin/users/${u.id}`} className="btn btn-sm btn-ghost">Voir</Link>
                                                <button
                                                    className={`btn btn-sm ${u.isActive ? "btn-outline" : "btn-accent"}`}
                                                    onClick={() => handleToggleActive(u.id, u.email, u.isActive)}
                                                >
                                                    {u.isActive ? "Désactiver" : "Réactiver"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between mt-4">
                            <button
                                className="btn btn-sm btn-outline"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                ← Précédente
                            </button>
                            <span className="text-sm text-base-content/50">Page {page} / {totalPages}</span>
                            <button
                                className="btn btn-sm btn-outline"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Suivante →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Wrapper>
    )
}

export default Page
