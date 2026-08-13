import { app } from '../../POS_Restro/pos-backend/src/app';
import { connectDatabase } from '../../POS_Restro/pos-backend/src/config/database';
import type { Request, Response } from 'express';

let connected = false;

export default async function handler(req: Request, res: Response) {
  if (!connected) {
    try {
      await connectDatabase();
      connected = true;
    } catch (error) {
      console.error('Failed to connect to database:', error);
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        code: 'DB_CONNECTION_ERROR',
      });
      return;
    }
  }
  app(req, res);
}
