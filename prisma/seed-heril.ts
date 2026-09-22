import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed for herilala1000@gmail.com...')

  const email = 'herilala1000@gmail.com'

  // Vérifier si l'utilisateur existe déjà
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log(`Creating user: ${email}`)
    user = await prisma.user.create({
      data: { email },
    })
    console.log(`User created with ID: ${user.id}`)
  } else {
    console.log(`User ${email} already exists with ID: ${user.id}`)
  }

  // Définir des données fictives pour les budgets et transactions
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

  // Créer entre 5 et 10 budgets pour cet utilisateur
  const budgetCount = 5 + Math.floor(Math.random() * 6) // 5-10
  const budgets = []

  console.log(`Creating ${budgetCount} budgets for ${email}...`)

  for (let i = 0; i < budgetCount; i++) {
    const budgetName = budgetNames[Math.floor(Math.random() * budgetNames.length)]
    const amount = parseFloat((Math.random() * 2000 + 500).toFixed(2)) // 500-2500
    const emoji = emojis[Math.floor(Math.random() * emojis.length)]

    const budget = await prisma.budget.create({
      data: {
        name: budgetName,
        amount,
        emoji,
        userId: user.id,
      },
    })
    budgets.push(budget)
  }

  console.log(`Created ${budgets.length} budgets`)

  // Créer des transactions pour chaque budget
  for (const budget of budgets) {
    const transactionCount = 10 + Math.floor(Math.random() * 21) // 10-30 transactions par budget
    console.log(`  Creating ${transactionCount} transactions for budget "${budget.name}"...`)

    for (let j = 0; j < transactionCount; j++) {
      const description = transactionDescriptions[Math.floor(Math.random() * transactionDescriptions.length)]
      // 80% dépenses, 20% revenus
      const isIncome = Math.random() < 0.2
      let amount = parseFloat((Math.random() * 150 + 10).toFixed(2)) // 10-160
      if (!isIncome) {
        amount = -amount // négatif pour les dépenses
      }
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]

      await prisma.transaction.create({
        data: {
          description,
          amount,
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