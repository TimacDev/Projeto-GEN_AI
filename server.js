import { config } from './src/config/env.js';
import app from './src/app.js';

app.listen(config.port, () => {
    console.log(`🚀 AI Task System API running on port ${config.port}`);
    console.log(`📖 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Base URL: http://localhost:${config.port}`);
});
