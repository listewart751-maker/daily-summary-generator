/**
 * PNG生成压力测试
 * 模拟各种可能导致卡住的场景
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const CONFIG = {
    outputDir: '../output',
    platforms: {
        xiaohongshu: { width: 1080, height: 1440 },
        wechat: { width: 1080, height: 1920 },
        jike: { width: 1080, height: 1080 },
        twitter: { width: 1200, height: 675 }
    }
};

async function createLargeContent() {
    // 创建大量内容来模拟复杂页面
    let content = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>压力测试页面</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                line-height: 1.6;
            }
            .topic-card {
                background: rgba(255,255,255,0.1);
                padding: 20px;
                margin: 20px 0;
                border-radius: 10px;
                border-left: 4px solid #10b981;
            }
            .topic-header {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #fbbf24;
            }
            .section {
                background: rgba(255,255,255,0.05);
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
            }
            img {
                max-width: 100%;
                height: auto;
                border-radius: 5px;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <h1>🧪 PNG生成压力测试</h1>
        <p>测试时间: ${new Date().toLocaleString()}</p>
        <p>这个页面包含大量内容用于测试PNG生成的稳定性</p>`;

    // 生成大量内容
    for (let i = 1; i <= 50; i++) {
        content += `
        <div class="topic-card">
            <div class="topic-header">🔥 主题 ${i}: 复杂内容测试</div>
            <div class="section">
                <h3>📝 详细说明 ${i}</h3>
                <p>这是第${i}个测试主题，包含大量文字内容和复杂结构。Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                <p>更多测试内容：${'测试内容 '.repeat(20)}</p>
                <ul>
                    ${Array.from({length: 10}, (_, j) => `<li>测试项目 ${i}-${j}: ${'详细描述 '.repeat(5)}</li>`).join('')}
                </ul>
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <strong>💡 关键要点 ${i}:</strong> ${'这是要点说明 '.repeat(10)}
                </div>
            </div>
        </div>`;
    }

    content += `
    </body>
    </html>`;

    return content;
}

async function simulateStuckScenarios() {
    console.log('🔥 开始PNG生成压力测试和卡住场景模拟...\n');

    const scenarios = [
        {
            name: '场景1: 超大内容页面',
            html: await createLargeContent(),
            description: '测试大量内容的渲染和截图'
        },
        {
            name: '场景2: 网络资源加载',
            html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>网络资源测试</title></head>
            <body>
                <h1>网络资源加载测试</h1>
                <img src="https://via.placeholder.com/1000x300/ff0000/ffffff?text=Test+Image+1" alt="测试图片1" />
                <img src="https://via.placeholder.com/800x200/00ff00/ffffff?text=Test+Image+2" alt="测试图片2" />
                <img src="https://via.placeholder.com/600x400/0000ff/ffffff?text=Test+Image+3" alt="测试图片3" />
                <p>测试时间: ${new Date().toLocaleString()}</p>
            </body>
            </html>`,
            description: '测试网络资源加载可能导致的卡住'
        },
        {
            name: '场景3: JavaScript执行',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>JavaScript测试</title>
            </head>
            <body>
                <h1>JavaScript执行测试</h1>
                <div id="content">正在生成内容...</div>
                <script>
                    // 模拟可能导致卡住的JavaScript
                    setTimeout(() => {
                        let content = '';
                        for(let i = 0; i < 100; i++) {
                            content += '<p>动态生成的内容段落 ' + i + ': ' + '这是一段很长的测试内容 '.repeat(10) + '</p>';
                        }
                        document.getElementById('content').innerHTML = content;
                        console.log('内容生成完成');
                    }, 1000);
                </script>
            </body>
            </html>`,
            description: '测试JavaScript执行可能的影响'
        }
    ];

    for (let scenarioIndex = 0; scenarioIndex < scenarios.length; scenarioIndex++) {
        const scenario = scenarios[scenarioIndex];
        console.log(`\n🎯 ${scenario.name}`);
        console.log(`📝 ${scenario.description}`);

        const browser = await chromium.launch({
            headless: true,
            timeout: 30000
        });

        try {
            const page = await browser.newPage();

            // 设置超时时间
            page.setDefaultTimeout(15000);

            // 创建HTML文件
            const htmlPath = path.join(CONFIG.outputDir, `stress-test-${scenarioIndex}.html`);
            fs.writeFileSync(htmlPath, scenario.html);

            console.log('🔄 加载页面...');
            const loadStartTime = Date.now();

            // 设置导航超时
            await page.goto(`file://${path.resolve(htmlPath)}`, {
                timeout: 20000,
                waitUntil: 'networkidle'
            });

            const loadTime = Date.now() - loadStartTime;
            console.log(`✅ 页面加载完成，耗时: ${loadTime}ms`);

            // 等待额外时间确保内容完全渲染
            console.log('⏳ 等待内容渲染...');
            await page.waitForTimeout(3000);

            // 测试截图
            for (const [platform, dimensions] of Object.entries(CONFIG.platforms)) {
                console.log(`📸 生成 ${platform} 截图...`);

                const screenshotStartTime = Date.now();

                try {
                    await page.setViewportSize({
                        width: dimensions.width,
                        height: dimensions.height
                    });

                    // 检查内容高度
                    const contentHeight = await page.evaluate(() => document.body.scrollHeight);

                    if (contentHeight > dimensions.height) {
                        await page.setViewportSize({
                            width: dimensions.width,
                            height: Math.min(contentHeight, 20000) // 限制最大高度
                        });
                    }

                    const screenshotPath = path.join(CONFIG.outputDir, `stress-${scenarioIndex}-${platform}.png`);

                    await page.screenshot({
                        path: screenshotPath,
                        fullPage: true,
                        type: 'png',
                        timeout: 30000
                    });

                    const screenshotTime = Date.now() - screenshotStartTime;
                    const fileSize = fs.statSync(screenshotPath).size;

                    console.log(`   ✅ ${platform} 截图成功，耗时: ${screenshotTime}ms, 大小: ${(fileSize/1024).toFixed(1)}KB`);

                } catch (screenshotError) {
                    console.log(`   ❌ ${platform} 截图失败: ${screenshotError.message}`);
                }
            }

            await page.close();
            console.log(`✅ ${scenario.name} 完成`);

        } catch (scenarioError) {
            console.error(`❌ ${scenario.name} 失败: ${scenarioError.message}`);
        } finally {
            await browser.close();
        }
    }

    console.log('\n📋 压力测试结果统计:');

    const outputFiles = fs.readdirSync(CONFIG.outputDir)
        .filter(f => f.startsWith('stress-') && f.endsWith('.png'));

    console.log(`✅ 总共生成了 ${outputFiles.length} 个PNG文件`);

    // 检查是否有超大文件（可能表示卡住）
    outputFiles.forEach(file => {
        const filePath = path.join(CONFIG.outputDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = stats.size / (1024 * 1024);

        if (sizeMB > 5) {
            console.log(`⚠️  ${file}: ${sizeMB.toFixed(1)}MB (文件过大，可能有问题)`);
        } else {
            console.log(`📄 ${file}: ${(stats.size/1024).toFixed(1)}KB`);
        }
    });

    console.log('\n🎉 压力测试完成！');
}

// 运行压力测试
(async () => {
    try {
        await simulateStuckScenarios();
    } catch (error) {
        console.error('💥 压力测试失败:', error);
    }
    process.exit(0);
})();