import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';
import contentRoutes from './content.routes.js';
import strategyRoutes from './strategy.routes.js';
import calendarRoutes from './calendar.routes.js';
import aiRoutes from './ai.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

const routes = [
  { path: '/auth', route: authRoutes },
  { path: '/projects', route: projectRoutes },
  { path: '/tasks', route: taskRoutes },
  { path: '/content', route: contentRoutes },
  { path: '/strategies', route: strategyRoutes },
  { path: '/calendar', route: calendarRoutes },
  { path: '/ai', route: aiRoutes },
  { path: '/upload', route: uploadRoutes },
];

routes.forEach(({ path, route }) => {
  router.use(path, route);
});

export default router;
