# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **daily technical community digest automation tool** that converts Markdown-formatted community chat summaries into beautiful social media share images. The pipeline transforms: `Markdown → HTML → Multi-platform Screenshots → Social Media Packages`.

**Primary Use Case**: Transform technical discussion summaries into platform-optimized images for distribution on 小红书 (Xiaohongshu), WeChat Moments, 即刻 (Jike), and Twitter.

## Core Development Commands

```bash
# Install dependencies (first time setup)
npm install
npx playwright install chromium

# Run complete automation pipeline (most common)
node full-pipeline.js

# Generate HTML + base images only
node generate-daily-summary.js

# Generate social media optimization package only
node social-optimizer.js

# Run system tests
node test.js
```

## Pipeline Architecture

### Three-Stage Pipeline Flow

**Stage 1: Content Generation** (`generate-daily-summary.js`)
- Input: Markdown files from `summary/` directory
- Parses Markdown using structured format (see Markdown Format below)
- Generates HTML using `daily-summary-template-fixed.html`
- Creates QR code for community link
- Produces base images for each platform
- Output: HTML + 4 platform-sized PNG screenshots

**Stage 2: Social Media Optimization** (`social-optimizer.js`)
- Input: Generated images from Stage 1
- Adds platform-specific watermarks (requires `sharp` - optional)
- Generates platform-optimized captions with hashtags
- Creates publishing guides with best practices
- Output: `social-packages/[date]/[platform]/` directories

**Stage 3: Orchestration & Reporting** (`full-pipeline.js`)
- Coordinates Stage 1 and Stage 2 execution
- Performs environment validation
- Generates execution report and README
- Provides progress tracking and error handling

### Platform Configurations

| Platform | Size | Aspect Ratio | Purpose |
|----------|------|--------------|---------|
| xiaohongshu | 1080×1440 | 3:4 | Primary traffic source |
| wechat | 1080×1920 | 9:16 | WeChat ecosystem |
| jike | 1080×1080 | 1:1 | Tech community |
| twitter | 1200×675 | 16:9 | International reach |

**Location**: `generate-daily-summary.js` lines 22-27 for size config, `social-optimizer.js` lines 19-72 for platform-specific settings.

## Markdown Format Specification

**Smart Dynamic Parser**: The parser automatically detects and adapts to ANY Markdown structure without requiring a fixed format. No need to follow specific rules - just write natural Markdown.

### Supported Patterns (Auto-Detected)

**Topic Headers** (automatically recognized as main topics):
- Chinese sections: `一、 二、 三、 标题`
- Numbered lists: `1. 标题` or `1\. 标题：`
- Any combination of the above

**Subsections** (automatically detected):
- Dashed lists with 2+ space indent: `  - 标签：内容`
- HTML entity lists: `&nbsp; - 标签：内容`
- Nested lists with 4+ spaces become sub-items

**Content** (automatically captured):
- Inline content after colons: `标签：内容` → splits into title + content
- Paragraph text automatically associated with nearest topic
- Multi-level nesting preserved based on indentation

### Example Structures (All Work)

**Format 1: Narrative Style**
```markdown
2025-10-09

一、 核心内容：关键词分析
详细描述段落...
1. 初步筛选：
  - 谷歌搜索：发现大流量词
  - KGR 分析：竞争度低
```

**Format 2: Structured Outline**
```markdown
2025-10-08

1\. 项目背景：

&nbsp; - 自我定位: 新人擅长流量

&nbsp; - 核心动机: 月入万刀目标
```

**Format 3: Mixed Nested**
```markdown
2025-XX-XX

1. 主题：
  - 一级子项：
    - 二级嵌套项1
    - 二级嵌套项2
  - 另一个一级子项：内容
```

**No Fixed Rules**: The parser dynamically builds a hierarchical tree based on indentation and list markers. Write your summaries naturally - the system adapts.

**Parser Logic**: `parseMarkdownContent()` in `generate-daily-summary.js` lines 34-147.

## Directory Structure

```
项目根目录/
├── summary/                          # INPUT: Markdown files (YYYY-MM-DD.md)
├── output/                           # OUTPUT: All generated content
│   ├── [date]-summary.html          # HTML version
│   ├── [date]-[platform].png        # Base platform images
│   ├── [date]-qrcode.png            # QR code
│   ├── social-packages/             # Social media packages
│   │   └── [date]/
│   │       └── [platform]/
│   │           ├── *-watermarked.png
│   │           ├── caption.txt
│   │           └── publishing-guide.md
│   ├── README.md                    # Execution report (human-readable)
│   └── execution-report.json        # Execution metrics
├── daily-summary-template-fixed.html # HTML template (DO NOT modify without understanding)
├── generate-daily-summary.js         # Stage 1: Core generation
├── social-optimizer.js               # Stage 2: Platform optimization
├── full-pipeline.js                  # Stage 3: Orchestration
├── test.js                           # Test suite
└── package.json                      # Dependencies
```

## Key Technical Patterns

### HTML Template System
- Template: `daily-summary-template-fixed.html` contains Tailwind CSS and placeholder markers
- Placeholder: `<!-- TOPICS_PLACEHOLDER -->` is replaced with generated topic HTML
- Topic HTML generation: `generateHTML()` creates cards with color-coded sections
- Dynamic date substitution: Replaces hardcoded dates with actual data

### Screenshot Generation
- Uses Playwright Chromium in headless mode
- Viewport sizing: Sets viewport to exact platform dimensions
- Full-page capture: Adjusts viewport height if content exceeds initial height
- Font loading: 2-second wait ensures web fonts load before screenshot
- Location: `takeScreenshots()` in `generate-daily-summary.js` lines 212-264

### Watermark System (Optional)
- Requires `sharp` library (optional dependency)
- Falls back to copying original if `sharp` not installed
- Uses SVG text overlay composite
- Platform-specific positioning and styling
- Location: `addWatermark()` in `social-optimizer.js` lines 77-118

## Configuration Customization

### Change QR Code URL
**File**: `generate-daily-summary.js` line 301
```javascript
await generateQRCode('https://your-actual-link.com', qrPath);
```

### Modify Platform Sizes
**File**: `generate-daily-summary.js` lines 22-27
```javascript
platforms: {
    custom_platform: { width: 1080, height: 1080 }
}
```

### Update Template Styling
**File**: `daily-summary-template-fixed.html`
- Tailwind CSS classes inline
- Gradient backgrounds, color schemes
- Typography and spacing

### Platform-Specific Settings
**File**: `social-optimizer.js` lines 19-72
- Watermark text, position, color
- Hashtags and caption templates
- Publishing time recommendations

## Error Handling Patterns

All main scripts follow this pattern:
1. Environment validation before execution
2. Try-catch blocks around async operations
3. Detailed error logging with ❌ prefix
4. Process exit codes (0 = success, 1 = failure)
5. Unhandled rejection and exception handlers

## Module Exports

Each script exports key functions for reuse:

```javascript
// generate-daily-summary.js
{ parseMarkdownContent, generateHTML, takeScreenshots, main }

// social-optimizer.js
{ addWatermark, generateCaption, generateSocialPackage, PLATFORM_CONFIGS }

// full-pipeline.js
{ runPipeline, checkEnvironment, generateReport }
```

## Dependencies

**Core Runtime**:
- `playwright`: Browser automation for screenshots
- `qrcode`: QR code generation
- `sharp`: Image processing (optional, for watermarks)

**Dev**:
- `@types/node`: TypeScript definitions

**Node Version**: >=16.0.0 (specified in package.json)

## Common Issues & Solutions

**Missing summary files**: Pipeline requires at least one `.md` file in `summary/` directory

**Playwright browser not installed**: Run `npx playwright install chromium`

**Watermark skipped**: Install `npm install sharp` to enable watermark feature

**Screenshot blank**: Check Markdown format matches specification exactly, especially `&nbsp;` entities

**Chinese characters broken**: Ensure HTML template has `<meta charset="UTF-8">` and system fonts support Chinese

## Development Guidelines

**When modifying parsing logic**: Update `parseMarkdownContent()` and maintain regex patterns for topic/section detection

**When adding platforms**: Add config to both `generate-daily-summary.js` platforms object and `social-optimizer.js` PLATFORM_CONFIGS

**When changing template**: Test across all platforms as viewport sizes affect rendering differently

**When debugging**: Use `node test.js` to validate system integrity before running full pipeline
