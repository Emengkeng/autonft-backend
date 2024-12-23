import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TokenService {
  // Create or get a user account
  async getOrCreateAccount(userId: string) {
    let account = await prisma.tokenAccount.findUnique({ where: { userId } });

    if (!account) {
      account = await prisma.tokenAccount.create({
        data: {
          userId,
          balance: 0,
          tier: 'basic', // Default tier
        },
      });
    }

    return account;
  }

  // Fetch user's balance
  async getBalance(userId: string) {
    const account = await prisma.tokenAccount.findUnique({ where: { userId } });

    if (!account) {
      throw new Error('Account not found');
    }

    return account.balance;
  }

  // Deduct tokens
  async deductTokens(userId: string, amount: number) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const account = await tx.tokenAccount.findUnique({
          where: { userId },
        });

        if (!account) {
          throw new Error('Account not found');
        }

        if (account.balance < amount) {
          throw new Error('Insufficient balance');
        }

        const updatedAccount = await tx.tokenAccount.update({
          where: { userId },
          data: { balance: account.balance - amount },
        });

        await tx.tokenTransaction.create({
          data: {
            userId,
            amount: -amount,
            type: 'DEDUCT',
          },
        });

        return updatedAccount;
      });
    } catch (error) {
      console.error(`[ERROR] Deduct Tokens Failed: ${error.message}`);
      throw error;
    }
  }

  // Credit tokens
  async creditTokens(userId: string, amount: number) {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    try {
      return await prisma.$transaction(async (tx) => {
        const account = await this.getOrCreateAccount(userId);

        const updatedAccount = await tx.tokenAccount.update({
          where: { userId },
          data: { balance: account.balance + amount },
        });

        await tx.tokenTransaction.create({
          data: {
            userId,
            amount,
            type: 'CREDIT',
          },
        });

        return updatedAccount;
      });
    } catch (error) {
      console.error(`[ERROR] Credit Tokens Failed: ${error.message}`);
      throw error;
    }
  }


  // Get transaction history
  async getTransactionHistory(userId: string, limit?: number) {
    try {
      return prisma.tokenTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error(`[ERROR] Fetch Transaction History Failed: ${error.message}`);
      throw error;
    }
  }
}
