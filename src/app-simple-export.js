/**
 * 简化的PNG导出功能 - 修复巨大Canvas问题
 */

// 添加到DailyReportManager类的简化导出方法
async exportToPNG() {
    console.log('🚀 开始导出PNG截图');

    if (!this.currentReport) {
        alert('没有选择日报');
        return;
    }

    // 显示加载提示
    const loadingDiv = this.showExportLoading('移动端');

    try {
        // 创建临时iframe用于截图
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '375px'; // iPhone标准宽度，固定
        iframe.style.border = 'none';
        iframe.style.backgroundColor = 'white';

        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        // 写入HTML内容
        let htmlContent = this.currentReport.html || this.generateHTML(this.currentReport.date, this.currentReport.content);

        // 注入移动端优化的head
        const mobileHead = `
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                font-size: 16px;
                line-height: 1.6;
                -webkit-text-size-adjust: 100%;
                box-sizing: border-box;
            }
            * {
                box-sizing: border-box;
            }
            img {
                max-width: 100% !important;
                height: auto !important;
                display: block;
            }
            .preview-container, .container {
                max-width: 100% !important;
                padding: 0 !important;
            }
            .header, .content, .footer {
                padding: 15px !important;
                margin: 10px 0 !important;
            }
            .topic-card {
                margin: 15px 0 !important;
            }
        </style>`;

        htmlContent = htmlContent.replace('<head>', `<head>${mobileHead}`);

        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // 等待页面加载
        await new Promise(resolve => {
            iframe.onload = resolve;
        });

        // 等待渲染完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        const iframeBody = iframeDoc.body;
        const contentHeight = iframeBody.scrollHeight;

        // 设置iframe高度
        iframe.style.height = contentHeight + 'px';

        console.log(`📱 截图尺寸: 375px x ${contentHeight}px`);

        // 简化的html2canvas调用
        const canvas = await html2canvas(iframeBody, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 375,
            height: contentHeight,
            scale: 2, // 适度放大保证清晰度
            scrollX: 0,
            scrollY: 0,
            onclone: (clonedDoc) => {
                console.log('✅ Canvas克隆完成');
                return new Promise(resolve => {
                    setTimeout(resolve, 500); // 给图片一点加载时间
                });
            }
        });

        console.log('✅ Canvas生成成功:', canvas);

        // 移除临时iframe
        document.body.removeChild(iframe);

        // 转换为PNG并下载
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Canvas转换Blob失败 - 使用降级方案');
                this.downloadCanvasAsDataURL(canvas);
                this.hideExportLoading(loadingDiv);
                return;
            }

            try {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${this.currentReport.date}-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // 延迟清理URL
                setTimeout(() => {
                    try {
                        URL.revokeObjectURL(url);
                    } catch (e) {
                        console.warn('清理URL失败:', e);
                    }
                }, 1000);

                console.log('🎉 PNG导出成功!');

            } catch (error) {
                console.error('创建下载链接失败:', error);
                this.downloadCanvasAsDataURL(canvas);
            } finally {
                this.hideExportLoading(loadingDiv);
            }
        }, 'image/png', 0.9);

    } catch (error) {
        console.error('PNG导出失败:', error);
        alert('PNG导出失败，请重试');
        this.hideExportLoading(loadingDiv);
    }
}

// 导出函数，用于替换现有的exportToPNG方法
window.simpleExportToPNG = exportToPNG;

console.log('✅ 简化导出功能已加载');