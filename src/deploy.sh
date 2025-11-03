#!/bin/bash

# 技术群聊日报管理器 - Vercel 部署脚本
# 使用方法: ./deploy.sh

echo "🚀 技术群聊日报管理器 - Vercel 自动部署"
echo "=========================================="

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装，正在安装..."
    npm i -g vercel
fi

# 检查是否已登录 Vercel
echo "🔍 检查 Vercel 登录状态..."
if ! vercel whoami &> /dev/null; then
    echo "📝 请先登录 Vercel:"
    vercel login
fi

# 进入项目目录
echo "📁 进入项目目录..."
cd "$(dirname "$0")"

# 显示当前项目信息
echo "📋 项目信息:"
echo "• 目录: $(pwd)"
echo "• 主要文件: index.html, app.js, vercel.json"
echo ""

# 开始部署
echo "🚀 开始部署到 Vercel..."
echo "注意: 部署过程中可能需要您确认项目设置"
echo ""

# 执行部署
vercel --prod

# 检查部署结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 部署成功！"
    echo ""
    echo "🎯 部署信息:"
    echo "• 项目类型: Static HTML"
    echo "• 构建命令: 无需构建"
    echo "• 输出目录: 当前目录"
    echo ""
    echo "📱 应用功能:"
    echo "• ✅ 两栏布局（历史+预览）"
    echo "• ✅ 创建/编辑/删除日报"
    echo "• ✅ 7种中文字体选择"
    echo "• ✅ 自定义二维码上传"
    echo "• ✅ 4平台PNG导出"
    echo "• ✅ 响应式设计"
    echo "• ✅ 本地数据存储"
    echo ""
    echo "🔗 访问地址: https://daily-report-manager.vercel.app"
    echo ""
    echo "📖 使用说明: 查看 README-WEBAPP.md"
else
    echo ""
    echo "❌ 部署失败，请检查错误信息"
    echo ""
    echo "🔧 常见解决方案:"
    echo "1. 检查网络连接"
    echo "2. 确认 Vercel 账号状态"
    echo "3. 检查 vercel.json 配置"
    echo "4. 手动部署: 访问 vercel.com 上传项目"
fi

echo ""
echo "🎉 技术群聊日报管理器部署完成！"