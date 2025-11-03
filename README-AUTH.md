# 🔐 认证系统和数据持久化升级

## 📋 新增功能

### 1. 用户认证系统
- **登录凭据**: `admin` / `10kmrr1234`
- **JWT Token**: 24小时有效期
- **权限控制**: 只有登录用户可以创建/编辑/删除日报
- **自动验证**: 页面刷新后自动验证登录状态

### 2. 文件系统数据存储
- **后端API**: Node.js + Express
- **数据目录**: `data/reports/`
- **文件格式**: JSON（每个日报一个独立文件）
- **持久化**: 无需数据库，数据永久保存

### 3. 安全特性
- **密码加密**: bcrypt哈希存储
- **Token验证**: 所有API请求需要有效JWT
- **权限控制**: 创建者和管理员权限分离
- **CORS支持**: 跨域请求安全配置

## 🚀 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务器
```bash
# 启动后端API服务器 (端口3000)
npm start

# 或者同时启动前端和后端 (推荐)
npm run dev
```

### 3. 访问应用
- **后端API**: http://localhost:3000
- **前端界面**: http://localhost:8080
- **登录账号**: admin / 10kmrr1234

## 📁 项目结构

```
项目根目录/
├── server.js                    # 后端API服务器
├── package.json                 # 项目依赖配置
├── data/                        # 数据存储目录
│   └── reports/                 # 日报JSON文件
├── src/                         # 前端源码
│   ├── index.html              # 主页面(含登录界面)
│   └── app.js                   # 前端逻辑
└── README-AUTH.md               # 本文档
```

## 🔧 API接口

### 认证接口
- `POST /api/login` - 用户登录
- `GET /api/verify` - 验证Token
- `POST /api/logout` - 退出登录

### 日报管理接口
- `GET /api/reports` - 获取所有日报
- `GET /api/reports/:id` - 获取单个日报
- `POST /api/reports` - 创建日报
- `PUT /api/reports/:id` - 更新日报
- `DELETE /api/reports/:id` - 删除日报

## 🛡️ 安全配置

### JWT密钥
```javascript
const JWT_SECRET = 'your-secret-key-change-in-production';
```
**⚠️ 生产环境请务必修改此密钥**

### 用户配置
```javascript
const HARDCODED_USERS = {
    admin: {
        username: 'admin',
        passwordHash: bcrypt.hashSync('10kmrr1234', 10),
        role: 'admin'
    }
};
```

## 🔄 数据迁移

如果您需要从localStorage迁移现有数据：

1. 启动应用前，数据会自动从localStorage读取
2. 创建新日报时，数据会自动保存到文件系统
3. 现有数据无需手动迁移

## 🔍 故障排除

### 服务器启动失败
```bash
# 检查端口占用
netstat -ano | findstr :3000

# 更换端口
PORT=3001 npm start
```

### 登录失败
- 确认后端服务器正在运行
- 检查用户名密码: admin / 10kmrr1234
- 查看浏览器控制台错误信息

### 数据保存失败
- 检查`data/reports/`目录权限
- 确认磁盘空间充足
- 查看后端控制台日志

## 🎯 使用流程

1. **启动服务**: `npm run dev`
2. **打开浏览器**: 访问 http://localhost:8080
3. **登录系统**: 使用 admin / 10kmrr1234
4. **管理日报**: 创建、编辑、导出日报
5. **退出登录**: 点击右上角退出按钮

## 📈 性能优势

- **无数据库依赖**: 轻量级文件存储
- **快速启动**: 无需数据库配置
- **数据安全**: 文件系统备份简单
- **扩展性强**: 易于迁移到云存储