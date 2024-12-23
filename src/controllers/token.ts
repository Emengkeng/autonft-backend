import { Request, Response } from 'express';
import { TokenService } from '../services/token';

const tokenService = new TokenService();

export class TokenController {
  // Get user balance
  async getBalance(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const balance = await tokenService.getBalance(userId);
      res.status(200).json({ success: true, balance });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  // Deduct tokens
  async deductTokens(req: Request, res: Response) {
    try {
      const { userId, amount } = req.body;
      const account = await tokenService.deductTokens(userId, amount);
      res.status(200).json({ success: true, account });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }

  // Credit tokens
  async creditTokens(req: Request, res: Response) {
    try {
      const { userId, amount } = req.body;
      const account = await tokenService.creditTokens(userId, amount);
      res.status(200).json({ success: true, account });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  // Get transaction history
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || undefined;
      const history = await tokenService.getTransactionHistory(userId, limit);
      res.status(200).json({ success: true, history });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}
