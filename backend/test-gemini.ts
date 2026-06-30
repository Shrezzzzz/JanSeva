import { generateGeminiJSON } from './src/ai/gemini/client';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Testing generateGeminiJSON...");
    const res = await generateGeminiJSON("Return empty json", {}, { timeoutMs: 8000 });
    console.log("Result:", res);
  } catch (e) {
    console.error("Throw:", e);
  }
}
test().then(() => process.exit(0));
