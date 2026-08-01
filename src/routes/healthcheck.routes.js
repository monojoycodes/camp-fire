import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'all good!',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    quote: "Working hard for you is always the right choice."
  });
});

export default router;