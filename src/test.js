#!/usr/bin/env node

/**
 * 测试脚本 - 验证整个系统的功能和兼容性
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

/**
 * 运行完整测试套件
 */
async function runTests() {
    console.log('🧪 开始运行测试套件...');
    console.log('='.repeat(50));

    const testResults = {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
    };

    // 测试 1: 环境检查
    await runTest('环境检查', testEnvironment, testResults);

    // 测试 2: Markdown 解析
    await runTest('Markdown 解析', testMarkdownParsing, testResults);

    // 测试 3: HTML 生成
    await runTest('HTML 生成', testHTMLGeneration, testResults);

    // 测试 4: 图片生成模拟
    await runTest('图片生成模拟', testImageGeneration, testResults);

    // 测试 5: 文件结构
    await runTest('文件结构', testFileStructure, testResults);

    // 显示测试结果
    displayTestResults(testResults);
}

/**
 * 运行单个测试
 */
async function runTest(testName, testFunction, results) {
    results.total++;
    console.log(`\n🔍 测试: ${testName}`);

    try {
        await testFunction();
        results.passed++;
        console.log(`✅ ${testName} - 通过`);
        results.details.push({ name: testName, status: 'PASS' });
    } catch (error) {
        results.failed++;
        console.log(`❌ ${testName} - 失败`);
        console.log(`   错误: ${error.message}`);
        results.details.push({ name: testName, status: 'FAIL', error: error.message });
    }
}

/**
 * 测试环境检查
 */
async function testEnvironment() {
    const requiredFiles = [
        './daily-summary-template.html',
        './generate-daily-summary.js',
        './social-optimizer.js',
        './full-pipeline.js'
    ];

    const requiredDirs = ['../summary', '../output'];

    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            throw new Error(`缺少必要文件: ${file}`);
        }
    }

    for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    console.log('   📁 必要文件和目录检查通过');
}

/**
 * 测试 Markdown 解析
 */
async function testMarkdownParsing() {
    const { parseMarkdownContent } = require('./generate-daily-summary');

    // 创建测试 Markdown 文件
    const testMarkdown = `2025-10-17

测试内容总结：

这段聊天记录包含了两个主要议题：

1\. 测试议题一：

&nbsp; - 问题: 这是一个测试问题吗？

&nbsp; - 方法: 这是测试方法的描述。

2\. 测试议题二：

&nbsp; - 讨论: 这是测试讨论的内容。
`;

    const testFile = '../summary/test-2025-10-17.md';
    fs.writeFileSync(testFile, testMarkdown, 'utf8');

    try {
        const result = parseMarkdownContent(testFile);

        if (result.date !== '2025-10-17') {
            throw new Error('日期解析错误');
        }

        if (result.topics.length !== 2) {
            throw new Error('议题数量解析错误');
        }

        if (result.topics[0].title !== '测试议题一') {
            throw new Error('议题标题解析错误');
        }

        console.log('   📝 Markdown 解析功能正常');

        // 清理测试文件
        fs.unlinkSync(testFile);
    } catch (error) {
        // 清理测试文件
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
        throw error;
    }
}

/**
 * 测试 HTML 生成
 */
async function testHTMLGeneration() {
    const { generateHTML } = require('./generate-daily-summary');

    const testData = {
        date: '2025-10-17',
        topics: [
            {
                title: '测试议题',
                sections: [
                    {
                        title: '测试部分',
                        content: ['这是测试内容']
                    }
                ]
            }
        ]
    };

    const html = generateHTML(testData, './daily-summary-template.html');

    if (!html.includes('2025年10月17日')) {
        throw new Error('日期替换失败');
    }

    if (!html.includes('测试议题')) {
        throw new Error('议题内容插入失败');
    }

    console.log('   🌐 HTML 生成功能正常');
}

/**
 * 测试图片生成（模拟）
 */
async function testImageGeneration() {
    // 这里我们只测试 Playwright 是否能正常启动
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // 测试基本的页面加载
    await page.setContent('<html><body><h1>Test</h1></body></html>');
    const title = await page.textContent('h1');

    if (title !== 'Test') {
        throw new Error('页面内容加载失败');
    }

    await browser.close();
    console.log('   📸 图片生成环境正常');
}

/**
 * 测试文件结构
 */
async function testFileStructure() {
    const expectedFiles = [
        'package.json',
        'README.md',
        'daily-summary-template.html',
        'generate-daily-summary.js',
        'social-optimizer.js',
        'full-pipeline.js',
        'start.js',
        'test.js'
    ];

    for (const file of expectedFiles) {
        if (!fs.existsSync(file)) {
            throw new Error(`缺少文件: ${file}`);
        }
    }

    // 检查 package.json 内容
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDependencies = ['playwright', 'qrcode'];

    for (const dep of requiredDependencies) {
        if (!packageJson.dependencies[dep]) {
            throw new Error(`缺少依赖: ${dep}`);
        }
    }

    console.log('   📦 文件结构和依赖正常');
}

/**
 * 显示测试结果
 */
function displayTestResults(results) {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 测试结果汇总');
    console.log('='.repeat(50));

    console.log(`📊 总计: ${results.total} 个测试`);
    console.log(`✅ 通过: ${results.passed} 个`);
    console.log(`❌ 失败: ${results.failed} 个`);

    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    console.log(`📈 成功率: ${successRate}%`);

    if (results.failed > 0) {
        console.log('\n❌ 失败的测试:');
        results.details
            .filter(test => test.status === 'FAIL')
            .forEach(test => {
                console.log(`   - ${test.name}: ${test.error}`);
            });
    }

    if (results.passed === results.total) {
        console.log('\n🎉 所有测试通过！系统运行正常。');
        console.log('\n💡 下一步:');
        console.log('1. 将你的 Markdown 文件放入 summary/ 目录');
        console.log('2. 运行 node full-pipeline.js');
        console.log('3. 查看 output/ 目录中的生成结果');
    } else {
        console.log('\n⚠️  部分测试失败，请检查上述错误信息。');
        console.log('\n🔧 建议:');
        console.log('1. 确保所有依赖已安装: npm install');
        console.log('2. 检查文件完整性');
        console.log('3. 查看详细错误信息并修复');
    }
}

/**
 * 创建示例数据
 */
function createSampleData() {
    console.log('\n📝 创建示例数据...');

    const sampleMarkdown = `2025-10-17

示例内容总结：

这段聊天记录包含了四个主要议题，展示了技术群聊的精华内容：

1\. 性能优化策略：

&nbsp; - 问题: 如何提升网站加载速度？

&nbsp; - 方法: "优化大师"分享了多种性能优化技术，包括图片懒加载、代码分割、CDN加速等。他特别强调了性能监控的重要性，建议使用Lighthouse定期检测。

&nbsp; - 工具推荐: Webpack Bundle Analyzer、Lighthouse、Chrome DevTools Performance面板

2\. 前端框架选择：

&nbsp; - 讨论: 群友们热议了React、Vue、Angular三大框架的优缺点。

&nbsp; - React观点: 生态丰富，社区活跃，适合大型项目，但学习曲线较陡

&nbsp; - Vue观点: 上手简单，文档友好，适合中小型项目，性能优秀

&nbsp; - Angular观点: 功能完整，适合企业级应用，但相对复杂

3\. 代码规范实践：

&nbsp; - 问题: 团队中如何统一代码风格？

&nbsp; - 解决方案: 使用ESLint + Prettier组合，配合Git hooks进行自动化检查

&nbsp; - 配置分享: 提供了一套完整的ESLint配置文件，支持React、Vue、TypeScript

4\. 职业发展建议：

&nbsp; - 话题: 程序员的职业规划路径

&nbsp; - 建议1: 技术深度 > 广度，建议在某一领域深耕

&nbsp; - 建议2: 持续学习新技术，但要注重基础知识的巩固

&nbsp; - 建议3: 多参与开源项目，提升实战经验和个人品牌

额外分享:

&nbsp; - 学习资源: 推荐了几个优质的技术博客和学习网站

&nbsp; - 面试经验: 分享了最新的面试题目和应对技巧`;

    fs.writeFileSync('../summary/2025-10-17.md', sampleMarkdown, 'utf8');
    console.log('✅ 示例 Markdown 文件已创建: summary/2025-10-17.md');
}

/**
 * 主函数
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--sample')) {
        createSampleData();
        return;
    }

    if (args.includes('--help')) {
        console.log(`
🧪 测试脚本使用说明

用法:
  node test.js [选项]

选项:
  --sample    创建示例数据
  --help      显示帮助信息

示例:
  node test.js              # 运行完整测试
  node test.js --sample     # 创建示例数据
  node test.js --help       # 显示帮助
        `);
        return;
    }

    await runTests();
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 测试运行失败:', error);
        process.exit(1);
    });
}

module.exports = {
    runTests,
    testEnvironment,
    testMarkdownParsing,
    testHTMLGeneration,
    testImageGeneration,
    testFileStructure
};