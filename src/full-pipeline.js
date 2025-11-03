#!/usr/bin/env node

/**
 * 完整的自动化流水线脚本
 * 从 Markdown 到社交媒体发布包的一站式解决方案
 */

const fs = require('fs');
const path = require('path');
const { main: generateMain } = require('./generate-daily-summary');
const { generateSocialPackage } = require('./social-optimizer');

/**
 * 显示欢迎信息
 */
function showWelcome() {
    console.log('🚀 技术群聊日报全自动生成器');
    console.log('📊 功能: Markdown → HTML → 多平台图片 → 社交媒体包');
    console.log('⚡ 支持平台: 小红书、朋友圈、即刻、Twitter');
    console.log('='.repeat(60));
}

/**
 * 环境检查
 */
function checkEnvironment() {
    console.log('🔍 检查运行环境...');

    const requiredDirs = ['../summary', '../output'];
    const requiredFiles = [
        '../templates/daily-summary-template.html',
        './generate-daily-summary.js',
        './social-optimizer.js'
    ];

    // 检查目录
    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ 创建目录: ${dir}`);
        }
    }

    // 检查文件
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
        console.error('❌ 缺少必要文件:');
        missingFiles.forEach(file => console.error(`   - ${file}`));
        return false;
    }

    // 检查 markdown 文件
    const markdownFiles = fs.readdirSync('../summary')
        .filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
        console.log('❌ summary 目录中没有找到 .md 文件');
        console.log('💡 请将你的群聊总结 markdown 文件放入 summary/ 目录中');
        return false;
    }

    console.log(`✅ 找到 ${markdownFiles.length} 个 markdown 文件`);
    console.log('📋 文件列表:');
    markdownFiles.forEach(file => console.log(`   - ${file}`));

    return true;
}

/**
 * 显示进度
 */
function showProgress(step, total, message) {
    const percentage = Math.round((step / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    console.log(`\r[${bar}] ${percentage}% | ${message}`);
}

/**
 * 主流水线
 */
async function runPipeline() {
    showWelcome();

    if (!checkEnvironment()) {
        console.log('\n❌ 环境检查失败，请修复后重试');
        process.exit(1);
    }

    try {
        console.log('\n🎯 开始执行完整流水线...\n');

        // 步骤 1: 生成基础内容
        showProgress(1, 4, '解析 Markdown 并生成 HTML');
        await generateMain();
        await sleep(1000);

        // 步骤 2: 生成社交媒体包
        showProgress(2, 4, '生成社交媒体适配包');

        // 获取最新日期
        const outputFiles = fs.readdirSync('../output')
            .filter(file => file.includes('-summary.html'))
            .sort()
            .reverse();

        if (outputFiles.length > 0) {
            const date = outputFiles[0].replace('-summary.html', '');
            const topics = [
                { title: '关键词策略' },
                { title: '网站开发模板' },
                { title: '安全防护' },
                { title: 'API密钥安全' }
            ];

            await generateSocialPackage(date, topics);
        }
        await sleep(1000);

        // 步骤 3: 生成统计报告
        showProgress(3, 4, '生成执行报告');
        await generateReport();
        await sleep(1000);

        // 步骤 4: 完成
        showProgress(4, 4, '流水线执行完成');
        await sleep(500);

        console.log('\n🎉 流水线执行成功！');
        displayResults();

    } catch (error) {
        console.error('\n❌ 流水线执行失败:', error.message);
        console.log('\n🔧 故障排除:');
        console.log('1. 检查 markdown 文件格式是否正确');
        console.log('2. 确认所有依赖已安装 (npm install)');
        console.log('3. 查看 error message 中的具体错误信息');
        process.exit(1);
    }
}

/**
 * 生成执行报告
 */
async function generateReport() {
    const outputDir = '../output';
    const files = fs.readdirSync(outputDir);

    const report = {
        timestamp: new Date().toISOString(),
        files: {
            html: files.filter(f => f.endsWith('.html')).length,
            images: files.filter(f => f.endsWith('.png')).length,
            total: files.length
        },
        platforms: {}
    };

    // 统计各平台文件
    const platforms = ['xiaohongshu', 'wechat', 'jike', 'twitter'];
    platforms.forEach(platform => {
        report.platforms[platform] = files.filter(f => f.includes(platform)).length;
    });

    // 保存报告
    const reportPath = path.join(outputDir, 'execution-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // 生成人类可读的报告
    const readableReport = `
# 执行报告

**执行时间**: ${new Date().toLocaleString('zh-CN')}

## 文件统计
- HTML 文件: ${report.files.html} 个
- 图片文件: ${report.files.images} 个
- 总计: ${report.files.total} 个

## 平台分布
${Object.entries(report.platforms).map(([platform, count]) =>
    `- ${platform}: ${count} 个文件`
).join('\n')}

## 输出目录结构
\`\`\`
output/
├── *.html                     # HTML 模板文件
├── *-xiaohongshu.png         # 小红书图片
├── *-wechat.png               # 朋友圈图片
├── *-jike.png                 # 即刻图片
├── *-twitter.png              # Twitter 图片
├── *-qrcode.png               # 二维码
├── social-packages/           # 社交媒体包
│   └── [日期]/
│       ├── xiaohongshu/
│       ├── wechat/
│       ├── jike/
│       └── twitter/
└── execution-report.json      # 本报告
\`\`\`

## 下一步
1. 查看 \`output/\` 目录下的生成文件
2. 进入 \`output/social-packages/[日期]/\` 获取各平台发布包
3. 根据各平台的 \`publishing-guide.md\` 进行发布

---
由技术群聊日报自动生成器生成
`;

    const readableReportPath = path.join(outputDir, 'README.md');
    fs.writeFileSync(readableReportPath, readableReport);

    console.log('✅ 报告生成完成');
}

/**
 * 显示结果
 */
function displayResults() {
    const outputDir = '../output';
    const files = fs.readdirSync(outputDir);

    console.log('\n📊 生成结果统计:');
    console.log(`📁 总文件数: ${files.length} 个`);

    const htmlFiles = files.filter(f => f.endsWith('.html'));
    const imageFiles = files.filter(f => f.endsWith('.png'));

    console.log(`📄 HTML 文件: ${htmlFiles.length} 个`);
    console.log(`🖼️  图片文件: ${imageFiles.length} 个`);

    // 检查是否有社交媒体包
    const socialDir = path.join(outputDir, 'social-packages');
    if (fs.existsSync(socialDir)) {
        const dates = fs.readdirSync(socialDir);
        if (dates.length > 0) {
            const latestDate = dates.sort().pop();
            const platforms = fs.readdirSync(path.join(socialDir, latestDate));
            console.log(`📱 社交媒体包: ${platforms.length} 个平台`);
        }
    }

    console.log('\n🎯 快速导航:');
    console.log(`📁 输出目录: ${path.resolve(outputDir)}`);
    console.log(`📋 查看报告: ${path.join(outputDir, 'README.md')}`);

    // 提供下一步建议
    console.log('\n💡 下一步操作:');
    console.log('1. 查看生成的图片效果');
    console.log('2. 进入社交媒体包目录获取发布素材');
    console.log('3. 根据发布指南在各平台发布内容');
    console.log('4. 监测数据反馈，持续优化');

    console.log('\n✨ 祝你引流成功！');
}

/**
 * 工具函数: 延迟
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 错误处理
 */
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的 Promise 拒绝:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});

// 如果直接运行此脚本
if (require.main === module) {
    runPipeline();
}

module.exports = {
    runPipeline,
    checkEnvironment,
    generateReport
};