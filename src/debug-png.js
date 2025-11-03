/**
 * PNG生成调试脚本
 * 用于诊断PNG导出卡住问题
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// 配置参数
const CONFIG = {
    inputDir: '../summary',
    outputDir: '../output',
    platforms: {
        xiaohongshu: { width: 1080, height: 1440 },
        wechat: { width: 1080, height: 1920 },
        jike: { width: 1080, height: 1080 },
        twitter: { width: 1200, height: 675 }
    }
};

console.log('🔍 开始PNG生成调试...\n');

async function debugPNGGeneration() {
    console.log('📊 环境信息:');
    console.log(`- Node.js版本: ${process.version}`);
    console.log(`- 工作目录: ${process.cwd()}`);
    console.log(`- 输入目录: ${CONFIG.inputDir}`);
    console.log(`- 输出目录: ${CONFIG.outputDir}`);

    // 1. 检查输入文件
    console.log('\n📁 检查输入文件:');
    try {
        const files = fs.readdirSync(CONFIG.inputDir).filter(f => f.endsWith('.md'));
        console.log(`✅ 找到 ${files.length} 个Markdown文件: ${files.join(', ')}`);

        if (files.length === 0) {
            console.log('❌ 没有找到Markdown文件！');
            return;
        }

        // 使用第一个文件进行测试
        const testFile = files[0];
        const testFilePath = path.join(CONFIG.inputDir, testFile);
        console.log(`📄 使用测试文件: ${testFilePath}`);

        // 2. 测试浏览器启动
        console.log('\n🌐 测试浏览器启动:');
        const startTime = Date.now();

        console.log('🔄 启动Chromium浏览器...');
        const browser = await chromium.launch({
            headless: true,
            timeout: 30000
        });

        const browserLaunchTime = Date.now() - startTime;
        console.log(`✅ 浏览器启动成功，耗时: ${browserLaunchTime}ms`);

        // 3. 测试页面创建
        console.log('\n📄 测试页面创建:');
        const page = await browser.newPage();
        console.log('✅ 页面创建成功');

        // 4. 测试简单内容截图
        console.log('\n📸 测试简单内容截图:');
        const simpleHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: rgba(255,255,255,0.1);
                    padding: 30px;
                    border-radius: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🧪 PNG生成测试</h1>
                <p>当前时间: ${new Date().toLocaleString()}</p>
                <p>浏览器启动耗时: ${browserLaunchTime}ms</p>
                <p>测试分辨率列表:</p>
                <ul>
                    ${Object.entries(CONFIG.platforms).map(([name, size]) =>
                        `<li>${name}: ${size.width}x${size.height}</li>`
                    ).join('')}
                </ul>
            </div>
        </body>
        </html>`;

        // 创建临时HTML文件
        const tempHTMLPath = path.join(CONFIG.outputDir, 'debug-test.html');
        fs.writeFileSync(tempHTMLPath, simpleHTML);
        console.log(`✅ 临时HTML创建: ${tempHTMLPath}`);

        // 加载页面
        const fileUrl = `file://${path.resolve(tempHTMLPath)}`;
        console.log('🔄 加载页面...');
        await page.goto(fileUrl);

        // 等待加载
        console.log('⏳ 等待页面加载完成...');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        console.log('✅ 页面加载完成');

        // 5. 测试不同分辨率截图
        console.log('\n🎯 测试多分辨率截图:');

        for (const [platform, dimensions] of Object.entries(CONFIG.platforms)) {
            const screenshotStartTime = Date.now();

            console.log(`📸 开始生成 ${platform} 截图 (${dimensions.width}x${dimensions.height})...`);

            // 设置视口
            await page.setViewportSize({
                width: dimensions.width,
                height: dimensions.height
            });

            // 检查内容高度
            const contentHeight = await page.evaluate(() => {
                return document.body.scrollHeight;
            });

            console.log(`   📏 内容高度: ${contentHeight}px (视口: ${dimensions.height}px)`);

            if (contentHeight > dimensions.height) {
                // 调整视口高度以容纳全部内容
                await page.setViewportSize({
                    width: dimensions.width,
                    height: contentHeight
                });
                console.log(`   🔄 调整视口高度为: ${contentHeight}px`);
            }

            // 截图
            const screenshotPath = path.join(CONFIG.outputDir, `debug-${platform}.png`);

            try {
                await page.screenshot({
                    path: screenshotPath,
                    fullPage: true,
                    type: 'png'
                });

                const screenshotTime = Date.now() - screenshotStartTime;
                const fileSize = fs.statSync(screenshotPath).size;

                console.log(`   ✅ ${platform} 截图成功，耗时: ${screenshotTime}ms, 文件大小: ${(fileSize/1024).toFixed(1)}KB`);

            } catch (screenshotError) {
                console.log(`   ❌ ${platform} 截图失败: ${screenshotError.message}`);
            }
        }

        // 6. 清理
        console.log('\n🧹 清理资源:');
        await browser.close();
        console.log('✅ 浏览器已关闭');

        // 7. 结果统计
        console.log('\n📋 调试结果统计:');
        const generatedFiles = fs.readdirSync(CONFIG.outputDir)
            .filter(f => f.startsWith('debug-') && f.endsWith('.png'));

        console.log(`✅ 成功生成 ${generatedFiles.length} 个PNG文件: ${generatedFiles.join(', ')}`);

        generatedFiles.forEach(file => {
            const filePath = path.join(CONFIG.outputDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   📄 ${file}: ${(stats.size/1024).toFixed(1)}KB`);
        });

        console.log('\n🎉 PNG生成调试完成！');

    } catch (error) {
        console.error('\n❌ 调试过程出错:', error);
        console.error('错误详情:', error.stack);
    }
}

// 运行调试
(async () => {
    try {
        await debugPNGGeneration();
    } catch (error) {
        console.error('💥 调试脚本执行失败:', error);
    }
    process.exit(0);
})();