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
|   |-- Dockerfile
|   |-- docker-entrypoint.sh
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
|   |-- Dockerfile
|   |-- nginx.conf
|   `-- vite.config.js
|-- .env.example
|-- docker-compose.yml
|-- .gitignore
`-- README.md
```

## 环境要求

本地开发：

- Node.js 18 或更高版本
- npm
- Git

检查版本：

```bash
node -v
npm -v
git --version
```

Docker 部署：

- Docker
- Docker Compose v2
- Git

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

## 部署方案

生产部署推荐使用 Docker Compose。Compose 会启动两个容器：

- `api`: Node.js + Express + Prisma，容器启动时自动执行 `prisma migrate deploy`。
- `web`: Nginx 托管前端静态文件，并把 `/api` 和 `/health` 反向代理到 `api`。

SQLite 数据库文件默认保存在 Docker volume `backend-data` 中。重新构建镜像或重启容器不会删除数据，只有执行 `docker compose down -v` 才会删除该数据卷。

### 1. 准备服务器

服务器需要安装 Git、Docker 和 Docker Compose v2：

```bash
git --version
docker --version
docker compose version
```

拉取源码：

```bash
git clone https://github.com/tiwu9527/subscription-dashboard-demo.git
cd subscription-dashboard-demo
```

### 2. 配置部署变量

复制根目录示例配置：

```bash
cp .env.example .env
```

默认配置如下：

```env
WEB_PORT=9527
FRONTEND_ORIGIN=http://localhost:9527
DATABASE_URL=file:/app/data/prod.db
```

如果直接通过服务器 IP 访问，把 `FRONTEND_ORIGIN` 改成实际访问地址：

```env
WEB_PORT=9527
FRONTEND_ORIGIN=http://your_server_ip:9527
DATABASE_URL=file:/app/data/prod.db
```

如果使用域名和 HTTPS，并由服务器上的 Nginx/Caddy 反向代理到 Docker 服务：

```env
WEB_PORT=9527
FRONTEND_ORIGIN=https://example.com
DATABASE_URL=file:/app/data/prod.db
```

### 3. 启动服务

```bash
docker compose up -d --build
```

默认访问地址：

```text
http://localhost:9527
```

健康检查：

```bash
curl http://localhost:9527/health
```

查看容器状态和日志：

```bash
docker compose ps
docker compose logs -f
```

### 4. 域名反向代理

如果服务器已有 Nginx，可以让 Docker 服务继续监听本机 `9527` 端口，再由宿主机 Nginx 负责 HTTPS 和域名入口。

示例 Nginx 配置：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:9527;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用 HTTPS 后，`.env` 中的 `FRONTEND_ORIGIN` 应改为 `https://example.com`，然后重启容器：

```bash
docker compose up -d
```

### 5. 更新发布

服务器上拉取最新代码并重新构建：

```bash
git pull
docker compose up -d --build
```

`api` 容器启动时会自动执行数据库迁移，不需要手动运行 Prisma 命令。

### 6. 数据备份与恢复

备份 SQLite 数据库：

```bash
docker compose cp api:/app/data/prod.db ./prod.db.bak
```

恢复数据库时先停止服务，再创建后端容器并复制备份文件：

```bash
docker compose down
docker compose create api
docker compose cp ./prod.db.bak api:/app/data/prod.db
docker compose up -d
```

### 7. 停止服务

停止服务并保留数据：

```bash
docker compose down
```

停止服务并删除 SQLite 数据卷：

```bash
docker compose down -v
```

## 可选：手动部署

如果不能使用 Docker，可以手动部署：

1. 后端进入 `backend`，执行 `npm ci`、`npm run prisma:generate`、`npx prisma migrate deploy`，再用 PM2 或 systemd 运行 `npm start`。
2. 前端进入 `frontend`，设置 `VITE_API_BASE_URL="/api"` 后执行 `npm ci` 和 `npm run build`。
3. 使用宿主机 Nginx 托管 `frontend/dist`，并把 `/api` 和 `/health` 代理到后端 `127.0.0.1:3001`。

手动部署时需要自行维护进程守护、静态资源托管、反向代理、日志轮转和数据库备份。除非服务器无法安装 Docker，否则建议使用上面的 Docker Compose 方案。

## 常见问题

### 访问端口被占用

修改根目录 `.env` 的 `WEB_PORT`，例如：

```env
WEB_PORT=8081
FRONTEND_ORIGIN=http://your_server_ip:8081
```

修改后执行：

```bash
docker compose up -d
```

### 前端请求 API 失败

Docker 部署下前端默认请求同域 `/api`，不需要单独暴露后端 `3001` 端口。先检查健康接口：

```bash
curl http://localhost:9527/health
```

如果健康检查失败，查看后端日志：

```bash
docker compose logs api
```

### 前端提示跨域错误

检查根目录 `.env` 中的 `FRONTEND_ORIGIN`。它必须和浏览器实际访问地址的协议、域名/IP、端口完全一致。

示例：

```env
FRONTEND_ORIGIN=https://example.com
```

修改后重启服务：

```bash
docker compose up -d
```

### Prisma 提示数据库或表不存在

Docker 部署下 `api` 启动时会自动执行迁移。可以查看迁移日志：

```bash
docker compose logs api
```

如果需要手动执行迁移：

```bash
docker compose exec api npm run prisma:deploy
```

### 查看服务日志

查看全部日志：

```bash
docker compose logs -f
```

只看后端日志：

```bash
docker compose logs -f api
```

只看前端 Nginx 日志：

```bash
docker compose logs -f web
```
