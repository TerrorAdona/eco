import Link from "next/link";
import Navbar from "@/components/Navbar";
import budgets from "@/components/data";
import BudgetItem from "@/components/BudgetItem";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="flex items-center justify-center flex-col py-10 w-full">
        <div>
          <div className="flex flex-col">
            <div className="flex justify-center mb-4">
              <span className="badge badge-primary badge-lg">Gestion financière personnelle</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-center">
              Gérez efficacement <br /> vos dépenses.
            </h1>
            <p className="py-6 text-base-content/70 text-center">
              eco vous accompagne pour une meilleure gestion de vos finances.
            </p>
            {/* <div className="flex justify-center items-center">
              <Link href={"/sign-in"} className="btn btn-sm md:btn-md btn-outline btn-accent">
                Se connecter
              </Link>
              <Link href={"/sign-up"} className="btn btn-sm md:btn-md btn-accent ml-2">
                Créer un compte
              </Link>
            </div> */}

            {/* <h2 className="text-xl font-semibold text-center mt-10 mb-2">Exemple de budgets</h2> */}
            <ul className='grid md:grid-cols-3 gap-5 mt-3'>
              {budgets.map((budget) => (
                <BudgetItem key={budget.id} budget={budget} enableHover={1} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
