import dotenv from 'dotenv'; import { fileURLToPath } from 'node:url'; import { dirname, resolve } from 'node:path'; import { connectDB } from './config/db.js';
const here = dirname(fileURLToPath(import.meta.url)); dotenv.config({ path: resolve(here, '../../.env') });
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing. Add it to the LendLoop project root .env and restart the API.');
const [{ default: app }, { startJobs }] = await Promise.all([import('./app.js'), import('./jobs/index.js')]);
const port = process.env.PORT || 4000;
await connectDB(process.env.MONGO_URI);
startJobs();
app.listen(port, () => console.log(`LendLoop API listening on ${port}`));
