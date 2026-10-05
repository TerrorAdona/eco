import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { assertAdmin } from "@/app/action";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const { userId } = await auth();
    if (!userId) redirect("/sign-in");
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
    if (!email) redirect("/sign-in");
    try {
        await assertAdmin(email);
    } catch {
        redirect("/");
    }
    return <>{children}</>;
}
