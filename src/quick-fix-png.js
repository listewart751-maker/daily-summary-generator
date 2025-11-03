/**
 * 快速修复PNG生成卡住问题
 * 专门处理长文本和复杂格式
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// 你的测试内容
const testContent = `2025-10-08：

内容总结：

总结核心策略
好的，这是对最新一段聊天内容的总结。
这段内容堪称是整个"围观群"项目的开篇宣言和方法论总纲。两位核心主理人"星城"和"超哥"（stewart🤔）系统性地阐述了项目的背景、目标、具体计划以及核心打法，信息量非常大。

一、 项目宏观愿景与背景介绍 (由"星城"主讲)

1. 自我定位：明确表示自己是AI出海领域的新人，但核心优势是**"搞流量"**。他用新建的公众号能在短期内吸引付费成员这件事，来证明自己从公域获取新流量的能力。
2. 核心动机：分享了一张海外AI产品月入百万美金的截图，强调AI出海赛道拥有极高的天花板。项目的目标是，即便只做到顶尖水平的十分之一，也是非常可观的收入。
3. 建群初衷：与"超哥"的交流中获得了巨大启发，希望将这种高质量的私下讨论公开化，让群成员共同受益。这体现了国外开发者流行的**"公开构建 (Building in Public)"**理念，通过外部监督来增强执行动力。

二、 "月入万刀"的具体行动计划
这是一个清晰、可量化的目标拆解，是整个项目的核心路径：

- 执行节奏：每周至少上线2个新网站。
- 广告收入：建立20个以谷歌AdSense为主要变现方式的网站，目标是每个站达到5万月点击量，预估可带来3000-5000美元/月的收入。
- 订阅收入：开发一个AI订阅制网站，以20美元/月的价格，吸引250名用户，实现5000美元/月的收入。
- 总计：通过"广告 + 订阅"的组合拳，实现月入过万美金的目标。

三、 核心方法论：流量优先的MVP (最小可行产品) 策略
"星城"通过三个故事，阐述了他作为"非程序员"进入此领域的核心优势和打法：

1. AI降低了技术门槛：用AI工具10分钟快速建站，说明AI工具正在颠覆传统的开发流程。
2. 市场存在信息差：即使是科班出身的程序员，也未必在使用最高效的AI工具。
3. "空气型产品"思路：先验证需求，再开发产品，流量是第一性原理。

四、 技术赋能与"穷鬼三件套"
1. PM的黄金时代：AI工具让有想法、懂需求但不会写代码的人迎来了最好的时代。
2. "穷鬼三件套"：Claude Code + Vercel + Supabase。
3. 核心理念：现代化的基础设施和AI工具，极大地降低了将想法变为现实的门槛。

五、 实战问答环节
- 流量来源：当前阶段主要靠免费的SEO和外链。
- 找词策略：核心是寻找"供需失衡"的词。
- 外链建设：初期以免费外链为主。
- 新词判断：可以参考KGR值，但没有固定标准，需要在实践中积累经验。`;

async function quickFixTest() {
    console.log('🚀 快速修复PNG生成测试...\n');

    const browser = await chromium.launch({
        headless: true,
        timeout: 60000  // 增加超时时间
    });

    try {
        const page = await browser.newPage();

        // 创建优化的HTML模板 - 解决长文本渲染问题
        const optimizedHTML = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>技术群聊日报</title>
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
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 30px;
                    border-radius: 16px;
                    color: white;
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
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    font-size: 24px;
                    color: #2d3748;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #e2e8f0;
                }

                h2 {
                    font-size: 20px;
                    color: #4a5568;
                    margin: 25px 0 15px 0;
                    padding-left: 15px;
                    border-left: 4px solid #667eea;
                }

                h3 {
                    font-size: 18px;
                    color: #718096;
                    margin: 20px 0 10px 0;
                }

                p {
                    margin-bottom: 15px;
                    color: #2d3748;
                }

                strong, b {
                    color: #667eea;
                    font-weight: 600;
                }

                ul {
                    margin: 15px 0;
                    padding-left: 20px;
                }

                li {
                    margin-bottom: 8px;
                    color: #4a5568;
                }

                .highlight {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #f59e0b;
                }

                .section {
                    margin: 30px 0;
                    padding: 20px;
                    background: #f7fafc;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">🔥 AI出海实战围观群</div>
                <div class="date">每日技术总结 • ${new Date().toLocaleDateString()}</div>
            </div>

            <div class="content">
                <h1>📋 核心策略总结</h1>
                ${testContent.split('\n').map(line => {
                    if (line.trim() === '') return '';
                    if (line.includes('：')) {
                        return `<h2>${line}</h2>`;
                    }
                    if (line.match(/^\d+\./)) {
                        return `<h3>${line}</h3>`;
                    }
                    if (line.includes('**')) {
                        return `<p><strong>${line.replace(/\*\*/g, '')}</strong></p>`;
                    }
                    if (line.startsWith('- ')) {
                        return `<li>${line.substring(2)}</li>`;
                    }
                    return `<p>${line}</p>`;
                }).join('')}
            </div>
        </body>
        </html>`;

        // 保存HTML文件
        const htmlPath = '../output/quick-fix-test.html';
        fs.writeFileSync(htmlPath, optimizedHTML);
        console.log('✅ 优化HTML创建成功');

        // 加载页面
        console.log('🔄 加载页面...');
        await page.goto(`file://${path.resolve(htmlPath)}`, {
            timeout: 30000,
            waitUntil: 'networkidle'
        });

        // 等待字体和内容渲染
        console.log('⏳ 等待内容渲染...');
        await page.waitForTimeout(3000);

        // 测试截图
        const platforms = {
            xiaohongshu: { width: 1080, height: 1440 },
            jike: { width: 1080, height: 1080 }
        };

        console.log('📸 开始生成优化截图...');

        for (const [platform, dimensions] of Object.entries(platforms)) {
            const startTime = Date.now();

            console.log(`📸 生成 ${platform} 截图 (${dimensions.width}x${dimensions.height})...`);

            await page.setViewportSize({
                width: dimensions.width,
                height: dimensions.height
            });

            const contentHeight = await page.evaluate(() => {
                return document.body.scrollHeight;
            });

            if (contentHeight > dimensions.height) {
                await page.setViewportSize({
                    width: dimensions.width,
                    height: Math.min(contentHeight, 5000) // 限制高度避免过大
                });
            }

            const screenshotPath = `../output/quick-fix-${platform}.png`;

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

        console.log('\n🎉 快速修复测试完成！');
        console.log('📁 输出文件在 ../output/ 目录');

    } catch (error) {
        console.error('❌ 修复测试失败:', error);
        console.error('错误详情:', error.stack);
    } finally {
        await browser.close();
    }
}

// 运行修复测试
(async () => {
    await quickFixTest();
    process.exit(0);
})();