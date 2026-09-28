import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data (optional, be careful in production)
  await prisma.transaction.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.user.deleteMany()

  // Create 2 users
  const users = await prisma.user.createManyAndReturn({
    data: [
      { email: 'user1@example.com' },
      { email: 'user2@example.com' },
    ],
  })

  console.log(`Created ${users.length} users`)

  // Define some fake data for budgets and transactions
  const budgetNames = [
    'Groceries', 'Rent', 'Utilities', 'Entertainment', 'Transportation',
    'Dining Out', 'Shopping', 'Healthcare', 'Education', 'Travel',
    'Gifts', 'Savings', 'Insurance', 'Internet', 'Phone'
  ]
  const transactionDescriptions = [
    'Weekly grocery shopping', 'Monthly rent payment', 'Electricity bill',
    'Netflix subscription', 'Gas refill', 'Restaurant dinner',
    'New clothes', 'Doctor visit', 'Online course', 'Flight booking',
    'Birthday gift', 'Emergency fund', 'Car insurance', 'WiFi bill',
    'Mobile plan', 'Coffee shop', 'Movie tickets', 'Concert tickets',
    'Gym membership', 'Pharmacy', 'Book purchase', 'Hotel stay',
    'Taxi fare', 'Parking fee', 'Streaming service', 'Software subscription'
  ]

  for (const user of users) {
    // Create 5-10 budgets per user
    const budgetCount = 5 + Math.floor(Math.random() * 6) // 5-10
    const budgets = []

    for (let i = 0; i < budgetCount; i++) {
      const budgetName = budgetNames[Math.floor(Math.random() * budgetNames.length)]
      const amount = parseFloat((Math.random() * 2000 + 500).toFixed(2)) // 500-2500

      const budget = await prisma.budget.create({
        data: {
          name: budgetName,
          amount,
          userId: user.id,
        },
      })
      budgets.push(budget)
    }

    console.log(`Created ${budgets.length} budgets for user ${user.email}`)

    // Create transactions for each budget
    for (const budget of budgets) {
      const transactionCount = 10 + Math.floor(Math.random() * 21) // 10-30 transactions per budget

      for (let j = 0; j < transactionCount; j++) {
        const description = transactionDescriptions[Math.floor(Math.random() * transactionDescriptions.length)]
        // For expenses, amount negative; for income, positive. Let's make 80% expenses, 20% income.
        const isIncome = Math.random() < 0.2
        let amount = parseFloat((Math.random() * 150 + 10).toFixed(2)) // 10-160
        if (!isIncome) {
          amount = -amount // make negative for expenses
        }

        await prisma.transaction.create({
          data: {
            description,
            amount,
            budgetId: budget.id,
          },
        })
      }

      console.log(`  Created ${transactionCount} transactions for budget ${budget.name}`)
    }
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })