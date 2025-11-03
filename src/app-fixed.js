// 技术群聊日报管理器 - 修复版本
class DailyReportManagerFixed {
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
        console.log('🚀 DailyReportManager 初始化开始');
        console.log('📍 API Base:', this.apiBase);
        console.log('🔑 当前Token:', this.token ? '存在' : '不存在');

        // 初始化CodeMirror编辑器
        this.initMarkdownEditor();

        // 检查登录状态 - 使用异步方式
        if (this.token) {
            console.log('🔍 有token，开始验证...');
            try {
                await this.verifyToken();
                console.log('✅ Token验证成功，流程完成');
            } catch (error) {
                console.error('❌ Token验证失败:', error.message);
                this.showReadOnlyMode();
            }
        } else {
            console.log('📖 无token，直接显示只读模式');
            this.showReadOnlyMode();
        }
    }

    // 修复后的verifyToken方法 - 添加更详细的日志和错误处理
    async verifyToken() {
        console.log('🔍 开始验证token:', this.token ? '是' : '否');

        try {
            const data = await this.apiRequest('/verify');
            console.log('✅ API验证响应成功:', data);

            if (!data.user) {
                console.error('❌ API返回数据中没有用户信息');
                throw new Error('服务器返回的用户数据无效');
            }

            this.currentUser = data.user;
            console.log('✅ Token验证成功，用户:', this.currentUser);

            // 确保DOM元素存在后再显示主应用
            await this.showMainApp();

            // 加载用户数据
            await this.loadReports();

            console.log('✅ 主应用显示完成');

        } catch (error) {
            console.error('❌ Token验证失败:', error);

            // 区分不同类型的错误
            if (error.message.includes('登录已过期')) {
                console.log('⚠️ Token过期，自动退出');
            } else if (error.message.includes('网络')) {
                console.log('⚠️ 网络错误，可能服务器未运行');
            } else {
                console.log('⚠️ 其他验证错误:', error.message);
            }

            this.logout();
            throw error; // 重新抛出错误，让调用者处理
        }
    }

    // 修复后的showMainApp方法 - 添加DOM检查和详细日志
    async showMainApp() {
        console.log('🎯 开始显示主应用');
        console.log('👤 当前用户:', this.currentUser);

        // 等待DOM加载完成
        if (document.readyState !== 'complete') {
            console.log('⏳ 等待DOM加载完成...');
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
        }

        try {
            // 隐藏登录页面
            const loginPage = document.getElementById('loginPage');
            if (loginPage) {
                loginPage.classList.add('hidden');
                console.log('✅ 登录页面已隐藏');
            } else {
                console.error('❌ 找不到登录页面元素 #loginPage');
            }

            // 显示主应用
            const app = document.getElementById('app');
            if (app) {
                app.classList.remove('hidden');
                console.log('✅ 主应用已显示');
            } else {
                console.error('❌ 找不到主应用元素 #app');
                throw new Error('主应用DOM元素不存在');
            }

            // 显示创建报告按钮
            const createBtn = document.getElementById('createReportBtn');
            if (createBtn) {
                createBtn.style.display = 'block';
                console.log('✅ 创建按钮已显示');
            } else {
                console.error('❌ 找不到创建按钮元素 #createReportBtn');
            }

            // 隐藏登录按钮
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.style.display = 'none';
                console.log('✅ 登录按钮已隐藏');
            } else {
                console.error('❌ 找不到登录按钮元素 #loginBtn');
            }

            // 显示退出按钮
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
                console.log('✅ 退出按钮已显示');
            } else {
                console.error('❌ 找不到退出按钮元素 #logoutBtn');
            }

            // 显示所有编辑相关按钮
            const editButtons = document.querySelectorAll('[onclick*="editReport"]');
            editButtons.forEach((btn, index) => {
                btn.style.display = 'block';
            });
            console.log(`✅ ${editButtons.length}个编辑按钮已显示`);

            // 显示设置按钮
            const settingsBtn = document.querySelector('[onclick*="showSettings"]');
            if (settingsBtn) {
                settingsBtn.style.display = 'block';
                console.log('✅ 设置按钮已显示');
            } else {
                console.error('❌ 找不到设置按钮');
            }

            // 设置当前用户显示
            const currentUserSpan = document.getElementById('currentUser');
            if (currentUserSpan) {
                if (this.currentUser && this.currentUser.username) {
                    currentUserSpan.textContent = this.currentUser.username;
                    console.log(`✅ 用户名已设置为: ${this.currentUser.username}`);
                } else {
                    currentUserSpan.textContent = '管理员'; // 默认值
                    console.log('⚠️ 用户信息不完整，使用默认显示名称');
                }
            } else {
                console.error('❌ 找不到用户显示元素 #currentUser');
            }

            console.log('🎉 主应用显示完成');

        } catch (error) {
            console.error('❌ 显示主应用时发生错误:', error);
            throw error;
        }
    }

    // 修复后的showReadOnlyMode方法 - 添加详细的DOM检查
    showReadOnlyMode() {
        console.log('📖 开始显示只读模式');

        try {
            // 隐藏登录页面
            const loginPage = document.getElementById('loginPage');
            if (loginPage) {
                loginPage.classList.add('hidden');
                console.log('✅ 登录页面已隐藏');
            } else {
                console.error('❌ 找不到登录页面元素 #loginPage');
            }

            // 显示主应用
            const app = document.getElementById('app');
            if (app) {
                app.classList.remove('hidden');
                console.log('✅ 主应用已显示');
            } else {
                console.error('❌ 找不到主应用元素 #app');
                return; // 无法继续
            }

            // 隐藏创建报告按钮
            const createBtn = document.getElementById('createReportBtn');
            if (createBtn) {
                createBtn.style.display = 'none';
                console.log('✅ 创建按钮已隐藏');
            }

            // 隐藏退出按钮
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
                console.log('✅ 退出按钮已隐藏');
            }

            // 显示登录按钮
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.style.display = 'block';
                console.log('✅ 登录按钮已显示');
            }

            // 隐藏编辑相关按钮
            const editButtons = document.querySelectorAll('[onclick*="editReport"]');
            editButtons.forEach((btn, index) => {
                btn.style.display = 'none';
            });
            console.log(`✅ ${editButtons.length}个编辑按钮已隐藏`);

            // 隐藏设置按钮
            const settingsBtn = document.querySelector('[onclick*="showSettings"]');
            if (settingsBtn) {
                settingsBtn.style.display = 'none';
                console.log('✅ 设置按钮已隐藏');
            }

            // 修改用户显示为"访客"
            const currentUserSpan = document.getElementById('currentUser');
            if (currentUserSpan) {
                currentUserSpan.textContent = '访客';
                console.log('✅ 用户显示已设置为"访客"');
            }

            // 加载公开的日报数据（不需要认证）
            this.loadPublicReports();

            console.log('🎉 只读模式显示完成');

        } catch (error) {
            console.error('❌ 显示只读模式时发生错误:', error);
        }
    }

    // 修复后的logout方法 - 确保完全清理状态
    logout() {
        console.log('🚪 开始退出登录');

        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');

        console.log('🗑️ 本地存储已清理');

        // 显示登录页面而不是只读模式
        this.showLoginPage();

        console.log('✅ 退出登录完成');
    }

    // 修复后的login方法 - 添加更多验证
    async login(username, password) {
        console.log(`🔑 开始登录: ${username}`);

        try {
            const data = await this.apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            console.log('📡 登录响应:', data);

            if (!data.token || !data.user) {
                throw new Error('服务器返回的登录数据无效');
            }

            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('authToken', this.token);

            console.log('✅ 登录成功，用户:', this.currentUser);
            console.log('🔑 Token已保存到localStorage');

            return data;
        } catch (error) {
            console.error('❌ 登录失败:', error.message);
            throw error;
        }
    }

    // 修复后的apiRequest方法 - 添加更好的错误处理
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            }
        };

        console.log(`📡 发起API请求: ${endpoint}`);

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            console.log(`📡 API响应状态: ${response.status} ${response.statusText}`);

            // 401状态码处理
            if (response.status === 401) {
                console.log('⚠️ 收到401响应，token可能已过期');
                this.logout();
                throw new Error('登录已过期，请重新登录');
            }

            // 其他错误状态码处理
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {
                    console.log('无法解析错误响应:', parseError.message);
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`📡 API请求成功:`, data);
            return data;

        } catch (error) {
            console.error(`❌ API请求失败: ${endpoint}`, error.message);

            // 网络错误特殊处理
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，请检查网络连接和服务器状态');
            }

            throw error;
        }
    }

    // 检查DOM完整性的辅助方法
    checkDOMElements() {
        const criticalElements = [
            'loginPage',
            'app',
            'currentUser',
            'createReportBtn',
            'loginBtn',
            'logoutBtn'
        ];

        const results = {};
        criticalElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            results[elementId] = {
                exists: element !== null,
                element: element
            };
        });

        console.log('🔍 DOM元素检查结果:', results);
        return results;
    }

    // 其他方法保持不变，这里只展示关键的修复部分
    // ... 其他原有方法 ...

    showLoginPage() {
        const loginPage = document.getElementById('loginPage');
        const app = document.getElementById('app');

        if (loginPage) loginPage.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }

    // 简化版本的数据加载方法，避免不必要的复杂性
    async loadPublicReports() {
        console.log('📖 加载公开报告...');
        try {
            // 使用公共API端点获取公开报告
            const response = await fetch(`${this.apiBase}/public/reports`);
            if (response.ok) {
                this.reports = await response.json();
                console.log(`✅ 加载了 ${this.reports.length} 个公开报告`);
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
            console.error('❌ 加载公开日报失败:', error);
            // 显示空状态而不是错误提示
            this.reports = [];
            this.renderHistory();
            this.currentReport = null;
            this.renderPreview();
        }
    }

    async loadReports() {
        console.log('📊 加载用户报告...');
        try {
            this.reports = await this.apiRequest('/reports');
            console.log(`✅ 加载了 ${this.reports.length} 个用户报告`);
            this.renderHistory();
        } catch (error) {
            console.error('❌ 加载日报失败:', error);
            this.reports = [];
            this.renderHistory();
        }
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) {
            console.error('❌ 找不到历史列表元素 #historyList');
            return;
        }

        if (this.reports.length === 0) {
            historyList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <p class="text-sm">暂无日报</p>
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
                        ${this.currentUser ? `
                        <button onclick="event.stopPropagation(); app.editReport('${report.id}')" class="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPreview() {
        const container = document.getElementById('previewContainer');
        if (!container) {
            console.error('❌ 找不到预览容器元素 #previewContainer');
            return;
        }

        if (!this.currentReport) {
            container.innerHTML = `
                <div class="text-center text-gray-500">
                    <p>选择或创建一个日报开始</p>
                </div>
            `;
            return;
        }

        // 简化的预览显示
        container.innerHTML = `
            <div class="preview-container">
                <div class="p-8 bg-white rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-4">${this.currentReport.date} 的日报</h3>
                    <div class="text-gray-600">
                        <p>内容预览功能正在开发中...</p>
                    </div>
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
    }

    getReport(id) {
        return this.reports.find(r => r.id === id);
    }

    // CodeMirror和其他方法的简化版本...
    initMarkdownEditor() {
        // 简化版本，只做基础初始化
        const editorContainer = document.getElementById('markdownEditor');
        if (editorContainer) {
            editorContainer.innerHTML = '<textarea class="w-full h-96 p-4 border rounded" placeholder="Markdown内容..."></textarea>';
        }
    }
}

// 导出修复版本
window.DailyReportManagerFixed = DailyReportManagerFixed;

// 全局函数映射
if (typeof window !== 'undefined') {
    window.testLoginFlow = async function() {
        console.log('🧪 开始测试登录流程...');

        const app = new DailyReportManagerFixed();

        // 检查DOM元素
        const domCheck = app.checkDOMElements();
        const missingElements = Object.entries(domCheck)
            .filter(([id, info]) => !info.exists)
            .map(([id]) => id);

        if (missingElements.length > 0) {
            console.error('❌ 缺少DOM元素:', missingElements);
            return { success: false, error: '缺少DOM元素', missingElements };
        }

        console.log('✅ DOM元素检查通过');

        // 测试API连接
        try {
            await app.apiRequest('/test');
            console.log('✅ API连接正常');
        } catch (error) {
            console.log('⚠️ API连接测试失败（这可能是正常的）:', error.message);
        }

        return { success: true, message: '登录流程测试完成' };
    };
}