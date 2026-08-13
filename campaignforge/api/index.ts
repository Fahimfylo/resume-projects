import app from '../server/src/app.js';
import { connectDatabase } from '../server/src/config/db.js';

let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected) {
    await connectDatabase();
    isConnected = true;
  }
  return app(req, res);
}
