import { Banknote, Bus, CreditCard, GraduationCap, HeartPulse, Home, PartyPopper, Shapes, ShoppingBag, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { normalizeTransactionCategory } from "@/type";
import React from "react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    Alimentation: UtensilsCrossed,
    Transport: Bus,
    Logement: Home,
    Santé: HeartPulse,
    Études: GraduationCap,
    Loisirs: PartyPopper,
    Shopping: ShoppingBag,
    Abonnements: CreditCard,
    Salaire: Banknote,
    Autres: Shapes,
};

interface CategoryIconProps {
    category: string;
    className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className }) => {
    const Icon = CATEGORY_ICONS[normalizeTransactionCategory(category)] ?? Shapes;
    return <Icon className={className ?? "w-6 h-6"} aria-hidden="true" />;
};

export default CategoryIcon;
