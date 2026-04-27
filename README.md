# 个人会员订阅管理面板

一个前后端分离的个人订阅管理 Dashboard：后端使用 Node.js + Express + Prisma + SQLite，前端使用 Vue 3 + Vite + Tailwind CSS + Axios。

## 项目结构

```text
.
├── backend
│   ├── prisma
│   │   └── schema.prisma
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend
    ├── src
    │   ├── api.js
    │   ├── App.vue
    │   ├── main.js
    │   └── style.css
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

## Step 1: 数据库与后端初始化

后端核心依赖位于 `backend/package.json`：

- `express`: RESTful API 服务
- `@prisma/client` / `prisma`: ORM 与迁移工具
- `sqlite`: 通过 Prisma datasource 使用本地 SQLite 文件
- `cors`: 允许前端 Vite 开发服务跨域访问
- `dotenv`: 读取 `.env` 环境变量

Prisma 模型位于 `backend/prisma/schema.prisma`，包含 `Subscription` 模型：

- `id`: 自增主键
- `platform`: 平台名称
- `planType`: 订阅种类
- `price`: 价格
- `billingCycle`: `monthly` 或 `yearly`
- `nextBillingDate`: 下次扣费日期
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

Express API 位于 `backend/server.js`：

- `GET /api/subscriptions`: 获取订阅列表，按 `nextBillingDate` 升序排序
- `POST /api/subscriptions`: 创建订阅，包含基础校验
- `DELETE /api/subscriptions/:id`: 删除指定订阅
- `GET /api/subscriptions/summary`: 获取月度和年度预估支出
- `GET /health`: 健康检查

## Step 2: 前端初始化

前端核心依赖位于 `frontend/package.json`：

- `vue`: Vue 3 Composition API
- `vite`: 前端构建与开发服务
- `@vitejs/plugin-vue`: Vite Vue 插件
- `tailwindcss` / `postcss` / `autoprefixer`: 样式工具链
- `axios`: HTTP 请求封装

API 封装位于 `frontend/src/api.js`，包含：

- `fetchSubscriptions()`
- `createSubscription(payload)`
- `deleteSubscription(id)`
- `getApiErrorMessage(error)`

核心视图位于 `frontend/src/App.vue`，包含：

- 顶部本月与全年支出汇总
- 新增订阅表单与提交 Loading 状态
- 响应式订阅明细列表
- 月付 / 年付 Badge
- 删除二次确认与删除中状态

## Step 3: 运行指南

要求：Node.js 18+，无需 root 权限，默认端口为后端 `3001`、前端 `5173`。

### 1. 启动后端

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

后端地址：`http://localhost:3001`

### 2. 启动前端

新开一个终端：

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

前端地址：`http://localhost:5173`

### 3. 生产构建

```bash
cd frontend
npm run build
npm run preview
```

```bash
cd backend
npm run start
```

## 环境变量说明

后端 `backend/.env`：

```env
DATABASE_URL="file:./dev.db"
PORT=3001
FRONTEND_ORIGIN="http://localhost:5173"
```

前端 `frontend/.env`：

```env
VITE_API_BASE_URL="http://localhost:3001/api"
```

## 常见问题

- 如果前端提示跨域错误，请确认 `backend/.env` 中的 `FRONTEND_ORIGIN` 与浏览器访问地址一致。
- 如果 Prisma 提示数据库不存在，请先执行 `npm run prisma:migrate`。
- Linux 非 root 用户可直接使用默认端口，因为 `3001`、`5173`、`4173` 都不是特权端口。
