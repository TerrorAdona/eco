"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyRole } from "@/app/action";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const [allowed, setAllowed] = useState<boolean>(false);

    useEffect(() => {
        if (!isLoaded) return;
        const email = user?.primaryEmailAddress?.emailAddress ?? "";
        if (!isSignedIn || !email) {
            router.replace("/sign-in");
            return;
        }
        let active = true;
        getMyRole(email)
            .then((role) => {
                if (!active) return;
                if (role === "ADMIN") {
                    setAllowed(true);
                } else {
                    router.replace("/");
                }
            })
            .catch(() => {
                if (active) router.replace("/");
            });
        return () => { active = false; };
    }, [isLoaded, isSignedIn, user, router]);

    if (!allowed) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-bars loading-lg"></span>
            </div>
        );
    }

    return <AdminShell>{children}</AdminShell>;
}
