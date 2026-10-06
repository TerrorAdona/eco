"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { ChartNoAxesColumn, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import React from "react";

const NAV_ITEMS = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Utilisateurs", icon: Users, exact: false },
    { href: "/admin/statistics", label: "Statistiques", icon: ChartNoAxesColumn, exact: false },
];

function AdminNav({ orientation }: { orientation: "vertical" | "horizontal" }) {
    const pathname = usePathname();
    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
    return (
        <nav className={orientation === "vertical" ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto"}>
            {NAV_ITEMS.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`btn btn-sm justify-start gap-2 shrink-0 ${isActive(item.href, item.exact) ? "btn-accent" : "btn-ghost text-neutral-content/70 hover:text-neutral-content"}`}
                >
                    <item.icon className="w-4 h-4" aria-hidden="true" />
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}

const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-base-200">
            <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-neutral text-neutral-content p-5 gap-6 min-h-screen sticky top-0 max-h-screen">
                <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-content">
                        <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="text-xl font-bold tracking-tight">
                        eco <span className="badge badge-accent badge-sm ml-1">Admin</span>
                    </span>
                </div>
                <AdminNav orientation="vertical" />
                <div className="mt-auto flex flex-col gap-3">
                    <Link href="/dashboard" className="btn btn-sm btn-outline btn-accent">
                        Voir le site
                    </Link>
                    <div className="flex items-center gap-2">
                        <UserButton />
                        <span className="text-xs text-neutral-content/60">Espace réservé</span>
                    </div>
                </div>
            </aside>

            <div className="lg:hidden bg-neutral text-neutral-content px-5 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
                <span className="flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-5 h-5 text-accent" aria-hidden="true" />
                    eco <span className="badge badge-accent badge-sm">Admin</span>
                </span>
                <UserButton />
            </div>
            <div className="lg:hidden bg-neutral px-5 pb-3 text-neutral-content">
                <AdminNav orientation="horizontal" />
            </div>

            <main className="flex-1 px-5 md:px-8 py-6 min-w-0">
                {children}
            </main>
        </div>
    );
};

export default AdminShell;
