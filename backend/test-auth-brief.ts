import { authorityBrief } from './src/controllers/aiController';
import { Request, Response } from 'express';

async function test() {
  const req = {
    query: {},
    userId: 'mock', // pretending it's an AuthRequest
  } as unknown as Request;

  const res = {
    status: (code: number) => ({
      json: (data: any) => console.log('Status', code, 'JSON', data)
    }),
    json: (data: any) => console.log('JSON', data)
  } as unknown as Response;

  await authorityBrief(req, res);
}
test().then(() => process.exit(0));
