/**
 * 每日技术群聊总结自动化生成工具
 * 功能：Markdown → HTML → 多平台截图
 * 作者：Claude Code
 * 日期：2025.10.17
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const QRCode = require('qrcode');

// 配置参数
const CONFIG = {
    // 输入路径
    inputDir: '../summary',
    // 输出路径
    outputDir: '../output',
    // 模板路径
    templatePath: '../templates/daily-summary-template.html',
    // 社交媒体尺寸配置
    platforms: {
        xiaohongshu: { width: 1080, height: 1440 }, // 3:4 比例
        wechat: { width: 1080, height: 1920 },      // 9:16 比例
        jike: { width: 1080, height: 1080 },         // 1:1 正方形
        twitter: { width: 1200, height: 675 }       // 16:9 比例
    }
};

/**
 * 智能解析Markdown文件 - 自动识别任意层级结构
 * 不依赖固定格式，根据缩进和列表标记动态构建层级
 */
function parseMarkdownContent(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // 提取日期
    const dateMatch = content.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

    // 构建文档树结构
    const topics = [];
    const stack = []; // 层级栈，用于追踪当前所在的嵌套层级

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 跳过空行和"内容总结："这种纯标题
        if (!trimmed || trimmed === '内容总结：') continue;

        // 计算缩进级别（用于判断层级关系）
        const indent = line.search(/\S/);
        const spaces = indent === -1 ? 0 : indent;

        // 识别各种列表和标题模式
        const patterns = {
            // 中文章节: "一、 二、 三、"
            chineseSection: /^[一二三四五六七八九十]+、\s*(.+)$/,
            // 数字列表: "1. 2. 3." 或 "1\. 2\. 3\."
            numberedList: /^(\d+)[\.\\]\s+(.+)$/,
            // 短横线列表: "- 内容"
            dashedList: /^-\s+(.+)$/,
            // HTML实体列表: "&nbsp; - 内容"
            htmlList: /^&nbsp;\s*-\s*(.+)$/,
        };

        let matched = false;
        let itemText = trimmed;
        let itemType = 'paragraph';

        // 检测是哪种模式
        if (patterns.chineseSection.test(trimmed)) {
            const match = trimmed.match(patterns.chineseSection);
            itemText = match[1];
            itemType = 'chinese-section';
            matched = true;
        } else if (patterns.numberedList.test(trimmed)) {
            const match = trimmed.match(patterns.numberedList);
            itemText = match[2];
            itemType = 'numbered';
            matched = true;
        } else if (patterns.htmlList.test(trimmed)) {
            const match = trimmed.match(patterns.htmlList);
            itemText = match[1];
            itemType = 'list';
            matched = true;
        } else if (patterns.dashedList.test(trimmed) && spaces >= 2) {
            const match = trimmed.match(patterns.dashedList);
            itemText = match[1];
            itemType = 'list';
            matched = true;
        }

        // 处理冒号分隔的"标题：内容"格式
        let title = itemText;
        let contentText = '';
        const colonMatch = itemText.match(/^(.+?)[：:]\s*(.*)$/);
        if (colonMatch) {
            title = colonMatch[1].trim();
            contentText = colonMatch[2].trim();
        }

        // 根据缩进和类型决定层级关系
        if (itemType === 'numbered' || itemType === 'chinese-section') {
            // 这是一个主题（topic）
            const topic = {
                title: title,
                sections: contentText ? [{title: '简介', content: [contentText]}] : []
            };
            topics.push(topic);
            stack.length = 0;
            stack.push(topic);
        } else if (itemType === 'list') {
            // 根据缩进决定添加到哪个层级
            // 找到最顶层的topic
            const rootTopic = stack.find(item => item.sections !== undefined && !item.title.match(/[:：]/));

            if (rootTopic) {
                const section = {
                    title: title,
                    content: contentText ? [contentText] : []
                };

                if (!rootTopic.sections) rootTopic.sections = [];

                // 如果缩进较深（>=4空格），尝试添加到上一个section的content
                if (spaces >= 4 && rootTopic.sections.length > 0) {
                    const lastSection = rootTopic.sections[rootTopic.sections.length - 1];
                    // 格式化为子项
                    const subItemText = `- ${title}${contentText ? ': ' + contentText : ''}`;
                    lastSection.content.push(subItemText);
                } else {
                    // 否则作为新section
                    rootTopic.sections.push(section);
                }
            }
        } else if (itemType === 'paragraph' && stack.length > 0) {
            // 这是普通段落，添加到最近的容器
            const container = stack[stack.length - 1];
            if (container.sections && container.sections.length > 0) {
                // 添加到最后一个section的content
                const lastSection = container.sections[container.sections.length - 1];
                lastSection.content.push(trimmed);
            } else {
                // 添加为新的默认section
                if (!container.sections) container.sections = [];
                container.sections.push({
                    title: '内容',
                    content: [trimmed]
                });
            }
        }
    }

    return { date, topics };
}

/**
 * 生成二维码
 */
async function generateQRCode(text, outputPath) {
    try {
        await QRCode.toFile(outputPath, text, {
            width: 128,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        console.log(`✅ 二维码生成成功: ${outputPath}`);
        return true;
    } catch (error) {
        console.error(`❌ 二维码生成失败:`, error);
        return false;
    }
}

/**
 * 生成HTML内容
 */
function generateHTML(data, templatePath) {
    const template = fs.readFileSync(templatePath, 'utf8');

    // 解析模板
    let html = template;

    // 替换日期
    html = html.replace(/2025年10月15日/g, formatDate(data.date));
    html = html.replace(/2025\.10\.15/g, data.date);

    // 生成议题HTML
    const topicsHTML = data.topics.map((topic, index) => {
        const icons = [
            { color: 'blue', svg: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }, // 搜索
            { color: 'purple', svg: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }, // 代码
            { color: 'red', svg: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }, // 安全
            { color: 'orange', svg: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' } // 密钥
        ];

        const icon = icons[index % icons.length];

        let topicHTML = `
                <div class="topic-card">
                    <div class="topic-header">
                        <div class="topic-icon icon-${icon.color}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <path d="${icon.svg}"/>
                            </svg>
                        </div>
                        <h2 class="topic-title">${topic.title}</h2>
                    </div>
        `;

        // 添加各个部分的内容
        if (topic.sections && topic.sections.length > 0) {
            topic.sections.forEach(section => {
                const sectionType = getSectionType(section.title);
                const sectionHTML = generateSectionHTML(section, sectionType);
                topicHTML += sectionHTML;
            });
        }

        topicHTML += '</div>';
        return topicHTML;
    }).join('\n                ');

    // 替换议题内容
    html = html.replace('<!-- TOPICS_PLACEHOLDER -->', topicsHTML);

    // 更新统计信息
    html = html.replace('4个核心议题', `${data.topics.length}个核心议题`);
    html = html.replace('4', `${data.topics.length}`);

    return html;
}

/**
 * 判断部分类型并返回对应样式
 */
function getSectionType(title) {
    if (title.includes('问题') || title.includes('风险')) return 'warning';
    if (title.includes('方法') || title.includes('解决方案')) return 'solution';
    if (title.includes('讨论')) return 'discussion';
    if (title.includes('防范措施') || title.includes('最佳实践')) return 'practice';
    return 'default';
}

/**
 * 生成部分HTML
 */
function generateSectionHTML(section, type) {
    const colors = {
        warning: { bg: 'red', text: 'red' },
        solution: { bg: 'green', text: 'green' },
        discussion: { bg: 'blue', text: 'blue' },
        practice: { bg: 'purple', text: 'purple' },
        default: { bg: 'gray', text: 'gray' }
    };

    const color = colors[type] || colors.default;
    const content = section.content.join(' ').replace(/&nbsp;/g, '');

    return `
                <div class="bg-${color.bg}-50 border-l-4 border-${color.bg}-500 p-4 rounded">
                    <h3 class="font-medium text-${color.text}-900 mb-1">${section.title}</h3>
                    <p class="text-${color.text}-700">${content}</p>
                </div>
    `;
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

/**
 * 截图功能
 */
async function takeScreenshots(htmlPath, outputDir, date) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // 加载HTML文件
        const fileUrl = `file://${path.resolve(htmlPath)}`;
        await page.goto(fileUrl);

        // 等待页面加载完成
        await page.waitForLoadState('networkidle');

        // 等待字体加载
        await page.waitForTimeout(2000);

        // 为每个平台生成截图
        for (const [platform, dimensions] of Object.entries(CONFIG.platforms)) {
            // 设置视口
            await page.setViewportSize({
                width: dimensions.width,
                height: dimensions.height
            });

            // 如果内容高度超过视口，需要滚动加载
            const contentHeight = await page.evaluate(() => {
                return document.body.scrollHeight;
            });

            if (contentHeight > dimensions.height) {
                // 创建完整截图
                await page.setViewportSize({
                    width: dimensions.width,
                    height: contentHeight
                });
            }

            // 截图
            const screenshotPath = path.join(outputDir, `${date}-${platform}.png`);
            await page.screenshot({
                path: screenshotPath,
                fullPage: true,
                type: 'png'
            });

            console.log(`✅ ${platform} 截图生成成功: ${screenshotPath}`);
        }

    } catch (error) {
        console.error('❌ 截图生成失败:', error);
    } finally {
        await browser.close();
    }
}

/**
 * 主函数
 */
async function main() {
    try {
        console.log('🚀 开始生成每日技术群聊总结...');

        // 创建输出目录
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }

        // 查找最新的Markdown文件
        const files = fs.readdirSync(CONFIG.inputDir)
            .filter(file => file.endsWith('.md'))
            .sort()
            .reverse();

        if (files.length === 0) {
            console.log('❌ 未找到Markdown文件');
            return;
        }

        const latestFile = files[0];
        const filePath = path.join(CONFIG.inputDir, latestFile);
        const date = latestFile.replace('.md', '');

        console.log(`📖 处理文件: ${latestFile}`);

        // 1. 解析Markdown内容
        const data = parseMarkdownContent(filePath);
        console.log(`✅ 解析完成: ${data.topics.length}个议题`);

        // 2. 生成二维码
        const qrPath = path.join(CONFIG.outputDir, `${date}-qrcode.png`);
        await generateQRCode('https://your-group-link.com', qrPath);

        // 3. 生成HTML
        const html = generateHTML(data, CONFIG.templatePath);
        const htmlPath = path.join(CONFIG.outputDir, `${date}-summary.html`);
        fs.writeFileSync(htmlPath, html);
        console.log(`✅ HTML生成成功: ${htmlPath}`);

        // 4. 生成截图
        console.log('📸 开始生成截图...');
        await takeScreenshots(htmlPath, CONFIG.outputDir, date);

        console.log('🎉 全部完成！');
        console.log(`📁 输出目录: ${CONFIG.outputDir}`);

    } catch (error) {
        console.error('❌ 处理失败:', error);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    parseMarkdownContent,
    generateHTML,
    takeScreenshots,
    main
};