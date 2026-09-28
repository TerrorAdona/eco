"use client";
import { checkAndAddUser } from "@/app/action";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect } from "react";

const Navbar = () => {
    const { isLoaded, isSignedIn, user } = useUser();

    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            checkAndAddUser(user?.primaryEmailAddress?.emailAddress)
        }
    }, [user])

    function LeafIcon() {
        return (
            <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
        );
    }

    return (
        <div className="navbar bg-base-200/30 px-5 md:px-[10%] py-4">
            {isLoaded && (
                (isSignedIn ?
                    (
                        <>
                            <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-2.5">
                                    <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-black/20">
                                        <LeafIcon />
                                    </span>
                                    <span className="text-xl font-bold tracking-tight text-gray-900">
                                        <Link href={"/"}>eco</Link>
                                    </span>
                                </div>

                                <div className="hidden md:flex items-center gap-2">
                                    <Link href={"/budgets"} className="btn btn-ghost btn-sm">Mes budgets</Link>
                                    <Link href={"/transactions"} className="btn btn-ghost btn-sm">Mes transactions</Link>
                                    <Link href={"/objectifs"} className="btn btn-ghost btn-sm">Objectifs</Link>
                                    <Link href={"/recurrents"} className="btn btn-ghost btn-sm">Récurrents</Link>
                                    <Link href={"/dashboard"} className="btn btn-ghost btn-sm">Tableau de bord</Link>
                                </div>
                                <UserButton />
                            </div>

                            <div className="flex md:hidden">
                                <div className="dropdown dropdown-end">
                                    <label tabIndex={0} className="btn">
                                        Menu
                                    </label>
                                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                                        <li><Link href={"/budgets"}>Mes budgets</Link></li>
                                        <li><Link href={"/transactions"}>Mes transactions</Link></li>
                                        <li><Link href={"/objectifs"}>Objectifs</Link></li>
                                        <li><Link href={"/recurrents"}>Récurrents</Link></li>
                                        <li><Link href={"/dashboard"}>Tableau de bord</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2.5">
                                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-black/20">
                                    <LeafIcon />
                                </span>
                                <span className="text-xl font-bold tracking-tight text-gray-900">
                                    eco
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={"/sign-in"} className="btn btn-sm md:btn-md btn-outline btn-accent">Se connecter</Link>
                                <Link href={"/sign-up"} className="btn btn-sm md:btn-md btn-accent">Créer un compte</Link>
                            </div>
                        </div>
                    ))
            )}
        </div>
    );
};

export default Navbar;