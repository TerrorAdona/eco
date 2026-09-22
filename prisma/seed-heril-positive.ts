import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed for herilala1000@gmail.com (positive amounts only)...')

  const email = 'herilala1000@gmail.com'

  // Supprimer les données existantes pour cet utilisateur
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
  const emojis = ['🛒', '🏠', '💡', '🎬', '🚗', '🍽️', '🛍️', '🏥', '📚', '✈️', '🎁', '💰', '📄', '🌐', '📱', '☕', '🎬', '🎫', '💪', '💊', '📖', '🏨', '🚖', '🅿️', '▶️', '💾']

  // Helper to generate round numbers (multiples of 5000)
  function roundAmount(min: number, max: number): number {
    // Generate random number then round to nearest 5000
    const raw = Math.floor(Math.random() * (max - min + 1)) + min
    return Math.round(raw / 5000) * 5000
  }

  // Créer entre 5 et 7 budgets pour cet utilisateur
  const budgetCount = 5 + Math.floor(Math.random() * 3) // 5-7
  const budgets = []

  console.log(`Creating ${budgetCount} budgets for ${email}...`)

  for (let i = 0; i < budgetCount; i++) {
    const budgetName = budgetNames[Math.floor(Math.random() * budgetNames.length)]
    // Montants en ariary arrondis : entre 100 000 et 1 500 000 ariary (arrondi à 5000)
    const amount = roundAmount(100000, 1500000)
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]

    const budget = await prisma.budget.create({
      data: {
        name: budgetName,
        amount, // montant positif et arrondi (representant le budget alloué)
        emoji,
        userId: user.id,
      },
    })
    budgets.push(budget)
  }

  console.log(`Created ${budgets.length} budgets`)

  // Créer des transactions pour chaque budget (toutes des dépenses, montants positifs)
  for (const budget of budgets) {
    const transactionCount = 5 + Math.floor(Math.random() * 11) // 5-15 transactions par budget
    console.log(`  Creating ${transactionCount} transactions for budget "${budget.name}" (budget: ${budget.amount} ariary)...`)

    for (let j = 0; j < transactionCount; j++) {
      const description = transactionDescriptions[Math.floor(Math.random() * transactionDescriptions.length)]
      // Toutes les transactions sont des dépenses (montants positifs)
      // Montants en ariary arrondis : entre 5 000 et 100 000 ariary, mais ne pas dépasser le budget
      let maxTransaction = Math.min(100000, budget.amount) // ne pas dépasser le budget ni 100k
      let amount = roundAmount(5000, maxTransaction)
      // Toujours positif car représentant une dépense
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]

      await prisma.transaction.create({
        data: {
          description,
          amount, // montant positif et arrondi (dépense)
          emoji,
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