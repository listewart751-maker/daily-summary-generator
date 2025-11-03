# Daily Summary Generator

A powerful automation tool that converts Markdown-formatted technical community chat summaries into beautiful social media share images.

🌟 **Transform your technical discussions into stunning visual content for social media platforms!**

## ✨ Features

- 🔄 **Automated Pipeline**: Markdown → HTML → Multi-platform screenshots
- 🎨 **Professional Design**: Modern UI with professional visual effects
- 📱 **Multi-Platform Support**: Optimized for Xiaohongshu, WeChat Moments, Jike, Twitter, and more
- 📊 **Smart Parsing**: Automatically recognizes topics, key points, and highlights
- 🔗 **QR Code Integration**: Automatically generates QR codes for community links
- ⚡ **High-Efficiency**: One-click generation of all platform-optimized images
- 🌍 **International Ready**: Supports both Chinese and English content

## 📋 Supported Platforms

| Platform | Size | Aspect Ratio | Use Case |
|----------|------|--------------|----------|
| Xiaohongshu | 1080×1440 | 3:4 | Primary traffic source |
| WeChat Moments | 1080×1920 | 9:16 | WeChat ecosystem |
| Jike | 1080×1080 | 1:1 | Tech community |
| Twitter | 1200×675 | 16:9 | International reach |

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn** package manager

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/daily-summary-generator.git
cd daily-summary-generator

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### 3. Project Structure

```
daily-summary-generator/
├── summary/                     # INPUT: Markdown files (YYYY-MM-DD.md)
├── output/                      # OUTPUT: Generated content
├── src/                         # Source code
│   ├── generate-daily-summary.js    # Core generation script
│   ├── social-optimizer.js          # Social media optimization
│   ├── full-pipeline.js              # Complete pipeline
│   └── daily-summary-template.html   # HTML template
├── package.json                 # Project configuration
└── README.md                   # This file
```

### 4. Usage

```bash
# 1. Place your Markdown file in the summary/ directory
# Example: summary/2025-10-15.md

# 2. Run the complete pipeline
npm run pipeline

# Or run step by step:
npm run generate    # Generate HTML and base images
npm run optimize    # Generate social media packages

# 3. Check the output
ls output/
# You'll find:
# - 2025-10-15-summary.html
# - 2025-10-15-xiaohongshu.png
# - 2025-10-15-wechat.png
# - 2025-10-15-jike.png
# - 2025-10-15-twitter.png
# - 2025-10-15-qrcode.png
# - social-packages/2025-10-15/
```

## 📝 Markdown Format

The tool uses a **smart dynamic parser** that automatically detects and adapts to ANY Markdown structure. No strict format required!

### Supported Patterns (Auto-Detected)

**Topic Headers** (automatically recognized):
```markdown
2025-10-15

# Main Topic
## Sub Topic
1. Numbered Topic
2. Another Topic
```

**Content Sections** (automatically captured):
```markdown
1. Topic Title:
   - Sub-item: Content description
   - Another item: More content
```

**Mixed Format Example:**
```markdown
2025-10-15

Daily Tech Discussion Summary

1. Keyword Research:
   - Method: Check tool directories like Toolify
   - Strategy: Find non-branded keywords with natural traffic

2. Web Development:
   - Templates: Discussion about starter kits
   - Best practices: Modern development workflows
```

### Key Features

- **🤖 Smart Parsing**: Automatically detects structure without rigid rules
- **🌍 Multi-language**: Supports both Chinese and English content
- **📊 Hierarchical**: Maintains topic and subtopic relationships
- **⚡ Flexible**: Works with various Markdown writing styles

## 🎨 Customization

### Adding New Platforms

Edit `src/generate-daily-summary.js` in the `platforms` configuration:

```javascript
const platforms = {
    instagram: { width: 1080, height: 1080 },
    linkedin: { width: 1200, height: 627 },
    // Add your custom platform
    my_platform: { width: 1080, height: 1350 }
};
```

### Modifying Styles

Edit `src/daily-summary-template.html` to customize the appearance:

```html
<!-- Change color scheme -->
<style>
    .gradient-bg {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Custom fonts */
    body {
        font-family: 'Inter', 'SF Pro Display', sans-serif;
    }
</style>
```

### Custom QR Code URL

Edit `src/generate-daily-summary.js` to change the QR code link:

```javascript
await generateQRCode('https://your-community-link.com', qrPath);
```

### Platform-Specific Settings

Edit `src/social-optimizer.js` to customize social media packages:

```javascript
const PLATFORM_CONFIGS = {
    custom_platform: {
        watermark: 'Your Brand',
        hashtags: ['#tech', '#community'],
        caption: 'Check out this amazing content!'
    }
};
```

## 🔧 Advanced Features

### 1. Batch Processing

```bash
# Process multiple Markdown files
node src/full-pipeline.js

# Or manually loop through files
for file in summary/*.md; do
    node src/generate-daily-summary.js
done
```

### 2. Custom Templates

You can completely customize the `src/daily-summary-template.html`:

- Use Tailwind CSS for styling
- Add custom components and animations
- Integrate third-party services (image hosting, CDN, etc.)

### 3. Extending the Parser

Modify the `parseMarkdownContent()` function to support more Markdown syntax:

```javascript
// Add new parsing rules
if (line.match(/^#{1,6}\s+/)) {
    // Handle headers
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Dependencies Installation Failed**
   ```bash
   # Clear cache and retry
   npm cache clean --force
   npm install
   ```

2. **Playwright Browser Download Failed**
   ```bash
   # Specify mirror manually
   PLAYWRIGHT_DOWNLOAD_HOST=https://playwright.azureedge.net npx playwright install
   ```

3. **Blank Screenshots**
   - Check HTML template path
   - Ensure Markdown format is correct
   - Check console error messages

4. **Chinese Font Issues**
   - Ensure HTML template has correct charset encoding
   - Check if fonts support Chinese characters

### Debug Mode

```bash
# Run with debug logging
node src/full-pipeline.js
```

## 📈 Output Examples

Generated images feature:

- ✅ **Professional Appearance**: Modern design with clean layout
- ✅ **Clear Hierarchy**: Structured information display
- ✅ **Brand Consistency**: Unified visual identity
- ✅ **Mobile-Friendly**: Optimized for mobile screens
- ✅ **Performance Optimized**: Reasonable image sizes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure all existing tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Playwright](https://playwright.dev/) - Powerful browser automation tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [QRCode](https://www.npmjs.com/package/qrcode) - QR code generation library

## 📞 Support

If you have any questions or suggestions:

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/daily-summary-generator/issues)
- 📧 **Discussions**: [GitHub Discussions](https://github.com/yourusername/daily-summary-generator/discussions)
- 📖 **Documentation**: Check this README and inline code comments

---

⭐ If this project helps you, please give it a star!