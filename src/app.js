import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/taskRoutes.js';
import clickbotRoutes from './routes/clickbotRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/clickbot', clickbotRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
