# 个人会员订阅管理面板

一个前后端分离的个人订阅管理 Dashboard。后端使用 Node.js、Express、Prisma 和 SQLite，前端使用 Vue 3、Vite、Tailwind CSS 和 Axios。

## 功能概览

- 新增、查看、删除会员订阅记录
- 支持月付和年付两种计费周期
- 自动统计预估月度支出和年度支出
- 后端提供 REST API 和健康检查接口
- 前端通过环境变量配置 API 地址，便于本地开发和服务器部署

## 技术栈

后端：

- Node.js 18+
- Express
- Prisma
- SQLite
- dotenv
- cors

前端：

- Vue 3
- Vite
- Tailwind CSS
- Axios

## 项目结构

```text
.
|-- backend
|   |-- prisma
|   |   |-- migrations
|   |   `-- schema.prisma
|   |-- .env.example
|   |-- package.json
|   `-- server.js
|-- frontend
|   |-- src
|   |   |-- api.js
|   |   |-- App.vue
|   |   |-- main.js
|   |   `-- style.css
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   |-- postcss.config.js
|   |-- tailwind.config.js
|   `-- vite.config.js
|-- .gitignore
`-- README.md
```

## 环境要求

- Node.js 18 或更高版本
- npm
- Git
- Linux 服务器部署时建议使用普通用户运行应用，不建议直接使用 root 用户运行 Node 服务

检查版本：

```bash
node -v
npm -v
git --version
```

## 本地开发运行

### 1. 克隆源码

```bash
git clone https://github.com/tiwu9527/subscription-dashboard-demo.git
cd subscription-dashboard-demo
```

如果你已经在本机有源码目录，可以直接进入项目根目录。

### 2. 配置并启动后端

```bash
cd backend
cp .env.example .env
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Windows PowerShell 复制环境变量文件时可以使用：

```powershell
Copy-Item .env.example .env
```

后端默认地址：

```text
http://localhost:3001
```

健康检查：

```bash
curl http://localhost:3001/health
```

### 3. 配置并启动前端

新开一个终端：

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Windows PowerShell 复制环境变量文件时可以使用：

```powershell
Copy-Item .env.example .env
```

前端默认地址：

```text
http://localhost:5173
```

## 环境变量说明

后端环境变量文件：`backend/.env`

```env
DATABASE_URL="file:./dev.db"
PORT=3001
FRONTEND_ORIGIN="http://localhost:5173"
```

字段说明：

- `DATABASE_URL`: SQLite 数据库文件地址。`file:./dev.db` 表示数据库文件位于 `backend/prisma/dev.db`。
- `PORT`: 后端 API 服务端口。
- `FRONTEND_ORIGIN`: 允许跨域访问后端的前端地址。必须和浏览器里打开的前端地址一致。

前端环境变量文件：`frontend/.env`

```env
VITE_API_BASE_URL="http://localhost:3001/api"
```

字段说明：

- `VITE_API_BASE_URL`: 前端请求后端 API 的基础地址。

## API 接口

后端接口默认运行在 `http://localhost:3001`。

```text
GET    /health
GET    /api/subscriptions
POST   /api/subscriptions
DELETE /api/subscriptions/:id
GET    /api/subscriptions/summary
```

## 服务器部署指南

下面以 Linux 服务器为例，假设项目部署到 `/opt/subscription-dashboard-demo`，域名为 `example.com`。请把示例域名替换成你自己的域名或服务器 IP。

### 1. 登录服务器

```bash
ssh your_user@your_server_ip
```

### 2. 安装基础环境

确保服务器已经安装 Git、Node.js 18+ 和 npm。

```bash
git --version
node -v
npm -v
```

如果版本不存在或 Node.js 版本低于 18，请先安装或升级 Node.js。

### 3. 克隆源码至服务器

```bash
cd /opt
git clone https://github.com/tiwu9527/subscription-dashboard-demo.git
cd subscription-dashboard-demo
```

如果 `/opt` 没有写入权限，可以先创建目录并授权：

```bash
sudo mkdir -p /opt/subscription-dashboard-demo
sudo chown -R $USER:$USER /opt/subscription-dashboard-demo
git clone https://github.com/tiwu9527/subscription-dashboard-demo.git /opt/subscription-dashboard-demo
cd /opt/subscription-dashboard-demo
```

### 4. 配置后端生产环境

```bash
cd /opt/subscription-dashboard-demo/backend
cp .env.example .env
```

编辑 `backend/.env`：

```env
DATABASE_URL="file:./prod.db"
PORT=3001
FRONTEND_ORIGIN="https://example.com"
```

如果暂时没有域名，使用服务器 IP 和前端访问端口：

```env
FRONTEND_ORIGIN="http://your_server_ip:4173"
```

安装依赖并初始化数据库：

```bash
npm ci
npm run prisma:generate
npx prisma migrate deploy
```

说明：

- 本地开发可以使用 `npm run prisma:migrate`。
- 服务器生产环境建议使用 `npx prisma migrate deploy`，它会执行已经提交到仓库的迁移文件。

### 5. 启动后端服务

临时启动：

```bash
npm start
```

推荐使用 PM2 常驻运行：

```bash
npm install -g pm2
pm2 start server.js --name subscription-dashboard-api
pm2 save
pm2 startup
```

如果全局安装 PM2 没有权限，可以使用 `sudo npm install -g pm2`。`pm2 startup` 执行后通常会输出一条带 `sudo` 的命令，请按终端提示复制执行，用于配置开机自启。

检查后端状态：

```bash
pm2 status
curl http://127.0.0.1:3001/health
```

查看日志：

```bash
pm2 logs subscription-dashboard-api
```

### 6. 构建前端

进入前端目录：

```bash
cd /opt/subscription-dashboard-demo/frontend
cp .env.example .env
```

如果前端通过域名访问，并且 Nginx 会把 `/api` 反向代理到后端，可以配置：

```env
VITE_API_BASE_URL="/api"
```

如果直接通过服务器 IP 访问后端端口，可以配置：

```env
VITE_API_BASE_URL="http://your_server_ip:3001/api"
```

安装依赖并构建：

```bash
npm ci
npm run build
```

构建产物会生成到：

```text
frontend/dist
```

### 7. 前端运行方式一：Vite Preview

适合临时演示或内网测试：

```bash
npm run preview
```

默认访问地址：

```text
http://your_server_ip:4173
```

如果使用这种方式，请确保 `backend/.env` 里的 `FRONTEND_ORIGIN` 是：

```env
FRONTEND_ORIGIN="http://your_server_ip:4173"
```

### 8. 前端运行方式二：Nginx 静态托管

生产环境更推荐用 Nginx 托管 `frontend/dist`，并把 API 请求反向代理到后端。

示例 Nginx 配置：

```nginx
server {
    listen 80;
    server_name example.com;

    root /opt/subscription-dashboard-demo/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

测试并重载 Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

使用 Nginx 和域名时，建议配置：

```env
# backend/.env
FRONTEND_ORIGIN="https://example.com"
```

```env
# frontend/.env
VITE_API_BASE_URL="/api"
```

修改前端环境变量后，需要重新执行：

```bash
cd /opt/subscription-dashboard-demo/frontend
npm run build
```

## 更新服务器代码

服务器上更新到 GitHub 最新代码：

```bash
cd /opt/subscription-dashboard-demo
git pull
```

更新后端：

```bash
cd backend
npm ci
npm run prisma:generate
npx prisma migrate deploy
pm2 restart subscription-dashboard-api
```

更新前端：

```bash
cd ../frontend
npm ci
npm run build
```

如果使用 Nginx 静态托管，通常构建完成即可生效；如修改了 Nginx 配置，再执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 常见问题

### 前端提示跨域错误

检查 `backend/.env`：

```env
FRONTEND_ORIGIN="http://localhost:5173"
```

这个地址必须和浏览器访问前端时的协议、域名/IP、端口完全一致。

### 前端请求 API 失败

检查 `frontend/.env`：

```env
VITE_API_BASE_URL="http://localhost:3001/api"
```

如果是在服务器上使用域名和 Nginx，通常应设置为：

```env
VITE_API_BASE_URL="/api"
```

修改 `frontend/.env` 后必须重新构建前端：

```bash
npm run build
```

### Prisma 提示数据库或表不存在

在后端目录执行：

```bash
npm run prisma:generate
npx prisma migrate deploy
```

本地开发也可以执行：

```bash
npm run prisma:migrate
```

### 端口被占用

检查端口占用：

```bash
lsof -i :3001
```

可以修改 `backend/.env` 里的 `PORT`，但同时要调整前端的 `VITE_API_BASE_URL` 或 Nginx 反向代理配置。

### 查看服务日志

如果使用 PM2：

```bash
pm2 logs subscription-dashboard-api
```

如果直接运行：

```bash
npm start
```

后端日志会直接输出在当前终端。
