import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const email = process.argv[2]?.toLowerCase();
if (!email) { console.error('Usage: npm run make-admin -- user@college.edu'); process.exit(1); }
try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) throw new Error(`No account found for ${email}. Sign up in LendLoop first.`);
  console.log(`${user.email} is now an admin.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
