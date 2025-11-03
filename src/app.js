// 技术群聊日报管理器
class DailyReportManager {
    constructor() {
        // 自动检测环境：Vercel部署使用相对路径，本地开发使用localhost
        this.apiBase = window.location.hostname === 'localhost'
            ? 'http://localhost:3002/api'
            : '/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = null;
        this.reports = [];
        this.currentReport = null;
        this.currentEditingId = null;
        this.zoom = 1.0; // 默认100%显示，充满预览区
        this.customQRCode = null;
        this.currentFont = 'font-noto-sans';
        this.markdownEditor = null;
        this.init();
    }

    async init() {
        console.log('🚀 应用开始初始化');

        // 初始化CodeMirror编辑器
        this.initMarkdownEditor();

        // 载入设置（字体、自定义二维码等）
        this.loadSettings();

        // 根据token决定展示内容
        if (this.token) {
            try {
                await this.verifyToken();
            } catch (error) {
                console.error('❌ 初始化时验证token失败:', error);
                this.showLoginPage();
                this.updateCurrentUserDisplay();
            }
        } else {
            console.log('🔐 未检测到token，显示登录页');
            this.showLoginPage();
            this.updateCurrentUserDisplay();
        }
    }

    initMarkdownEditor() {
        // 简化版本：使用普通textarea作为后备方案
        const editorContainer = document.getElementById('markdownEditor');
        if (editorContainer) {
            // 检查CodeMirror是否可用 (CodeMirror 5)
            if (typeof CodeMirror !== 'undefined' && CodeMirror.fromTextArea) {
                try {
                    console.log('🔧 尝试初始化CodeMirror 5编辑器');
                    // 如果CodeMirror可用，使用它
                    this.initCodeMirrorEditor(editorContainer);
                } catch (error) {
                    console.error('❌ CodeMirror初始化失败，使用后备方案:', error);
                    this.initFallbackEditor(editorContainer);
                }
            } else {
                console.log('⚠️ CodeMirror不可用，使用后备编辑器');
                this.initFallbackEditor(editorContainer);
            }
        }
    }

    initCodeMirrorEditor(editorContainer) {
        // CodeMirror 5 初始化逻辑
        // 创建textarea作为基础
        const textarea = document.createElement('textarea');
        textarea.value = '';
        textarea.style.display = 'none';
        editorContainer.appendChild(textarea);

        // 修复：确保容器有正确的样式
        editorContainer.style.border = '1px solid #d1d5db';
        editorContainer.style.borderRadius = '0.5rem';
        editorContainer.style.overflow = 'hidden';

        // 初始化CodeMirror 5
        this.markdownEditor = CodeMirror.fromTextArea(textarea, {
            mode: 'markdown', // 使用基础markdown模式
            theme: 'monokai', // 使用Monokai主题
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            width: '100%',
            height: window.innerWidth <= 768 ? '300px' : '400px', // 移动端使用更小的高度
            viewportMargin: Infinity,
            extraKeys: {
                "Ctrl-S": () => {
                    this.saveCurrentContent();
                },
                "Ctrl-s": () => {
                    this.saveCurrentContent();
                }
            }
        });

        // 修复：确保编辑器正确显示
        setTimeout(() => {
            this.markdownEditor.refresh();
        }, 100);

        // 监听窗口大小变化，在移动端动态调整
        window.addEventListener('resize', () => {
            if (this.markdownEditor) {
                const newHeight = window.innerWidth <= 768 ? '300px' : '400px';
                this.markdownEditor.setSize('100%', newHeight);
                this.markdownEditor.refresh();
            }
        });

        // 监听内容变化
        this.markdownEditor.on('change', (editor) => {
            const content = editor.getValue();
            document.getElementById('reportContent').value = content;
        });

        // 初始化隐藏字段的内容
        document.getElementById('reportContent').value = '';
        console.log('✅ CodeMirror 5编辑器初始化成功');
    }

    initFallbackEditor(editorContainer) {
        // 后备方案：使用简单的textarea
        editorContainer.innerHTML = `
            <textarea
                id="fallbackMarkdownEditor"
                class="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="请输入Markdown格式的内容..."></textarea>
        `;

        // 监听textarea变化
        const textarea = document.getElementById('fallbackMarkdownEditor');
        if (textarea) {
            textarea.addEventListener('input', (e) => {
                document.getElementById('reportContent').value = e.target.value;
            });

            // 初始化隐藏字段的内容
            document.getElementById('reportContent').value = '';

            // 添加快捷键支持
            textarea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.saveCurrentContent();
                }
            });

            console.log('✅ 后备编辑器初始化成功');
        }
    }

    saveCurrentContent() {
        let content = '';
        if (this.markdownEditor) {
            // 如果是CodeMirror编辑器
            content = this.markdownEditor.state.doc.toString();
        } else {
            // 如果是后备编辑器
            const textarea = document.getElementById('fallbackMarkdownEditor');
            content = textarea ? textarea.value : '';
        }

        document.getElementById('reportContent').value = content;
        // 显示保存提示
        this.showNotification('内容已保存', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

        notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: ${bgColor}; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999; animation: slideIn 0.3s ease-out;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'}
                    </svg>
                    <span style="font-weight: 600;">${message}</span>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // API请求方法
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        console.log('🌐 API请求:', url);
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            console.log('📡 API响应状态:', response.status);

            if (response.status === 401) {
                this.logout();
                throw new Error('登录已过期，请重新登录');
            }

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ API错误响应:', error);
                throw new Error(error.error || '请求失败');
            }

            const data = await response.json();
            console.log('✅ API响应数据:', data);
            return data;
        } catch (error) {
            console.error('❌ API请求异常:', error);
            throw error;
        }
    }

    // 认证相关
    async login(username, password) {
        try {
            console.log('🔐 尝试登录:', { username, passwordLength: password?.length });
            const data = await this.apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            console.log('✅ 登录成功，收到token:', data.token ? '存在' : '不存在');
            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('authToken', this.token);

            return data;
        } catch (error) {
            console.error('❌ 登录失败:', error);
            throw error;
        }
    }

    async verifyToken() {
        try {
            const data = await this.apiRequest('/verify');
            this.currentUser = data.user;
            this.updateCurrentUserDisplay();
            console.log('✅ Token验证成功，用户:', this.currentUser); // 调试日志
            this.showMainApp();
            this.loadReports();
        } catch (error) {
            console.error('❌ Token验证失败:', error);
            // 🔥 修复：只有401和403错误才清除token，其他错误可能是网络问题
            if (error.message.includes('登录已过期') || error.message.includes('无效的令牌')) {
                console.log('🔄 认证失效，清除token并显示登录页');
                this.logout();
            } else {
                console.log('⚠️ 网络或其他错误，保持当前状态');
                // 网络错误时不清除token，保持当前状态
                if (this.currentUser) {
                    this.showMainApp();
                } else {
                    this.showReadOnlyMode();
                }
            }
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        this.updateCurrentUserDisplay();
        this.showLoginPage();
    }

    // 数据管理
    async loadReports() {
        try {
            this.reports = await this.apiRequest('/reports');
            this.renderHistory();
        } catch (error) {
            console.error('加载日报失败:', error);
            this.reports = [];
            this.renderHistory();
        }
    }

    async loadPublicReports() {
        try {
            // 使用公共API端点获取公开报告
            const response = await fetch(`${this.apiBase}/public/reports`);
            if (response.ok) {
                this.reports = await response.json();
                this.renderHistory();
                if (this.reports.length > 0) {
                    this.selectReport(this.reports[0].id);
                } else {
                    this.currentReport = null;
                    this.renderPreview();
                }
            } else {
                // 如果没有公共报告端点，显示空状态
                this.reports = [];
                this.renderHistory();
                this.currentReport = null;
                this.renderPreview();
            }
        } catch (error) {
            console.error('加载公开日报失败:', error);
            // 显示空状态而不是错误提示
            this.reports = [];
            this.renderHistory();
            this.currentReport = null;
            this.renderPreview();
        }
    }

    async createReport(date, content, font = 'font-noto-sans', qrcodeFile = null) {
        try {
            const formData = new FormData();
            formData.append('date', date);
            formData.append('content', content);
            formData.append('font', font);
            if (qrcodeFile) {
                formData.append('qrcode', qrcodeFile);
            }

            const response = await fetch(`${this.apiBase}/reports`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '创建失败');
            }

            const report = await response.json();
            report.html = this.generateHTML(date, content, font, report.qrcode);

            this.reports.unshift(report);
            this.renderHistory();
            return report;
        } catch (error) {
            console.error('创建日报失败:', error);
            throw error;
        }
    }

    async updateReport(id, date, content, font = 'font-noto-sans', qrcodeFile = null) {
        try {
            const formData = new FormData();
            formData.append('date', date);
            formData.append('content', content);
            formData.append('font', font);
            if (qrcodeFile) {
                formData.append('qrcode', qrcodeFile);
            }

            const response = await fetch(`${this.apiBase}/reports/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '更新失败');
            }

            const report = await response.json();
            report.html = this.generateHTML(date, content, font, report.qrcode);

            const index = this.reports.findIndex(r => r.id === id);
            if (index !== -1) {
                this.reports[index] = report;
            }

            if (this.currentReport?.id === id) {
                this.currentReport = report;
                this.renderPreview();
            }

            this.renderHistory();
            return report;
        } catch (error) {
            console.error('更新日报失败:', error);
            throw error;
        }
    }

    async deleteReport(id) {
        try {
            await this.apiRequest(`/reports/${id}`, { method: 'DELETE' });

            const index = this.reports.findIndex(r => r.id === id);
            if (index !== -1) {
                this.reports.splice(index, 1);
            }

            if (this.currentReport?.id === id) {
                this.currentReport = null;
                this.renderPreview();
            }

            this.renderHistory();
        } catch (error) {
            console.error('删除日报失败:', error);
            throw error;
        }
    }

    getReport(id) {
        return this.reports.find(r => r.id === id);
    }

    // HTML生成
    generateHTML(date, content, font = null, qrcodeData = null) {
        const template = this.getTemplate();
        const topics = this.parseMarkdown(content);
        const topicsHTML = this.generateTopicsHTML(topics);

        // 使用传入的font和qrcode，如果没有则使用默认值
        const fontClass = font || this.currentFont || 'font-noto-sans';
        const qrCodeSrc = qrcodeData || this.customQRCode || this.getDefaultQRCode();

        return template
            .replace(/{{DATE}}/g, date)
            .replace('{{TOPICS_PLACEHOLDER}}', topicsHTML)
            .replace('{{FONT_CLASS}}', fontClass)
            .replace('{{QR_CODE}}', qrCodeSrc);
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        const topics = [];
        let currentTopic = null;
        let inContentSection = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 跳过空行和日期
            if (!line || line.match(/^\d{4}-\d{2}-\d{2}$/)) {
                continue;
            }

            // 匹配多种标题格式
            const topicMatch = line.match(/^(\d+)\.\s*(.+?)([:：]?)?\s*$/);
            const chineseMatch = line.match(/^([一二三四五六七八九十]+)\s*[、.]\s*(.+?)([:：]?)?\s*$/);
            const romanMatch = line.match(/^([IVXivx]+)\s*[.、]\s*(.+?)([:：]?)?\s*$/);

            if (topicMatch || chineseMatch || romanMatch) {
                // 保存之前的主题
                if (currentTopic) {
                    topics.push(currentTopic);
                }

                // 创建新主题
                const title = (topicMatch && topicMatch[2]) || (chineseMatch && chineseMatch[2]) || (romanMatch && romanMatch[2]);
                currentTopic = {
                    title: title,
                    icon: this.getIconForTopic(topics.length),
                    contents: []
                };
                inContentSection = true;
                continue;
            }

            // 匹配内容块 - 支持多种格式
            const contentMatch1 = line.match(/^(\s*)&nbsp;\s*[-–—]\s*(.+?)[:：]\s*(.+)$/);
            const contentMatch2 = line.match(/^(\s*)[-–—]\s*(.+?)[:：]\s*(.+)$/);
            const contentMatch3 = line.match(/^(\s*)\*\s*(.+?)[:：]\s*(.+)$/);
            const contentMatch4 = line.match(/^(\s*)•\s*(.+?)[:：]\s*(.+)$/);

            if ((contentMatch1 || contentMatch2 || contentMatch3 || contentMatch4) && currentTopic) {
                const match = contentMatch1 || contentMatch2 || contentMatch3 || contentMatch4;
                currentTopic.contents.push({
                    type: match[2],
                    text: match[3]
                });
                continue;
            }

            // 处理段落内容 - 智能识别各种内容格式
            if (currentTopic && inContentSection && line.length > 5) {
                // 检查是否是新的主题开始（避免误判）
                const looksLikeNewTopic = line.match(/^(\d+|[一二三四五六七八九十]+|[IVXivx]+)\s*[.、]/);

                if (!looksLikeNewTopic) {
                    // 检查是否包含描述性内容（多种格式）
                    const hasColon = line.includes('：') || line.includes(':');
                    const hasQuotes = line.includes('"') || line.includes('"') || line.includes('"');
                    const hasParentheses = line.includes('(') || line.includes('（') || line.includes(')') || line.includes('）');

                    if (hasColon && !hasQuotes && !hasParentheses) {
                        // 可能是 "类型：内容" 格式，但没有前缀星号
                        const parts = line.split(/[:：]/);
                        if (parts.length >= 2) {
                            currentTopic.contents.push({
                                type: parts[0].trim(),
                                text: parts.slice(1).join('：').trim()
                            });
                        } else {
                            currentTopic.contents.push({
                                type: '内容',
                                text: line
                            });
                        }
                    } else if (hasQuotes || hasParentheses || line.length > 15) {
                        // 看起来是描述性内容
                        currentTopic.contents.push({
                            type: '内容',
                            text: line
                        });
                    }
                }
            }
        }

        if (currentTopic) {
            topics.push(currentTopic);
        }

        return topics;
    }

    getIconForTopic(index) {
        const icons = ['💡', '🛠️', '📊', '🎯', '🔥', '⚡', '🌟', '💪'];
        return icons[index % icons.length];
    }

    generateTopicsHTML(topics) {
        return topics.map((topic, index) => {
            const contentsHTML = topic.contents.map(content => {
                // 检查内容类型，处理特殊符号
                let cleanType = content.type.replace(/[：:]/g, '').trim();
                let cleanText = content.text.trim();

                return `
                    <div class="content-block">
                        <h4>${cleanType}：</h4>
                        <p>${cleanText}</p>
                    </div>
                `;
            }).join('');

            return `
                <div class="topic-card">
                    <div class="topic-header">
                        <div class="topic-icon icon-${this.getColorClass(index)}">
                            <span>${topic.icon}</span>
                        </div>
                        <h3 class="topic-title">${topic.title}</h3>
                    </div>
                    ${contentsHTML}
                </div>
            `;
        }).join('');
    }

    getColorClass(index) {
        const colors = ['blue', 'purple', 'red', 'orange', 'green', 'yellow', 'pink', 'indigo'];
        return colors[index % colors.length];
    }

    getTemplate() {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>技术群聊日报</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 80px;
            height: 80px;
            border-radius: 16px;
            margin-bottom: 20px;
        }

        .logo span {
            display: inline-block;
            width: 100%;
            height: 100%;
            line-height: 80px;
            text-align: center;
            font-size: 40px;
        }

        .title {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
        }

        .subtitle {
            color: #6b7280;
            font-size: 20px;
            margin-bottom: 16px;
        }

        .tags {
            display: flex;
            justify-content: center;
            gap: 12px;
            flex-wrap: wrap;
        }

        .tag {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .tag-blue {
            background: #dbeafe;
            color: #1e40af;
        }

        .tag-purple {
            background: #f3e8ff;
            color: #6b21a8;
        }

        .tag-green {
            background: #dcfce7;
            color: #166534;
        }

        .main-content {
            max-width: 800px;
            margin: 0 auto;
            margin-bottom: 40px;
        }

        .topic-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #f3f4f6;
            margin-bottom: 24px;
            transition: all 0.3s ease;
        }

        .topic-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .topic-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .topic-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            flex-shrink: 0;
        }

        .topic-icon span {
            display: inline-block;
            width: 100%;
            height: 100%;
            line-height: 48px;
            text-align: center;
            font-size: 28px;
        }

        .icon-blue { background: #3b82f6; }
        .icon-purple { background: #8b5cf6; }
        .icon-red { background: #ef4444; }
        .icon-orange { background: #f97316; }
        .icon-green { background: #10b981; }
        .icon-yellow { background: #f59e0b; }
        .icon-pink { background: #ec4899; }
        .icon-indigo { background: #6366f1; }

        .topic-title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
        }

        .content-block {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
        }

        .content-block h4 {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 8px;
        }

        .content-block p {
            color: #78350f;
            line-height: 1.6;
        }

        .golden-quote {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.2);
            margin-bottom: 24px;
            text-align: center;
        }

        .golden-quote h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
        }

        .quote-content {
            background: linear-gradient(135deg, #dbeafe 0%, #f3e8ff 100%);
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 16px;
        }

        .quote-text {
            font-style: italic;
            color: #374151;
            margin-bottom: 12px;
            font-size: 16px;
            line-height: 1.6;
        }

        .quote-author {
            color: #6b7280;
            font-size: 14px;
        }

        .footer {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 32px;
            position: relative;
        }

        .footer-info h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .footer-info p {
            color: #6b7280;
            font-size: 14px;
        }

        .footer-meta {
            display: flex;
            align-items: center;
            gap: 32px;
        }

        .footer-date {
            text-align: right;
        }

        .footer-date p {
            font-size: 14px;
            color: #9ca3af;
            margin-bottom: 4px;
        }

        .footer-date .date {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
        }

        .footer-qr {
            text-align: right;
        }

        .footer-qr h4 {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .footer-qr .qr-placeholder {
            width: 96px;
            height: 96px;
            margin: 0;
            background: #f3f4f6;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            overflow: hidden;
        }

        .footer-qr .qr-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .footer-note {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }

        @media (max-width: 768px) {
            .main-content {
                padding: 0 16px;
            }

            .footer-content {
                flex-direction: column;
                text-align: center;
                gap: 24px;
            }

            .footer-qr {
                text-align: center;
                margin-top: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">
                <span>💬</span>
            </div>
            <h1 class="title">技术群聊日报</h1>
            <p class="subtitle">{{DATE}}</p>
            <div class="tags">
                <span class="tag tag-blue">技术讨论</span>
                <span class="tag tag-purple">实战分享</span>
                <span class="tag tag-green">每日干货</span>
            </div>
        </header>

        <div class="main-content">
            {{TOPICS_PLACEHOLDER}}

            <div class="golden-quote">
                <h3>今日金句</h3>
                <div class="quote-content">
                    <p class="quote-text">"持续学习和分享是技术成长的最佳路径。"</p>
                    <p class="quote-author">— 群友智慧</p>
                </div>
            </div>
        </div>

        <footer class="footer">
            <div class="footer-content">
                <div class="footer-info">
                    <h3>技术群聊日报</h3>
                    <p>每日技术干货，助力成长之路</p>
                </div>
                <div class="footer-meta">
                    <div class="footer-date">
                        <p>更新时间</p>
                        <p class="date">{{DATE}}</p>
                    </div>
                    <div class="footer-qr">
                        <h4>扫码加入讨论</h4>
                        <div class="qr-placeholder">
                            {{QR_CODE}}
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-note">
                💡 本文由技术群聊内容整理，更多优质内容请扫码加入讨论群
            </div>
        </footer>
    </div>
</body>
</html>`;
    }

    getDefaultQRCode() {
        return `<svg width="96" height="96" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z"/>
        </svg>`;
    }

    // UI渲染
    renderHistory() {
        const historyList = document.getElementById('historyList');

        if (this.reports.length === 0) {
            historyList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p class="text-sm">暂无日报</p>
                    <p class="text-xs text-gray-400 mt-1">点击右上角 + 创建第一个日报</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = this.reports.map(report => `
            <div class="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition-all ${this.currentReport?.id === report.id ? 'border-blue-500 bg-blue-50' : ''}" onclick="app.selectReport('${report.id}')">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">${report.date}</div>
                        <div class="text-xs text-gray-500 mt-1">${new Date(report.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div class="flex items-center space-x-1 ml-2">
                        <button onclick="event.stopPropagation(); app.editReport('${report.id}')" class="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="event.stopPropagation(); app.confirmDeleteReport('${report.id}')" class="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPreview() {
        const container = document.getElementById('previewContainer');
        const title = document.getElementById('previewTitle');
        const actions = document.getElementById('previewActions');

        if (!this.currentReport) {
            container.innerHTML = `
                <div class="text-center text-gray-500">
                    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>选择或创建一个日报开始</p>
                </div>
            `;
            title.textContent = '选择一个日报查看';
            actions.style.display = 'none';
            return;
        }

        title.textContent = `${this.currentReport.date} 的日报`;
        actions.style.display = 'flex';

        // 确保当前报告有HTML内容
        if (!this.currentReport.html) {
            this.currentReport.html = this.generateHTML(this.currentReport.date, this.currentReport.content || '');
        }

        // 确保HTML内容是字符串
        if (typeof this.currentReport.html !== 'string') {
            console.error('HTML内容不是字符串:', typeof this.currentReport.html);
            this.currentReport.html = '<div><h1>内容加载失败</h1></div>';
        }

        // 使用Blob URL方式渲染iframe，避免HTML转义问题
        // 注入缩放样式到HTML中
        let htmlWithZoom = this.currentReport.html;

        // 在</head>前插入缩放样式
        const zoomStyle = `
        <style id="zoom-style">
            body {
                zoom: ${this.zoom};
            }
        </style>
        `;
        htmlWithZoom = htmlWithZoom.replace('</head>', zoomStyle + '</head>');

        const blob = new Blob([htmlWithZoom], { type: 'text/html; charset=utf-8' });
        const blobURL = URL.createObjectURL(blob);

        container.innerHTML = `
            <div class="preview-container ${this.currentFont}">
                <div class="preview-frame">
                    <iframe src="${blobURL}" onload="setTimeout(() => { try { URL.revokeObjectURL('${blobURL}'); } catch(e) { console.warn('清理iframe URL失败:', e); } }, 100)"></iframe>
                </div>
            </div>
        `;
    }

    async selectReport(id) {
        // 如果当前是只读模式，需要从公共API获取完整内容
        if (!this.currentUser) {
            try {
                const response = await fetch(`${this.apiBase}/public/reports/${id}`);
                if (response.ok) {
                    this.currentReport = await response.json();
                } else {
                    this.currentReport = this.getReport(id); // fallback到本地数据
                }
            } catch (error) {
                console.error('获取完整报告失败:', error);
                this.currentReport = this.getReport(id); // fallback到本地数据
            }
        } else {
            this.currentReport = this.getReport(id);
        }

        this.renderHistory();
        this.renderPreview();
        
        // 移动端选择报告后自动收起侧边栏
        this.setMobileSidebar(false);
    }

    // 模态框管理
    showCreateModal() {
        document.getElementById('createModal').classList.remove('hidden');
        document.getElementById('modalTitle').textContent = '创建新日报';
        document.getElementById('reportDate').value = new Date().toISOString().split('T')[0];

        // 清空编辑器内容
        if (this.markdownEditor) {
            // CodeMirror编辑器
            this.markdownEditor.setValue('');
        } else {
            // 后备编辑器
            const textarea = document.getElementById('fallbackMarkdownEditor');
            if (textarea) {
                textarea.value = '';
            }
        }

        document.getElementById('reportContent').value = '';

        // 重置字体选择为默认值
        const fontSelect = document.getElementById('reportFont');
        if (fontSelect) {
            fontSelect.value = 'font-noto-sans';
        }

        // 清除QR码上传和预览
        document.getElementById('qrcodeUpload').value = '';
        document.getElementById('qrcodePreview').classList.add('hidden');

        this.currentEditingId = null;
    }

    hideCreateModal() {
        document.getElementById('createModal').classList.add('hidden');
    }

    showLoginModal() {
        console.log('🔑 显示登录页面');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('loginPage').classList.remove('hidden');
    }

    showLoginPage() {
        console.log('🔐 显示登录页面');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('loginPage').classList.remove('hidden');
        this.updateCurrentUserDisplay();
    }

    showMainApp() {
        console.log('🏠 显示主应用界面');
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        this.updateCurrentUserDisplay();
    }

    showReadOnlyMode() {
        console.log('📖 显示只读模式');
        this.currentUser = null;
        this.updateCurrentUserDisplay();
        // 隐藏登录页面
        document.getElementById('loginPage').classList.add('hidden');
        // 显示主应用界面（无编辑功能）
        document.getElementById('app').classList.remove('hidden');

        // 添加示例数据，让用户看到内容
        this.reports = [
            {
                id: 'demo-1',
                date: '2025-11-03',
                content: `2025-11-03

1. 技术讨论

- 前端框架选择
- React vs Vue.js
- 性能优化策略

2. 项目进展

- 用户界面设计完成
- 后端API开发中
- 移动端适配进行中

3. 学习心得

- TypeScript提高代码质量
- 组件化开发提高复用性
- 测试覆盖率的重要性`,
                createdAt: new Date().toISOString()
            }
        ];
        this.currentReport = this.reports[0];
        this.renderHistory();
        this.renderPreview();
        // 显示只读提示
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.innerHTML = '<span class="text-sm text-gray-500">访客模式 - 仅查看</span>';
        }
    }

    updateCurrentUserDisplay() {
        const currentUserSpan = document.getElementById('currentUser');
        if (!currentUserSpan) {
            console.warn('⚠️ 未找到用户显示元素 #currentUser');
            return;
        }

        if (this.currentUser && (this.currentUser.username || this.currentUser.name)) {
            currentUserSpan.textContent = this.currentUser.username || this.currentUser.name;
        } else {
            currentUserSpan.textContent = '访客';
        }
    }

    setMobileSidebar(isOpen) {
        const sidebar = document.querySelector('#app > div:first-child');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (!sidebar) {
            return;
        }

        // 设置侧边栏打开/关闭状态
        sidebar.classList.toggle('mobile-sidebar-open', isOpen);
        
        // 设置遮罩显示/隐藏
        if (overlay) {
            overlay.classList.toggle('active', isOpen);
        }
        
        console.log(`📱 移动端侧边栏${isOpen ? '打开' : '关闭'}`);
    }

    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    showExportModal() {
        document.getElementById('exportModal').classList.remove('hidden');
    }

    hideExportModal() {
        document.getElementById('exportModal').classList.add('hidden');
    }

    showShareModal() {
        // 检测是否支持原生分享API
        if (navigator.share) {
            document.getElementById('nativeShareBtn').classList.remove('hidden');
        }
        document.getElementById('shareModal').classList.remove('hidden');
    }

    hideShareModal() {
        document.getElementById('shareModal').classList.add('hidden');
    }

    // 分享功能
    shareReport() {
        if (!this.currentReport) {
            alert('请先选择一个日报');
            return;
        }
        this.showShareModal();
    }

    async shareAsFile() {
        if (!this.currentReport) return;

        try {
            // 生成独立网页ID
            const pageId = this.currentReport.id;
            const pageUrl = `${window.location.origin}/page/${pageId}`;

            // 调用API保存独立网页
            const response = await fetch(`${this.apiBase}/page/${pageId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    html: this.currentReport.html,
                    title: `${this.currentReport.date} 技术日报`
                })
            });

            if (!response.ok) {
                throw new Error('生成独立网页失败');
            }

            // 复制网页链接到剪贴板
            await navigator.clipboard.writeText(pageUrl);

            this.hideShareModal();

            // 显示成功提示，包含链接
            this.showSuccessNotification(`
                <div>
                    <div style="font-weight: 600; margin-bottom: 8px;">独立网页已生成！</div>
                    <div style="font-size: 13px; opacity: 0.9;">链接已复制到剪贴板</div>
                    <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">${pageUrl}</div>
                </div>
            `);

            // 在新标签页打开网页
            window.open(pageUrl, '_blank');

        } catch (error) {
            console.error('生成独立网页失败:', error);
            alert('生成独立网页失败: ' + error.message);
        }
    }

    async copyHTML() {
        if (!this.currentReport) return;

        try {
            await navigator.clipboard.writeText(this.currentReport.html);
            this.hideShareModal();
            this.showSuccessNotification('HTML代码已复制到剪贴板！');
        } catch (err) {
            alert('复制失败：' + err.message);
        }
    }

    async nativeShare() {
        if (!this.currentReport) return;

        if (!navigator.share) {
            alert('您的浏览器不支持原生分享功能');
            return;
        }

        try {
            // 创建临时文件用于分享
            const blob = new Blob([this.currentReport.html], { type: 'text/html' });
            const file = new File([blob], `${this.currentReport.date}-技术日报.html`, { type: 'text/html' });

            await navigator.share({
                title: `${this.currentReport.date} 技术日报`,
                text: '技术群聊日报分享',
                files: [file]
            });

            this.hideShareModal();
        } catch (err) {
            if (err.name !== 'AbortError') {
                alert('分享失败：' + err.message);
            }
        }
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999; animation: slideIn 0.3s ease-out;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span style="font-weight: 600;">${message}</span>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    // 编辑功能
    editReport(id) {
        const report = this.getReport(id);
        if (!report) return;

        this.currentEditingId = id;
        document.getElementById('createModal').classList.remove('hidden');
        document.getElementById('modalTitle').textContent = '编辑日报';
        document.getElementById('reportDate').value = report.date;

        // 设置编辑器内容
        if (this.markdownEditor) {
            // CodeMirror编辑器
            this.markdownEditor.dispatch({
                changes: {
                    from: 0,
                    to: this.markdownEditor.state.doc.length,
                    insert: report.content
                }
            });
        } else {
            // 后备编辑器
            const textarea = document.getElementById('fallbackMarkdownEditor');
            if (textarea) {
                textarea.value = report.content;
            }
        }

        document.getElementById('reportContent').value = report.content;

        // 设置字体选择
        const fontSelect = document.getElementById('reportFont');
        if (fontSelect && report.font) {
            fontSelect.value = report.font;
        }

        // 显示QR码预览（如果有）
        if (report.qrcode) {
            document.getElementById('qrcodePreviewImg').src = report.qrcode;
            document.getElementById('qrcodePreview').classList.remove('hidden');
        } else {
            document.getElementById('qrcodePreview').classList.add('hidden');
        }
    }

    editCurrent() {
        if (this.currentReport) {
            this.editReport(this.currentReport.id);
        }
    }

    async saveReport() {
        const date = document.getElementById('reportDate').value;
        const content = document.getElementById('reportContent').value;
        const font = document.getElementById('reportFont').value;

        if (!date || !content.trim()) {
            alert('请填写日期和内容');
            return;
        }

        // 获取QR码文件（如果有上传）
        const qrcodeFile = document.getElementById('qrcodeUpload').files[0];

        try {
            if (this.currentEditingId) {
                const updated = await this.updateReport(this.currentEditingId, date, content, font, qrcodeFile);
                if (updated && this.currentReport?.id === this.currentEditingId) {
                    this.currentReport = updated;
                    this.renderPreview();
                }
            } else {
                const newReport = await this.createReport(date, content, font, qrcodeFile);
                this.selectReport(newReport.id);
            }

            this.hideCreateModal();
        } catch (error) {
            alert('保存失败: ' + error.message);
        }
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async confirmDeleteReport(id) {
        if (confirm('确定要删除这个日报吗？')) {
            // 删除确认
            if (confirm('删除后无法恢复，确定继续吗？')) {
                try {
                    await this.deleteReport(id);
                    alert('删除成功！');
                } catch (error) {
                    alert('删除失败: ' + error.message);
                }
            }
        }
    }

    // 设置功能
    changeFont() {
        const fontSelect = document.getElementById('fontSelect');
        this.currentFont = fontSelect.value;

        // 更新预览
        if (this.currentReport) {
            this.currentReport.html = this.generateHTML(this.currentReport.date, this.currentReport.content);
            this.renderPreview();
        }

        // 保存设置
        this.saveSettings();
    }

    uploadQRCode() {
        const fileInput = document.getElementById('qrCodeUpload');
        const file = fileInput.files[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = `<img src="${e.target.result}" alt="QR Code" style="width: 100%; height: 100%; object-fit: cover;">`;
            this.customQRCode = img;

            document.getElementById('qrCodeStatus').textContent = '已上传自定义二维码';
            document.getElementById('qrCodePreview').classList.remove('hidden');
            document.getElementById('qrCodeImage').src = e.target.result;

            // 更新预览
            if (this.currentReport) {
                this.currentReport.html = this.generateHTML(this.currentReport.date, this.currentReport.content);
                this.renderPreview();
            }

            this.saveSettings();
        };

        reader.readAsDataURL(file);
    }

    // 数据管理
    exportData() {
        const dataStr = JSON.stringify(this.reports, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `daily-reports-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    }

    clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            if (confirm('请再次确认：删除所有日报数据？')) {
                this.reports = [];
                this.currentReport = null;
                this.saveReports();
                this.renderHistory();
                this.renderPreview();
                alert('所有数据已清除');
            }
        }
    }

    saveSettings() {
        const settings = {
            font: this.currentFont,
            customQRCode: this.customQRCode
        };
        localStorage.setItem('dailyReportSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const stored = localStorage.getItem('dailyReportSettings');
        if (stored) {
            const settings = JSON.parse(stored);
            this.currentFont = settings.font || 'font-noto-sans';
            this.customQRCode = settings.customQRCode || null;

            document.getElementById('fontSelect').value = this.currentFont;

            if (this.customQRCode) {
                document.getElementById('qrCodeStatus').textContent = '已上传自定义二维码';
                // 由于安全限制，这里无法直接显示保存的图片
            }
        }
    }

    // 缩放功能
    zoomIn() {
        if (this.zoom < 2.0) { // 最大放大到200%
            this.zoom = Math.min(2.0, this.zoom + 0.1);
            this.renderPreview();
        }
    }

    zoomOut() {
        if (this.zoom > 0.3) { // 最小缩小到30%
            this.zoom = Math.max(0.3, this.zoom - 0.1);
            this.renderPreview();
        }
    }

    resetZoom() {
        this.zoom = 1.0; // 重置为100%
        this.renderPreview();
    }

    // 导出功能
    exportToPNG() {
        if (!this.currentReport) {
            alert('请先选择一个日报');
            return;
        }
        this.showExportModal();
    }

    async exportPNG() {
        console.log('🚀 开始简化导出PNG');

        if (!this.currentReport) {
            alert('请先选择一个日报');
            return;
        }

        this.hideExportModal();

        // 显示简化加载提示
        const loadingDiv = this.showExportLoading('PNG');

        try {
            // 创建临时iframe，固定为移动端社交平台标准宽度1080px
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.width = '1080px';
            iframe.style.border = 'none';
            iframe.style.backgroundColor = 'white';

            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            // 准备移动端优化的HTML
            let htmlContent = this.currentReport.html || this.generateHTML(this.currentReport.date, this.currentReport.content);

            const mobileHead = `
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: -apple-system, sans-serif;
                    font-size: 18px;
                    line-height: 1.6;
                    max-width: 1040px;
                    margin: 0 auto;
                }
                * { box-sizing: border-box; }
                img { max-width: 100% !important; height: auto; }
                .container { max-width: 100% !important; padding: 0 !important; }
                .header, .content, .footer { padding: 20px !important; margin: 15px 0 !important; }
                .topic-card { margin: 20px 0 !important; }
                .title { font-size: 24px !important; font-weight: bold !important; margin-bottom: 20px !important; }
                .subtitle { font-size: 20px !important; font-weight: 600 !important; margin: 15px 0 !important; }
            </style>`;

            htmlContent = htmlContent.replace('<head>', `<head>${mobileHead}`);

            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            // 等待加载和渲染
            await new Promise(resolve => {
                iframe.onload = resolve;
            });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 获取内容高度
            const iframeBody = iframeDoc.body;
            const contentHeight = iframeBody.scrollHeight;
            iframe.style.height = contentHeight + 'px';

            console.log(`📱 简化截图: 1080px x ${contentHeight}px`);

            // 简化的html2canvas调用
            const canvas = await html2canvas(iframeBody, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 1080,
                height: contentHeight,
                scale: 1.5 // 降低scale避免过大Canvas，保证清晰度
            });

            console.log('✅ Canvas生成成功:', canvas);

            // 清理iframe
            document.body.removeChild(iframe);

            // 转换为PNG
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Blob转换失败');
                    this.hideExportLoading(loadingDiv);
                    return;
                }

                try {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${this.currentReport.date}-export-${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);

                    setTimeout(() => {
                        try {
                            URL.revokeObjectURL(url);
                        } catch (e) {
                            console.warn('URL清理失败:', e);
                        }
                    }, 1000);

                    console.log('🎉 导出成功!');

                } catch (error) {
                    console.error('下载失败:', error);
                    this.downloadCanvasAsDataURL(canvas);
                } finally {
                    this.hideExportLoading(loadingDiv);
                }
            }, 'image/png', 0.9);

        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
            this.hideExportLoading(loadingDiv);
        }
    }
    downloadCanvasAsDataURL(canvas, config, loadingDiv) {
        try {
            console.log('🔄 使用降级方案：canvas.toDataURL');

            // 限制canvas尺寸以避免数据URL过大
            const maxSize = 8192; // 8K限制
            let width = canvas.width;
            let height = canvas.height;

            if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);

                console.log(`📏 Canvas尺寸调整: ${canvas.width}x${canvas.height} → ${width}x${height}`);
            }

            // 创建缩小的canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');

            // 绘制缩小版本
            tempCtx.drawImage(canvas, 0, 0, width, height);

            // 转换为数据URL
            const dataURL = tempCanvas.toDataURL('image/png', 0.8);

            // 创建下载链接
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `${this.currentReport.date}-export-fallback-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            console.log('✅ 降级下载成功');

        } catch (error) {
            console.error('❌ 降级下载也失败:', error);
            alert('PNG导出失败，请尝试使用服务端生成功能');
        } finally {
            // 移除加载提示
            this.hideExportLoading(loadingDiv);
        }
    }

    // 显示导出加载提示
    showExportLoading(platform) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'export-loading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-size: 18px;
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <div>正在导出 ${platform} 截图...</div>
                <div style="font-size: 14px; color: #ccc; margin-top: 10px;">请稍候，大文件处理需要时间</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }

    // 隐藏导出加载提示
    hideExportLoading(loadingDiv) {
        if (loadingDiv && loadingDiv.parentNode) {
            document.body.removeChild(loadingDiv);
        } else {
            // 备用清理方案
            const loadingElement = document.getElementById('export-loading');
            if (loadingElement) {
                document.body.removeChild(loadingElement);
            }
        }
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM内容加载完成，开始初始化应用');
    try {
        app = new DailyReportManager();
        console.log('✅ 应用初始化成功');
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
    }
});

// 全局函数
function showCreateModal() { app.showCreateModal(); }
function hideCreateModal() { app.hideCreateModal(); }
function showLoginModal() { app.showLoginModal(); }
function enterGuestMode() {
    console.log('👥 进入访客模式');
    app.showReadOnlyMode();
}
function showSettings() { app.showSettings(); }
function hideSettings() { app.hideSettings(); }
function showExportModal() { app.showExportModal(); }
function hideExportModal() { app.hideExportModal(); }
function showShareModal() { app.showShareModal(); }
function hideShareModal() { app.hideShareModal(); }
function saveReport() { app.saveReport(); }
function editCurrent() { app.editCurrent(); }
function exportToPNG() { app.exportToPNG(); }
function exportPNG(platform) { app.exportPNG(platform); }
function shareReport() { app.shareReport(); }
function shareAsFile() { app.shareAsFile(); }
function copyHTML() { app.copyHTML(); }
function nativeShare() { app.nativeShare(); }
function changeFont() { app.changeFont(); }
function uploadQRCode() { app.uploadQRCode(); }
function exportData() { app.exportData(); }
function clearAllData() { app.clearAllData(); }
function zoomIn() { app.zoomIn(); }
function zoomOut() { app.zoomOut(); }
function resetZoom() { app.resetZoom(); }

// 登录相关全局函数
async function login(event) {
    event.preventDefault();

    console.log('🚀 登录函数被调用');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');

    console.log('📝 登录信息:', { username, passwordLength: password?.length });

    // 显示加载状态
    loginBtn.disabled = true;
    loginBtnText.textContent = '登录中...';
    loginSpinner.classList.remove('hidden');
    loginError.classList.add('hidden');

    try {
        console.log('🔄 开始调用 app.login...');
        await app.login(username, password);
        console.log('✅ app.login 成功');
        app.showMainApp();
    } catch (error) {
        console.error('❌ 登录失败:', error);
        loginError.textContent = error.message;
        loginError.classList.remove('hidden');
    } finally {
        // 恢复按钮状态
        loginBtn.disabled = false;
        loginBtnText.textContent = '登录';
        loginSpinner.classList.add('hidden');
    }
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        app.logout();
    }
}

// QR码预览和清除功能
function clearQRCode() {
    document.getElementById('qrcodeUpload').value = '';
    document.getElementById('qrcodePreview').classList.add('hidden');
}

// 监听QR码上传，显示预览
document.addEventListener('DOMContentLoaded', () => {
    const qrcodeUpload = document.getElementById('qrcodeUpload');
    if (qrcodeUpload) {
        qrcodeUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('qrcodePreviewImg').src = event.target.result;
                    document.getElementById('qrcodePreview').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});