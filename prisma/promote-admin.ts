/**
 * Promotion manuelle d'un utilisateur au rôle ADMIN (développement uniquement).
 *
 * Usage : npx tsx prisma/promote-admin.ts utilisateur@exemple.com
 *
 * - L'email est passé en argument : aucun email administrateur codé en dur.
 * - Les nouveaux utilisateurs reçoivent toujours USER (défaut schéma).
 * - Vérifiez le résultat avec : npx tsx prisma/promote-admin.ts --check utilisateur@exemple.com
 */
import prisma from "../lib/prisma";

async function main() {
    const [flagOrEmail, maybeEmail] = process.argv.slice(2);
    const checkOnly = flagOrEmail === "--check";
    const email = checkOnly ? maybeEmail : flagOrEmail;
    if (!email) {
        console.error("Usage : npx tsx prisma/promote-admin.ts [--check] utilisateur@exemple.com");
        process.exit(1);
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error(`Utilisateur introuvable : ${email}`);
        process.exit(1);
    }
    if (checkOnly) {
        console.log(`${email} : rôle ${user.role}`);
        return;
    }
    if (user.role === "ADMIN") {
        console.log(`${email} est déjà ADMIN.`);
        return;
    }
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`${email} promu ADMIN.`);
}

main()
    .catch((e) => {
        console.error(e instanceof Error ? e.message : e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
