import dotenv from 'dotenv';
import { resolve } from 'path';

const isTest = process.env?.VITEST_VSCODE || process.env.NODE_ENV === 'test';
const envFile = isTest ? '.env.test' : '.env';
process.env.NODE_ENV = isTest ? 'test' : process.env.NODE_ENV;

dotenv.config({ path: resolve(process.cwd(), envFile) });
console.log(`Loaded environment variables from ${envFile}`);
