/**
 * 修复版每日技术群聊总结生成工具
 * 解决长文本导致PNG生成卡住的问题
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const QRCode = require('qrcode');

const CONFIG = {
    inputDir: '../summary',
    outputDir: '../output',
    templatePath: '../templates/daily-summary-template.html',
    platforms: {
        xiaohongshu: { width: 1080, height: 1440 },
        wechat: { width: 1080, height: 1920 },
        jike: { width: 1080, height: 1080 },
        twitter: { width: 1200, height: 675 }
    }
};

/**
 * 清理和优化文本内容
 */
function cleanAndOptimizeContent(content) {
    return content
        // 移除过多的空行
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // 修复特殊字符
        .replace(/\*\*/g, '')
        .replace(/\*([^*\n]+)\*/g, '$1')
        // 修复中英文混排间距
        .replace(/([a-zA-Z])([\u4e00-\u9fff])/g, '$1 $2')
        .replace(/([\u4e00-\u9fff])([a-zA-Z])/g, '$1 $2')
        // 修复emoji和特殊符号
        .replace(/[^\u0000-\uFFFF]/g, char => {
            const validChars = '🔥📋✅❌🎯🚀📸📁💡🔍⏳🎉';
            return validChars.includes(char) ? char : '';
        })
        .trim();
}

/**
 * 智能解析Markdown文件
 */
function parseMarkdownContent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleanedContent = cleanAndOptimizeContent(content);

    const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

    const topics = [];
    const lines = cleanedContent.split('\n');
    let currentTopic = null;

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) continue;

        // 识别主题标题
        if (trimmed.match(/^[一二三四五六七八九十]、|^\d+\./)) {
            if (currentTopic) {
                topics.push(currentTopic);
            }
            currentTopic = {
                title: trimmed.replace(/[:：]\s*$/, ''),
                sections: []
            };
            continue;
        }

        // 识别子部分
        if (trimmed.match(/^[\-\*\+]|\d+\./)) {
            if (currentTopic) {
                const [title, ...contentParts] = trimmed.split(/[:：]/);
                currentTopic.sections.push({
                    title: title.trim(),
                    content: contentParts.length > 0 ? [contentParts.join(':').trim()] : []
                });
            }
            continue;
        }

        // 添加到当前section内容
        if (currentTopic && trimmed) {
            const lastSection = currentTopic.sections[currentTopic.sections.length - 1];
            if (lastSection) {
                lastSection.content.push(trimmed);
            } else {
                currentTopic.sections.push({
                    title: '内容',
                    content: [trimmed]
                });
            }
        }
    }

    if (currentTopic) {
        topics.push(currentTopic);
    }

    return {
        date,
        topics: topics.length > 0 ? topics : [{
            title: '内容总结',
            sections: [{
                title: '主要内容',
                content: cleanedContent.split('\n').filter(line => line.trim()).slice(0, 10)
            }]
        }]
    };
}

/**
 * 生成优化的HTML
 */
function generateHTML(data) {
    // 简化的HTML模板，避免复杂CSS导致渲染问题
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.date} 技术群聊日报</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #1a202c;
            line-height: 1.6;
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 30px 20px;
        }

        .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .date {
            font-size: 16px;
            opacity: 0.9;
        }

        .content {
            padding: 30px;
        }

        .topic-card {
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }

        .topic-header {
            background: #f7fafc;
            padding: 15px 20px;
            border-bottom: 1px solid #e2e8f0;
        }

        .topic-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 5px;
        }

        .topic-content {
            padding: 20px;
        }

        .section {
            margin-bottom: 15px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }

        .section-title {
            font-size: 16px;
            font-weight: 500;
            color: #4a5568;
            margin-bottom: 8px;
        }

        .section-content {
            font-size: 14px;
            color: #718096;
            line-height: 1.6;
        }

        .footer {
            text-align: center;
            padding: 20px;
            background: #f7fafc;
            color: #718096;
            font-size: 14px;
        }

        /* 限制内容高度，避免页面过长 */
        .section-content {
            max-height: 200px;
            overflow-y: auto;
        }

        /* 强制截图时完整显示 */
        @media print {
            .section-content {
                max-height: none;
                overflow: visible;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🔥 AI出海实战围观群</div>
            <div class="date">每日技术总结 • ${data.date}</div>
        </div>

        <div class="content">
            ${data.topics.map(topic => `
                <div class="topic-card">
                    <div class="topic-header">
                        <div class="topic-title">${topic.title}</div>
                    </div>
                    <div class="topic-content">
                        ${topic.sections.map(section => `
                            <div class="section">
                                <div class="section-title">${section.title}</div>
                                <div class="section-content">
                                    ${section.content.map(content => `<p>${content}</p>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>📱 扫码加入围观群 | 每日更新技术出海实战内容</p>
        </div>
    </div>
</body>
</html>`;

    return html;
}

/**
 * 优化的截图功能
 */
async function takeScreenshots(htmlPath, outputDir, date) {
    console.log('📸 开始生成优化截图...');

    const browser = await chromium.launch({
        headless: true,
        timeout: 60000
    });

    try {
        const page = await browser.newPage();

        // 设置更长的超时时间
        page.setDefaultTimeout(30000);

        // 加载HTML文件
        const fileUrl = `file://${path.resolve(htmlPath)}`;
        console.log('🔄 加载HTML文件...');
        await page.goto(fileUrl, {
            timeout: 30000,
            waitUntil: 'networkidle'
        });

        // 等待页面完全渲染
        console.log('⏳ 等待内容渲染...');
        await page.waitForTimeout(2000);

        // 为每个平台生成截图
        for (const [platform, dimensions] of Object.entries(CONFIG.platforms)) {
            console.log(`📸 生成 ${platform} 截图 (${dimensions.width}x${dimensions.height})...`);

            const startTime = Date.now();

            // 设置视口
            await page.setViewportSize({
                width: dimensions.width,
                height: dimensions.height
            });

            // 检查内容高度
            const contentHeight = await page.evaluate(() => {
                return document.body.scrollHeight;
            });

            console.log(`   📏 内容高度: ${contentHeight}px`);

            if (contentHeight > dimensions.height) {
                // 限制最大高度避免超大文件
                const maxHeight = Math.min(contentHeight, 5000);
                await page.setViewportSize({
                    width: dimensions.width,
                    height: maxHeight
                });
                console.log(`   🔄 调整视口高度为: ${maxHeight}px`);
            }

            // 截图
            const screenshotPath = path.join(outputDir, `${date}-${platform}.png`);

            await page.screenshot({
                path: screenshotPath,
                fullPage: true,
                type: 'png',
                timeout: 30000
            });

            const duration = Date.now() - startTime;
            const fileSize = fs.statSync(screenshotPath).size;

            console.log(`   ✅ ${platform} 截图成功！耗时: ${duration}ms, 大小: ${(fileSize/1024).toFixed(1)}KB`);
        }

    } catch (error) {
        console.error('❌ 截图生成失败:', error);
        throw error;
    } finally {
        await browser.close();
        console.log('🧹 浏览器资源已清理');
    }
}

/**
 * 生成二维码
 */
async function generateQRCode(url, outputPath) {
    try {
        await QRCode.toFile(outputPath, url, {
            width: 150,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        console.log(`✅ 二维码生成成功: ${outputPath}`);
    } catch (error) {
        console.error('❌ 二维码生成失败:', error);
        throw error;
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('🚀 开始生成优化版每日技术群聊总结...');

        // 创建输出目录
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // 获取所有Markdown文件
        const files = fs.readdirSync(CONFIG.inputDir).filter(f => f.endsWith('.md'));

        if (files.length === 0) {
            console.log('❌ 没有找到Markdown文件');
            return;
        }

        // 处理每个文件
        for (const file of files) {
            console.log(`\n📖 处理文件: ${file}`);

            const filePath = path.join(CONFIG.inputDir, file);
            const data = parseMarkdownContent(filePath);

            console.log(`✅ 解析完成: ${data.topics.length}个主题`);

            // 生成二维码
            const qrPath = path.join(CONFIG.outputDir, `${path.basename(file, '.md')}-qrcode.png`);
            await generateQRCode('https://example.com', qrPath);

            // 生成HTML
            const html = generateHTML(data);
            const htmlPath = path.join(CONFIG.outputDir, `${path.basename(file, '.md')}-summary.html`);
            fs.writeFileSync(htmlPath, html);
            console.log(`✅ HTML生成成功: ${htmlPath}`);

            // 生成截图
            await takeScreenshots(htmlPath, CONFIG.outputDir, path.basename(file, '.md'));
        }

        console.log('\n🎉 全部完成！');
        console.log(`📁 输出目录: ${CONFIG.outputDir}`);

    } catch (error) {
        console.error('💥 执行失败:', error);
        process.exit(1);
    }
}

// 运行主函数
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    parseMarkdownContent,
    generateHTML,
    takeScreenshots,
    main
};