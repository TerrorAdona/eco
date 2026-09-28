import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed for herilala1000@gmail.com (ariary)...')

  const email = 'herilala1000@gmail.com'

  // Supprimer les données existantes pour cet utilisateur (pour éviter les doublons)
  console.log(`Cleaning existing data for ${email}...`)
  await prisma.transaction.deleteMany({
    where: {
      budget: {
        user: {
          email: email
        }
      }
    }
  })

  await prisma.budget.deleteMany({
    where: {
      user: {
        email: email
      }
    }
  })

  await prisma.user.deleteMany({
    where: {
      email: email
    }
  })

  // Créer l'utilisateur
  console.log(`Creating user: ${email}`)
  const user = await prisma.user.create({
    data: { email },
  })
  console.log(`User created with ID: ${user.id}`)

  // Définir des données fictives pour les budgets et transactions (en ariary - monnaie malgache)
  const budgetNames = [
    'Courses', 'Loyer', 'Factures', 'Loisirs', 'Transport',
    'Restaurants', 'Shopping', 'Santé', 'Éducation', 'Voyages',
    'Cadeaux', 'Épargne', 'Assurances', 'Internet', 'Téléphone'
  ]
  const transactionDescriptions = [
    'Courses hebdomadaires', 'Paiement du loyer', 'Facture d\'électricité',
    'Abonnement Netflix', 'Plein d\'essence', 'Dîner au restaurant',
    'Nouveaux vêtements', 'Visite médicale', 'Cours en ligne', 'Réservation d\'avion',
    'Cadeau d\'anniversaire', 'Épargne mensuelle', 'Assurance voiture', 'Facture internet',
    'Facture mobile', 'Café du matin', 'Place de cinéma', 'Billet de concert',
    'Abonnement salle de sport', 'Pharmacie', 'Achat de livre', 'Nuit d\'hôtel',
    'Course en taxi', 'Frais de parking', 'Abonnement streaming', 'Abonnement logiciel'
  ]

  // Créer entre 5 et 8 budgets pour cet utilisateur
  const budgetCount = 5 + Math.floor(Math.random() * 4) // 5-8
  const budgets = []

  console.log(`Creating ${budgetCount} budgets for ${email}...`)

  for (let i = 0; i < budgetCount; i++) {
    const budgetName = budgetNames[Math.floor(Math.random() * budgetNames.length)]
    // Montants en ariary (entiers) : entre 50 000 et 2 000 000 ariary
    const amount = Math.floor(Math.random() * (2000000 - 50000) + 50000)

    const budget = await prisma.budget.create({
      data: {
        name: budgetName,
        amount, // Maintenant un entier (ariary)
        userId: user.id,
      },
    })
    budgets.push(budget)
  }

  console.log(`Created ${budgets.length} budgets`)

  // Créer des transactions pour chaque budget
  for (const budget of budgets) {
    const transactionCount = 8 + Math.floor(Math.random() * 17) // 8-24 transactions par budget (un peu moins pour des tests)
    console.log(`  Creating ${transactionCount} transactions for budget "${budget.name}"...`)

    for (let j = 0; j < transactionCount; j++) {
      const description = transactionDescriptions[Math.floor(Math.random() * transactionDescriptions.length)]
      // 75% dépenses, 25% revenus (un peu plus de revenus pour varier)
      const isIncome = Math.random() < 0.25
      // Montants en ariary (entiers) : entre 5 000 et 500 000 ariary pour les transactions
      let amount = Math.floor(Math.random() * (500000 - 5000) + 5000)
      if (!isIncome) {
        amount = -amount // négatif pour les dépenses
      }

      await prisma.transaction.create({
        data: {
          description,
          amount, // Maintenant un entier (ariary)
          budgetId: budget.id,
        },
      })
    }

    console.log(`    Created ${transactionCount} transactions`)
  }

  console.log(`Seed completed successfully for ${email}!`)
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })