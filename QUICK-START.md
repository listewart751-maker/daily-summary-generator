# 🚀 快速开始指南

## 5分钟上手技术群聊日报自动生成器

### 前置要求
- Node.js 16+
- 约5分钟时间

---

## ⚡ 一键启动

### 1️⃣ 安装依赖
```bash
npm install
```

### 2️⃣ 安装浏览器 (首次运行需要)
```bash
npx playwright install
```

### 3️⃣ 创建示例数据 (可选)
```bash
node test.js --sample
```

### 4️⃣ 运行完整流水线
```bash
node full-pipeline.js
```

### 5️⃣ 查看结果
```bash
# 打开输出目录
open output/
# 或者 Windows 用户
start output/
```

---

## 📁 文件准备

### 将你的 Markdown 文件放入 `summary/` 目录

**文件名格式**: `YYYY-MM-DD.md`

**内容格式**:
```markdown
2025-10-17

内容总结：

这段聊天记录包含了四个主要议题：

1\. 议题标题：

&nbsp; - 子标题: 具体内容描述

&nbsp; - 更多内容...
```

---

## 🎯 核心脚本说明

| 脚本 | 功能 | 使用场景 |
|------|------|----------|
| `full-pipeline.js` | 🔄 完整流水线 | **推荐日常使用** |
| `generate-daily-summary.js` | 📄 生成HTML+图片 | 仅需基础图片 |
| `social-optimizer.js` | 📱 社交媒体优化 | 需要平台适配 |
| `test.js` | 🧪 系统测试 | 验证环境 |

---

## 📊 输出结果

运行完成后，`output/` 目录会包含：

```
output/
├── 2025-10-17-summary.html          # 网页版总结
├── 2025-10-17-xiaohongshu.png       # 小红书图片 (1080×1440)
├── 2025-10-17-wechat.png            # 朋友圈图片 (1080×1920)
├── 2025-10-17-jike.png              # 即刻图片 (1080×1080)
├── 2025-10-17-twitter.png           # Twitter图片 (1200×675)
├── 2025-10-17-qrcode.png            # 二维码
├── social-packages/                  # 社交媒体发布包
│   └── 2025-10-17/
│       ├── xiaohongshu/
│       │   ├── caption.txt          # 推荐文案
│       │   ├── publishing-guide.md  # 发布指南
│       │   └── *-watermarked.png   # 带水印图片
│       ├── wechat/
│       ├── jike/
│       └── twitter/
├── README.md                         # 生成报告
└── execution-report.json            # 执行详情
```

---

## 🎨 自定义配置

### 修改二维码链接
编辑 `generate-daily-summary.js` 第95行：
```javascript
await generateQRCode('https://your-group-link.com', qrPath);
```

### 调整平台尺寸
编辑 `generate-daily-summary.js` 第12-20行：
```javascript
platforms: {
    custom_platform: { width: 1080, height: 1080 }
}
```

### 修改样式主题
编辑 `daily-summary-template.html` 中的CSS变量：
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #7c3aed;
}
```

---

## 🐛 常见问题解决

### ❌ "缺少依赖文件"
```bash
npm install
```

### ❌ "Playwright 浏览器下载失败"
```bash
# 手动安装
npx playwright install chromium
```

### ❌ "截图空白"
1. 检查 Markdown 格式是否正确
2. 确认 `daily-summary-template.html` 存在
3. 查看控制台错误信息

### ❌ "中文显示异常"
- 确保 HTML 模板设置了正确的字符编码
- 检查系统是否安装了中文字体

---

## 💡 使用技巧

### 📈 提升引流效果
1. **定时发布**: 选择目标用户活跃时间
2. **文案优化**: 使用吸引人的标题和emoji
3. **互动引导**: 在文案中加入提问或行动召唤
4. **持续更新**: 保持每日发布的频率

### 🔄 批量处理多天数据
```bash
# 处理多个文件
for file in summary/*.md; do
    cp "$file" summary/temp.md
    node full-pipeline.js
done
```

### 📱 移动端优化
- 生成的图片已针对移动端优化
- 建议在手机上预览效果后再发布

---

## 🎯 下一步扩展

1. **自动发布**: 集成各平台API实现自动发布
2. **数据分析**: 添加流量统计和分析功能
3. **模板定制**: 创建更多视觉风格模板
4. **内容优化**: AI辅助生成吸引人的文案

---

## 📞 获取帮助

如果遇到问题：

1. 🧪 运行测试: `node test.js`
2. 📋 查看详细文档: `README.md`
3. 🔧 检查错误信息: 控制台输出
4. 💬 社区求助: 技术交流群

---

**🎉 开始你的技术分享之旅吧！**

记住：内容质量 > 发布频率，真诚分享是最好的引流方式。