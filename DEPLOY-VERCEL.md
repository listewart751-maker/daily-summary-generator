# 🚀 Vercel 部署指南

## 📋 部署前准备

### 1. 环境要求
- Node.js >= 16.0.0
- Vercel 账号 (免费)
- GitHub/GitLab/Bitbucket 账号

### 2. 项目结构
```
daily-summary-generator/
├── 📄 server.js              # Express API服务器
├── 📄 package.json           # 项目配置
├── 📄 vercel.json            # Vercel配置
├── 📁 src/                   # 前端静态文件
│   ├── index.html
│   └── app.js
└── 📁 summary/               # Markdown文件
```

## 🎯 方法一: 通过 Vercel CLI 部署

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 部署项目
```bash
# 在项目根目录执行
vercel --prod
```

### 4. 配置项目设置
```bash
# 按提示配置:
# ? Set up and deploy "~/project"? [Y/n] y
# ? Which scope do you want to deploy to? Your Name
# ? Link to existing project? [y/N] n
# ? What's your project's name? daily-summary-generator
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

## 🌐 方法二: 通过 GitHub 集成部署 (推荐)

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/daily-summary-generator.git
git push -u origin main
```

### 2. 连接 Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入 GitHub 仓库
4. 配置项目设置:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: 留空
   - **Output Directory**: 留空
   - **Install Command**: `npm install`

### 3. 环境变量设置 (可选)
```bash
# 在 Vercel Dashboard 添加环境变量
NODE_ENV=production
JWT_SECRET=your-production-secret-key
```

## ⚙️ 配置文件说明

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "src/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/src/$1"
    }
  ]
}
```

### package.json 脚本
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "echo 'No build step needed'",
    "deploy": "vercel --prod"
  }
}
```

## 🔧 部署后配置

### 1. 域名设置
```bash
# 使用 Vercel CLI
vercel --prod

# 或在 Vercel Dashboard
# Settings → Domains → Add Domain
```

### 2. 自定义域名
1. 在域名提供商添加 DNS 记录:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

2. 在 Vercel 添加域名并验证

### 3. SSL 证书
- ✅ Vercel 自动提供免费 SSL 证书
- ✅ 自动 HTTP 重定向到 HTTPS

## 🧪 部署测试

### 1. 访问应用
```
主要 URL: https://your-app.vercel.app
预览 URL: https://your-app-git-branch.vercel.app
```

### 2. 功能测试清单
- [ ] 页面正常加载
- [ ] 登录功能正常 (admin / 10kmrr1234)
- [ ] 创建日报功能正常
- [ ] 图片导出功能正常
- [ ] 响应式设计适配

### 3. API 测试
```bash
# 健康检查
curl https://your-app.vercel.app/api/health

# 登录测试
curl -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"10kmrr1234"}'
```

## 🔄 更新部署

### 自动部署 (推荐)
```bash
git add .
git commit -m "Update feature"
git push origin main
# Vercel 会自动触发部署
```

### 手动部署
```bash
vercel --prod
```

## 📊 监控和分析

### Vercel Dashboard
- **Usage**: 访问量、带宽使用
- **Functions**: Serverless 函数执行情况
- **Logs**: 错误日志和调试信息
- **Settings**: 项目配置管理

### 性能监控
- **Core Web Vitals**: 页面性能指标
- **Bundle Analysis**: 资源大小分析
- **Uptime Monitoring**: 服务可用性监控

## ⚠️ 注意事项

### 1. 数据持久化
- ⚠️ **内存存储**: Vercel 重启后数据会丢失
- 💡 **解决方案**:
  - 添加定期导出功能
  - 集成外部数据库 (Supabase/Firebase)
  - 使用 Vercel KV (付费)

### 2. 文件上传限制
- **Vercel Serverless**: 最大 4.5MB 请求体
- **图片大小**: 建议限制在 2MB 以内
- **超时设置**: 函数最大执行时间 10 秒

### 3. 免费额度限制
- **带宽**: 100GB/月
- **Serverless 执行**: 100小时/月
- **函数调用**: 100,000次/月

## 🆘 故障排除

### 常见问题

**Q: 部署失败 "Function failed"**
```bash
# 检查 server.js 语法
node server.js

# 检查 package.json 依赖
npm install
```

**Q: API 404 错误**
```bash
# 检查 vercel.json 路由配置
# 确认 /api/* 路由正确映射到 server.js
```

**Q: 静态文件 404**
```bash
# 检查文件路径
# 确认 src/ 目录结构正确
```

**Q: 登录失败**
```bash
# 检查 JWT_SECRET 配置
# 查看函数日志获取详细错误
```

### 调试工具
```bash
# 本地测试
npm run dev

# 查看部署日志
vercel logs

# 实时日志
vercel logs --follow
```

## 📈 性能优化建议

### 1. 图片优化
- 使用 WebP 格式
- 实现懒加载
- 压缩上传文件

### 2. 缓存策略
- 静态资源长期缓存
- API 响应适当缓存
- 用户数据本地存储

### 3. Bundle 优化
- 压缩 JavaScript 代码
- 优化 CSS 样式
- 减少外部依赖

---

🎉 **恭喜！您的日报生成器现已成功部署到 Vercel！**

如有问题，请查看 [Vercel 文档](https://vercel.com/docs) 或提交 Issue。