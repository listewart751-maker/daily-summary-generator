const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = 'your-secret-key-change-in-production'; // 在生产环境中请更改

// 内存数据存储 (Vercel部署时重启会清空，建议配合数据库或定期备份)
let reports = [];
let webPages = {}; // 存储生成的独立网页

// 写死的用户凭据
const HARDCODED_USERS = {
    admin: {
        username: 'admin',
        // 使用固定的哈希值，避免每次重启生成不同的哈希
        // 原始密码: 10kmrr1234
        passwordHash: '$2a$10$7QO4GSKUwLwanCAOuZskXOth.znIz8UOmSH6Hq8tEnB4aQQCVeC/y',
        role: 'admin'
    }
};

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('src'));

// 文件上传配置
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'), false);
        }
    }
});

// JWT验证中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '需要登录' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '无效的令牌' });
        }
        req.user = user;
        next();
    });
};

// 登录路由
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码是必需的' });
    }

    const user = HARDCODED_USERS[username];
    if (!user) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
        return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成JWT
    const token = jwt.sign(
        { username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        message: '登录成功',
        token,
        user: {
            username: user.username,
            role: user.role
        }
    });
});

// 验证令牌路由
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            username: req.user.username,
            role: req.user.role
        }
    });
});

// 获取公开的日报列表（无需认证）
app.get('/api/public/reports', (req, res) => {
    try {
        // 返回所有日报但只包含基本信息，不包含敏感内容
        const publicReports = reports.map(report => ({
            id: report.id,
            date: report.date,
            title: `${report.date} 技术日报`,
            createdAt: report.createdAt,
            font: report.font
            // 不包含完整内容，只用于列表显示
        }));

        // 按创建时间倒序排列
        const sortedReports = publicReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(sortedReports);
    } catch (error) {
        res.status(500).json({ error: '获取公开日报失败' });
    }
});

// 获取所有日报
app.get('/api/reports', authenticateToken, (req, res) => {
    try {
        // 按创建时间倒序排列
        const sortedReports = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(sortedReports);
    } catch (error) {
        res.status(500).json({ error: '获取日报失败' });
    }
});

// 获取单个公开日报（无需认证）
app.get('/api/public/reports/:id', (req, res) => {
    try {
        const { id } = req.params;
        const report = reports.find(r => r.id === id);

        if (!report) {
            return res.status(404).json({ error: '日报不存在' });
        }

        // 返回完整报告内容，但标记为只读
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: '获取日报失败' });
    }
});

// 获取单个日报
app.get('/api/reports/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const report = reports.find(r => r.id === id);

        if (!report) {
            return res.status(404).json({ error: '日报不存在' });
        }

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: '获取日报失败' });
    }
});

// 创建日报
app.post('/api/reports', authenticateToken, upload.single('qrcode'), (req, res) => {
    try {
        const { date, content, font } = req.body;
        const qrcodeData = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;

        if (!date || !content) {
            return res.status(400).json({ error: '日期和内容是必需的' });
        }

        const reportId = uuidv4();
        const now = new Date().toISOString();

        const reportData = {
            id: reportId,
            date,
            content,
            font: font || 'font-inter',
            qrcode: qrcodeData,
            createdAt: now,
            updatedAt: now,
            createdBy: req.user.username
        };

        // 保存到内存
        reports.unshift(reportData);

        res.status(201).json(reportData);
    } catch (error) {
        res.status(500).json({ error: '创建日报失败' });
    }
});

// 更新日报
app.put('/api/reports/:id', authenticateToken, upload.single('qrcode'), (req, res) => {
    try {
        const { id } = req.params;
        const { date, content, font } = req.body;
        const qrcodeData = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;

        const existingIndex = reports.findIndex(r => r.id === id);
        if (existingIndex === -1) {
            return res.status(404).json({ error: '日报不存在' });
        }

        const existingReport = reports[existingIndex];

        // 只有管理员和创建者可以修改
        if (existingReport.createdBy !== req.user.username && req.user.role !== 'admin') {
            return res.status(403).json({ error: '没有权限修改此日报' });
        }

        const updatedReport = {
            ...existingReport,
            date: date || existingReport.date,
            content: content || existingReport.content,
            font: font || existingReport.font,
            qrcode: qrcodeData !== null ? qrcodeData : existingReport.qrcode,
            updatedAt: new Date().toISOString()
        };

        reports[existingIndex] = updatedReport;

        res.json(updatedReport);
    } catch (error) {
        res.status(500).json({ error: '更新日报失败' });
    }
});

// 删除日报
app.delete('/api/reports/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const existingIndex = reports.findIndex(r => r.id === id);

        if (existingIndex === -1) {
            return res.status(404).json({ error: '日报不存在' });
        }

        const existingReport = reports[existingIndex];

        // 只有管理员和创建者可以删除
        if (existingReport.createdBy !== req.user.username && req.user.role !== 'admin') {
            return res.status(403).json({ error: '没有权限删除此日报' });
        }

        reports.splice(existingIndex, 1);

        res.json({ message: '日报已删除' });
    } catch (error) {
        res.status(500).json({ error: '删除日报失败' });
    }
});

// 保存独立网页
app.post('/api/page/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { html, title } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML内容是必需的' });
        }

        // 保存独立网页到内存
        webPages[id] = {
            id: id,
            html: html,
            title: title || '技术日报',
            createdAt: new Date().toISOString(),
            createdBy: req.user.username
        };

        res.json({
            message: '独立网页已生成',
            url: `${req.protocol}://${req.get('host')}/page/${id}`
        });
    } catch (error) {
        res.status(500).json({ error: '保存网页失败' });
    }
});

// 获取独立网页
app.get('/page/:id', (req, res) => {
    try {
        const { id } = req.params;
        const webPage = webPages[id];

        if (!webPage) {
            return res.status(404).send('<h1>页面不存在</h1>');
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(webPage.html);
    } catch (error) {
        res.status(500).send('<h1>服务器错误</h1>');
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器（仅本地开发）
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
        console.log(`📊 内存存储模式 (Vercel部署会重置)`);
        console.log(`🔐 默认登录: admin / 10kmrr1234`);
    });
}

module.exports = app;