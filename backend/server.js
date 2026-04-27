import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const port = Number(process.env.PORT || 3001);
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const allowedBillingCycles = new Set(['monthly', 'yearly']);

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());

function parseSubscriptionPayload(body) {
  const platform = String(body.platform || '').trim();
  const planType = String(body.planType || '').trim();
  const billingCycle = String(body.billingCycle || '').trim();
  const price = Number(body.price);
  const nextBillingDate = new Date(body.nextBillingDate);

  const errors = [];

  if (!platform) errors.push('平台名称不能为空');
  if (!planType) errors.push('订阅种类不能为空');
  if (!Number.isFinite(price) || price < 0) errors.push('订阅价格必须是大于或等于 0 的数字');
  if (!allowedBillingCycles.has(billingCycle)) errors.push('计费周期只能是 monthly 或 yearly');
  if (!body.nextBillingDate || Number.isNaN(nextBillingDate.getTime())) errors.push('下次扣费日期格式无效');

  return {
    errors,
    data: {
      platform,
      planType,
      price,
      billingCycle,
      nextBillingDate
    }
  };
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/subscriptions', async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { nextBillingDate: 'asc' }
    });

    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
});

app.get('/api/subscriptions/summary', async (req, res, next) => {
  try {
    const subscriptions = await prisma.subscription.findMany();
    const monthlyTotal = subscriptions.reduce((total, subscription) => {
      return total + (subscription.billingCycle === 'yearly' ? subscription.price / 12 : subscription.price);
    }, 0);

    res.json({
      monthlyTotal: Number(monthlyTotal.toFixed(2)),
      yearlyTotal: Number((monthlyTotal * 12).toFixed(2))
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/subscriptions', async (req, res, next) => {
  try {
    const { errors, data } = parseSubscriptionPayload(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ message: '请求数据校验失败', errors });
    }

    const subscription = await prisma.subscription.create({ data });
    return res.status(201).json(subscription);
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/subscriptions/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: '订阅 ID 无效' });
    }

    await prisma.subscription.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: '订阅记录不存在或已删除' });
    }

    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: '服务器内部错误，请稍后重试' });
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Subscription API listening on http://localhost:${port}`);
});
