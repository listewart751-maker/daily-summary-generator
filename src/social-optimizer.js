/**
 * 社交媒体适配性优化器
 * 针对不同平台优化图片内容、水印和文案
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
// sharp 是可选的图像处理库
let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.log('⚠️  sharp 库未安装，将跳过图像水印功能');
    console.log('   要启用水印功能，请运行: npm install sharp');
}

// 平台特定配置
const PLATFORM_CONFIGS = {
    xiaohongshu: {
        name: '小红书',
        width: 1080,
        height: 1440,
        watermark: {
            text: '@技术成长日记',
            position: 'bottom-right',
            color: '#ffffff',
            opacity: 0.7
        },
        hashtags: ['#技术分享', '#每日学习', '#前端开发', '#技术干货'],
        caption: '技术群聊精华内容分享，每天进步一点点💻✨'
    },
    wechat: {
        name: '朋友圈',
        width: 1080,
        height: 1920,
        watermark: {
            text: '技术群聊日报',
            position: 'bottom-center',
            color: '#666666',
            opacity: 0.6
        },
        hashtags: [],
        caption: '今日技术群聊总结，满满的干货！'
    },
    jike: {
        name: '即刻',
        width: 1080,
        height: 1080,
        watermark: {
            text: '@技术分享君',
            position: 'bottom-left',
            color: '#000000',
            opacity: 0.5
        },
        hashtags: ['#技术', '#开发', '#学习'],
        caption: '每日技术群聊内容整理'
    },
    twitter: {
        name: 'Twitter',
        width: 1200,
        height: 675,
        watermark: {
            text: '@TechDaily_CN',
            position: 'bottom-right',
            color: '#1DA1F2',
            opacity: 0.8
        },
        hashtags: ['#tech', '#development', '#programming', '#daily'],
        caption: 'Daily tech discussion summary from our developer community'
    }
};

/**
 * 添加水印到图片
 */
async function addWatermark(imagePath, outputPath, config) {
    if (!sharp) {
        console.log(`⚠️  ${config.name} 跳过水印功能 (需要 sharp 库)`);
        // 直接复制原文件
        fs.copyFileSync(imagePath, outputPath);
        return true;
    }

    try {
        const image = sharp(imagePath);
        const { width, height } = await image.metadata();

        // 创建水印文字SVG
        const watermarkSvg = `
            <svg width="${width}" height="${height}">
                <text
                    x="${getWatermarkX(width, config.position)}"
                    y="${height - 20}"
                    font-family="Arial, sans-serif"
                    font-size="24"
                    fill="${config.color}"
                    opacity="${config.opacity}"
                    text-anchor="${getTextAnchor(config.position)}"
                >
                    ${config.text}
                </text>
            </svg>
        `;

        // 合成图片和水印
        await image
            .composite([{ input: Buffer.from(watermarkSvg), top: 0, left: 0 }])
            .png({ quality: 90 })
            .toFile(outputPath);

        console.log(`✅ ${config.name} 水印添加成功`);
        return true;
    } catch (error) {
        console.error(`❌ ${config.name} 水印添加失败:`, error);
        return false;
    }
}

/**
 * 获取水印X坐标
 */
function getWatermarkX(imageWidth, position) {
    const padding = 20;
    switch (position) {
        case 'left':
        case 'bottom-left':
            return padding;
        case 'center':
        case 'bottom-center':
            return imageWidth / 2;
        case 'right':
        case 'bottom-right':
            return imageWidth - padding;
        default:
            return padding;
    }
}

/**
 * 获取文字对齐方式
 */
function getTextAnchor(position) {
    switch (position) {
        case 'left':
        case 'bottom-left':
            return 'start';
        case 'center':
        case 'bottom-center':
            return 'middle';
        case 'right':
        case 'bottom-right':
            return 'end';
        default:
            return 'start';
    }
}

/**
 * 生成平台特定的文案
 */
function generateCaption(platform, date, topics) {
    const config = PLATFORM_CONFIGS[platform];

    let caption = config.caption;

    // 添加日期
    caption += `\n📅 ${formatDate(date)}`;

    // 添加话题标签
    if (config.hashtags.length > 0) {
        caption += '\n' + config.hashtags.map(tag => `#${tag}`).join(' ');
    }

    // 添加统计信息
    caption += `\n\n📊 今日${topics.length}个核心议题`;

    return caption;
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
}

/**
 * 生成社交媒体发布包
 */
async function generateSocialPackage(date, topics) {
    const outputDir = '../output';
    const socialDir = path.join(outputDir, 'social-packages', date);

    if (!fs.existsSync(socialDir)) {
        fs.mkdirSync(socialDir, { recursive: true });
    }

    console.log('📱 生成社交媒体适配包...');

    for (const [platformKey, config] of Object.entries(PLATFORM_CONFIGS)) {
        const platformDir = path.join(socialDir, platformKey);
        if (!fs.existsSync(platformDir)) {
            fs.mkdirSync(platformDir, { recursive: true });
        }

        // 原始图片路径
        const originalImage = path.join(outputDir, `${date}-${platformKey}.png`);

        if (fs.existsSync(originalImage)) {
            // 添加水印的图片
            const watermarkedImage = path.join(platformDir, `${date}-${platformKey}-watermarked.png`);
            await addWatermark(originalImage, watermarkedImage, config.watermark);

            // 生成文案
            const caption = generateCaption(platformKey, date, topics);
            const captionFile = path.join(platformDir, 'caption.txt');
            fs.writeFileSync(captionFile, caption, 'utf8');

            // 生成发布指南
            const guide = generatePublishingGuide(platformKey, config);
            const guideFile = path.join(platformDir, 'publishing-guide.md');
            fs.writeFileSync(guideFile, guide, 'utf8');

            console.log(`✅ ${config.name} 包生成完成`);
        }
    }
}

/**
 * 生成发布指南
 */
function generatePublishingGuide(platform, config) {
    return `
# ${config.name} 发布指南

## 最佳发布时间
- ${getBestTime(platform)}

## 推荐文案
见 caption.txt 文件

## 注意事项
${getPublishingTips(platform)}

## 标签建议
${config.hashtags.map(tag => `- ${tag}`).join('\n')}

## 互动建议
- ${getEngagementTips(platform)}

---
生成时间: ${new Date().toLocaleString('zh-CN')}
`;
}

/**
 * 获取最佳发布时间
 */
function getBestTime(platform) {
    const times = {
        xiaohongshu: '晚上8-10点，周末下午2-4点',
        wechat: '早上8-9点，晚上6-8点',
        jike: '工作日上午10-11点，下午2-3点',
        twitter: '工作日上午9-11点，下午3-5点'
    };
    return times[platform] || '根据目标受众活跃时间';
}

/**
 * 获取发布提示
 */
function getPublishingTips(platform) {
    const tips = {
        xiaohongshu: `
- 使用吸引眼球的标题
- 第一张图最重要，要吸引点击
- 内容要有实用价值
- 多使用emoji增加亲和力
- 引导用户点赞收藏`,
        wechat: `
- 配文简洁有力
- 避免过于营销化
- 可以适当提问引导评论
- 注意图片尺寸在手机上显示效果`,
        jike: `
- 内容要有趣或有用
- 可以适当表达个人观点
- 参与相关话题讨论
- 保持活跃互动`,
        twitter: `
- 使用相关的英文hashtags
- 内容简洁明了
- 可以@相关的大V或公司
- 注意时差，考虑全球受众`
    };
    return tips[platform] || '保持内容质量，真诚互动';
}

/**
 * 获取互动建议
 */
function getEngagementTips(platform) {
    const tips = {
        xiaohongshu: '及时回复评论和私信，建立粉丝关系',
        wechat: '主动点赞评论，增加曝光',
        jike: '参与讨论，发布动态，增加存在感',
        twitter: '转发相关内容，参与热门话题讨论'
    };
    return tips[platform] || '积极互动，提供价值';
}

/**
 * 主函数
 */
async function main() {
    try {
        // 查找最新的输出
        const outputDir = '../output';
        const files = fs.readdirSync(outputDir)
            .filter(file => file.includes('-summary.html'))
            .sort()
            .reverse();

        if (files.length === 0) {
            console.log('❌ 未找到生成的HTML文件，请先运行生成脚本');
            return;
        }

        const latestFile = files[0];
        const date = latestFile.replace('-summary.html', '');

        // 解析数据（这里简化处理，实际应该从原始数据读取）
        const topics = [
            { title: '关键词策略' },
            { title: '网站开发模板' },
            { title: '安全防护' },
            { title: 'API密钥安全' }
        ];

        await generateSocialPackage(date, topics);

        console.log('🎉 社交媒体适配包生成完成！');
        console.log(`📁 位置: ../output/social-packages/${date}`);

    } catch (error) {
        console.error('❌ 生成失败:', error);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = {
    addWatermark,
    generateCaption,
    generateSocialPackage,
    PLATFORM_CONFIGS
};