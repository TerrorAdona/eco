import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <div className="flex items-center justify-center flex-col py-10 w-full">
        <div>
          <div className="flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold text-center">
              Gérez éfficacement <br /> vos dépenses.
            </h1>
            <p className="py-6 text-gray-800 text-center">
              eco vous accompagne pour une meilleure gestion de vos finances.
            </p>
            <div className="flex justify-center items-center">
              <Link href={""} className="btn btn-sm md:btn-md btn-outline btn-accent">
                Se connecter
              </Link>
              <Link href={""} className="btn btn-sm md:btn-md btn-accent ml-2">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
