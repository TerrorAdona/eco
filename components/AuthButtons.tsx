"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

const AuthButtons = () => {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={"/sign-up"} className="btn btn-md md:btn-lg btn-accent">
        Créer un compte
      </Link>
      <Link href={"/sign-in"} className="btn btn-md md:btn-lg btn-outline btn-accent">
        Se connecter
      </Link>
    </div>
  );
};

export default AuthButtons;