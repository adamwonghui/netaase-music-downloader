// 网易云音乐下载器 - 内容脚本
(function() {
    'use strict';

    // 添加插件标识，便于调试
    console.log('🎵 网易云音乐下载器插件已注入');
    console.log('📍 当前URL:', window.location.href);
    console.log('📄 页面标题:', document.title);
    console.log('⏰ 注入时间:', new Date().toLocaleTimeString());

    // 夜间模式状态
    let isDarkMode = false;

    // 提取歌曲ID的函数
    function extractSongId(url = window.location.href) {
        try {
            // 移除URL中的#号
            url = url.replace('#/', '');

            // 使用正则表达式提取ID
            const match = url.match(/[?&]id=(\d+)/);
            if (match) {
                return match[1];
            }

            // 尝试从hash中提取
            const hashMatch = window.location.hash.match(/id=(\d+)/);
            if (hashMatch) {
                return hashMatch[1];
            }

            return null;
        } catch (e) {
            console.error('提取歌曲ID失败:', e);
            return null;
        }
    }

    // 等待元素出现的函数
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // 提取歌曲信息的函数（异步版本）
    async function extractSongInfo() {
        try {
            let songName = '';
            let artistName = '';

            console.log('开始提取歌曲信息...');
            console.log('当前URL:', window.location.href);
            console.log('页面标题:', document.title);

            // 等待页面内容加载完成
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 优先从页面标题提取（这是最可靠的方法）
            console.log('开始从页面标题提取歌曲信息...');
            const title = document.title;
            console.log('完整页面标题:', title);

            if (title && title !== '网易云音乐' && title.includes(' - ')) {
                // 网易云音乐标题格式：歌曲名 - 艺术家 - 专辑类型 - 网易云音乐
                const parts = title.split(' - ');
                console.log('标题分割结果:', parts);

                if (parts.length >= 2) {
                    // 第一部分是歌曲名
                    if (parts[0].trim() && parts[0].trim() !== '网易云音乐') {
                        songName = parts[0].trim();
                        console.log(`✓ 从标题提取歌曲名: "${songName}"`);
                    }

                    // 第二部分是艺术家
                    if (parts[1].trim() && parts[1].trim() !== '网易云音乐') {
                        artistName = parts[1].trim();
                        console.log(`✓ 从标题提取艺术家: "${artistName}"`);
                    }
                }
            }

            // 如果标题提取成功，直接返回结果
            if (songName && artistName) {
                console.log('标题提取成功，跳过DOM查找');
                const result = {
                    songName: songName,
                    artistName: artistName
                };
                console.log('=== 最终提取结果 ===');
                console.log('歌曲名:', result.songName);
                console.log('艺术家:', result.artistName);
                console.log('==================');
                return result;
            }

            // 打印页面的基本信息用于调试
            console.log('标题提取不完整，继续DOM查找...');

            // 更全面的选择器策略
            const songSelectors = [
                // 主要的歌曲标题选择器
                '.g-single .head .info .tit em',           // 经典版歌曲页面
                '.g-single .head .info .tit',              // 经典版标题容器
                '.n-single .head .info .tit em',           // 新版歌曲页面
                '.n-single .head .info .tit',              // 新版标题容器
                '.m-playbar .info .name',                  // 播放栏歌曲名
                '.m-playbar .info .name a',                // 播放栏歌曲链接
                '.m-info .tit em',                         // 信息区域标题
                '.m-info .tit',                            // 信息区域标题容器
                '.lyric-container .tit em',                // 歌词区域标题
                '.song-info .tit em',                      // 歌曲信息标题
                '.song-info .tit',                         // 歌曲信息标题容器
                '.f-ff2',                                  // 通用标题样式
                'h1 em',                                   // h1中的em
                'h1',                                      // h1标签
                '.tit em',                                 // 任何标题中的em
                '.name em',                                // 名称中的em
                '[data-res-action="title"]',               // 数据属性
                '.song-name',                              // 可能的歌曲名类
                '.track-name',                             // 可能的轨道名类
                '.music-name'                              // 可能的音乐名类
            ];

            // 艺术家选择器
            const artistSelectors = [
                '.g-single .head .info .des .s-fc7',       // 经典版艺术家
                '.g-single .head .info .des a',            // 经典版艺术家链接
                '.n-single .head .info .des .s-fc7',       // 新版艺术家
                '.n-single .head .info .des a',            // 新版艺术家链接
                '.m-playbar .info .by',                    // 播放栏艺术家
                '.m-playbar .info .by a',                  // 播放栏艺术家链接
                '.m-info .des .s-fc7',                     // 信息区域艺术家
                '.m-info .des a',                          // 信息区域艺术家链接
                '.lyric-container .des .s-fc7',            // 歌词区域艺术家
                '.song-info .des .s-fc7',                  // 歌曲信息艺术家
                '.des .s-fc7',                             // 描述区域艺术家
                '.by a',                                   // by区域链接
                '[data-res-action="artist"]',              // 数据属性
                '.artist-name',                            // 可能的艺术家类
                '.singer-name'                             // 可能的歌手类
            ];

            // 尝试获取歌曲名称
            console.log('开始查找歌曲名称...');
            for (const selector of songSelectors) {
                try {
                    const elements = document.querySelectorAll(selector);
                    console.log(`选择器 "${selector}" 找到 ${elements.length} 个元素`);

                    for (const element of elements) {
                        const text = element.textContent.trim();
                        console.log(`  元素文本: "${text}"`);

                        if (text &&
                            text !== '网易云音乐' &&
                            text !== 'NetEase Cloud Music' &&
                            text.length > 0 &&
                            text.length < 200 &&
                            !text.includes('发现音乐') &&
                            !text.includes('我的音乐') &&
                            !text.includes('登录') &&
                            !text.includes('下载客户端')) {
                            songName = text;
                            console.log(`✓ 找到歌曲名: "${songName}" (选择器: ${selector})`);
                            break;
                        }
                    }
                    if (songName) break;
                } catch (e) {
                    console.warn(`选择器 ${selector} 出错:`, e);
                }
            }

            // 尝试获取艺术家名称
            console.log('开始查找艺术家名称...');
            for (const selector of artistSelectors) {
                try {
                    const elements = document.querySelectorAll(selector);
                    console.log(`艺术家选择器 "${selector}" 找到 ${elements.length} 个元素`);

                    for (const element of elements) {
                        const text = element.textContent.trim();
                        console.log(`  艺术家元素文本: "${text}"`);

                        if (text && text.length > 0 && text.length < 100) {
                            artistName = text.replace(/^(歌手：|艺术家：|by\s*)/i, '');
                            console.log(`✓ 找到艺术家: "${artistName}" (选择器: ${selector})`);
                            break;
                        }
                    }
                    if (artistName) break;
                } catch (e) {
                    console.warn(`艺术家选择器 ${selector} 出错:`, e);
                }
            }

            // 如果标题提取不完整，尝试从DOM元素补充信息
            if (!songName || !artistName) {
                console.log('标题提取不完整，尝试从DOM元素补充...');
            }

            // 最后的尝试：暴力搜索所有文本节点
            if (!songName || songName === '网易云音乐') {
                console.log('进行暴力搜索...');

                // 搜索所有可能的文本元素
                const allElements = document.querySelectorAll('*');
                const candidates = [];

                for (const element of allElements) {
                    if (element.children.length === 0) { // 叶子节点
                        const text = element.textContent.trim();
                        if (text &&
                            text.length > 2 &&
                            text.length < 100 &&
                            text !== '网易云音乐' &&
                            !text.includes('发现音乐') &&
                            !text.includes('我的音乐') &&
                            !text.includes('登录') &&
                            !text.includes('下载') &&
                            !text.includes('播放') &&
                            !text.includes('暂停') &&
                            !text.includes('上一首') &&
                            !text.includes('下一首') &&
                            !text.includes('收藏') &&
                            !text.includes('分享') &&
                            !/^\d+$/.test(text) && // 不是纯数字
                            !/^[\d:]+$/.test(text)) { // 不是时间格式

                            candidates.push({
                                text: text,
                                element: element,
                                className: element.className,
                                tagName: element.tagName
                            });
                        }
                    }
                }

                console.log('找到候选文本:', candidates.slice(0, 10)); // 只显示前10个

                // 优先选择在特定容器中的文本
                for (const candidate of candidates) {
                    const isInTitleContainer = candidate.element.closest('.tit, .info, .head, .name, .song, .track, .music');
                    if (isInTitleContainer && candidate.text.length > 2) {
                        songName = candidate.text;
                        console.log(`从候选文本中找到歌曲名: "${songName}"`);
                        break;
                    }
                }
            }

            const result = {
                songName: songName || '',
                artistName: artistName || ''
            };

            console.log('=== 最终提取结果 ===');
            console.log('歌曲名:', result.songName);
            console.log('艺术家:', result.artistName);
            console.log('==================');

            return result;

        } catch (e) {
            console.error('提取歌曲信息失败:', e);
            return {
                songName: '',
                artistName: ''
            };
        }
    }

    // 清理文件名的函数
    function sanitizeFilename(filename) {
        // 移除或替换不允许的文件名字符
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')  // 替换不允许的字符
            .replace(/\s+/g, ' ')          // 合并多个空格
            .trim()                        // 移除首尾空格
            .substring(0, 100);            // 限制长度
    }

    // 夜间模式功能
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        console.log('切换夜间模式:', isDarkMode ? '开启' : '关闭');

        if (isDarkMode) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }

        // 保存设置
        chrome.storage.local.set({ darkMode: isDarkMode });

        // 更新按钮文本
        updateDarkModeButton();
    }

    function enableDarkMode() {
        // 创建夜间模式样式 - 恢复有效的反转方案
        const darkModeStyle = document.createElement('style');
        darkModeStyle.id = 'netease-dark-mode-style';
        darkModeStyle.textContent = `
            /* 网易云音乐夜间模式 - 反转方案 */
            body, html {
                filter: invert(1) hue-rotate(180deg) !important;
                background: #1a1a1a !important;
            }

            /* 反转图片和媒体元素，使其恢复正常 */
            img, video, iframe, svg, canvas,
            .u-cover img, .m-info .cover img,
            .m-lyric .img, .avatar img {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            /* 保持插件按钮正常显示 */
            .netease-floating-container,
            .netease-draggable-btn,
            .netease-drag-handle {
                filter: invert(1) hue-rotate(180deg) !important;
            }

            /* 特殊处理：某些图标和装饰性图片保持原色 */
            .icon, .sprite, .ico,
            [class*="icon"], [class*="sprite"], [class*="ico"] {
                filter: invert(1) hue-rotate(180deg) !important;
            }
        `;

        document.head.appendChild(darkModeStyle);
        console.log('夜间模式样式已应用（反转方案）');
        showNotification('夜间模式已开启', 'success');
    }

    function disableDarkMode() {
        console.log('正在关闭夜间模式');
        const darkModeStyle = document.getElementById('netease-dark-mode-style');
        if (darkModeStyle) {
            darkModeStyle.remove();
            console.log('夜间模式样式已移除');
        } else {
            console.log('未找到夜间模式样式元素');
        }
        showNotification('夜间模式已关闭', 'success');
    }

    // 创建可拖动的浮动按钮容器
    function createDraggableFloatingButtons() {
        // 移除旧的按钮
        const oldButtons = document.querySelectorAll('.netease-dark-mode-btn, .netease-floating-download-btn, .netease-floating-container');
        oldButtons.forEach(btn => btn.remove());

        // 创建按钮容器
        const container = document.createElement('div');
        container.className = 'netease-floating-container';
        // 强制设置样式，确保显示
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '999999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '8px';
        container.style.userSelect = 'none';
        container.style.cursor = 'move';
        container.style.padding = '5px';
        container.style.background = 'rgba(0, 0, 0, 0.8)';
        container.style.borderRadius = '25px';
        container.style.backdropFilter = 'blur(10px)';
        container.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';

        // 创建拖动手柄
        const dragHandle = document.createElement('div');
        dragHandle.className = 'netease-drag-handle';
        dragHandle.innerHTML = '⋮⋮';
        dragHandle.style.cssText = `
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            cursor: move;
            padding: 2px;
            line-height: 1;
        `;

        // 创建下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'netease-draggable-btn netease-download-floating';
        downloadBtn.innerHTML = '🎵';
        downloadBtn.title = '下载当前歌曲';
        setButtonStyle(downloadBtn, '#ff6b6b');

        // 创建夜间模式按钮
        const darkModeBtn = document.createElement('button');
        darkModeBtn.className = 'netease-draggable-btn netease-darkmode-floating';
        darkModeBtn.innerHTML = isDarkMode ? '🌞' : '🌙';
        darkModeBtn.title = isDarkMode ? '切换到日间模式' : '切换到夜间模式';
        setButtonStyle(darkModeBtn, isDarkMode ? '#333' : '#6c757d');

        // 添加元素到容器
        container.appendChild(dragHandle);
        container.appendChild(downloadBtn);
        container.appendChild(darkModeBtn);

        // 添加事件监听器
        downloadBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('下载按钮被点击');
            const songId = extractSongId();
            if (songId) {
                downloadSong(songId);
            } else {
                showNotification('请在歌曲页面使用下载功能', 'error');
            }
        });

        darkModeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('夜间模式按钮被点击');
            toggleDarkMode();
        });

        // 添加拖动功能
        makeDraggable(container, dragHandle);

        // 添加悬停效果
        [downloadBtn, darkModeBtn].forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.1)';
                this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            });

            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            });
        });

        console.log('浮动按钮容器已创建');
        return container;
    }

    // 设置按钮样式
    function setButtonStyle(button, bgColor) {
        button.style.background = bgColor;
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '8px';
        button.style.borderRadius = '50%';
        button.style.cursor = 'pointer';
        button.style.fontSize = '16px';
        button.style.fontWeight = '500';
        button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        button.style.transition = 'all 0.3s ease';
        button.style.width = '36px';
        button.style.height = '36px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.border = '2px solid rgba(255, 255, 255, 0.3)';
        button.style.visibility = 'visible';
        button.style.opacity = '1';
        button.style.pointerEvents = 'auto';
    }

    // 使元素可拖动
    function makeDraggable(element, dragHandle) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        // 使用拖动手柄或整个容器作为拖动区域
        const dragArea = dragHandle || element;

        dragArea.addEventListener('mousedown', function(e) {
            // 如果点击的是按钮，不启动拖动
            if (e.target.classList.contains('netease-draggable-btn')) {
                return;
            }

            console.log('开始拖动');
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = element.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;

            element.style.cursor = 'grabbing';
            dragArea.style.cursor = 'grabbing';
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newX = initialX + deltaX;
            let newY = initialY + deltaY;

            // 限制在窗口范围内
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            element.style.left = newX + 'px';
            element.style.top = newY + 'px';
            element.style.right = 'auto';
        });

        document.addEventListener('mouseup', function() {
            if (isDragging) {
                console.log('结束拖动');
                isDragging = false;
                element.style.cursor = 'move';
                dragArea.style.cursor = 'move';

                // 保存位置
                const rect = element.getBoundingClientRect();
                chrome.storage.local.set({
                    floatingButtonPosition: {
                        x: rect.left,
                        y: rect.top
                    }
                });
                console.log('位置已保存:', rect.left, rect.top);
            }
        });

        // 添加拖动提示
        dragArea.title = '拖动我移动按钮位置';
    }

    // 更新夜间模式按钮
    function updateDarkModeButton() {
        const button = document.querySelector('.netease-darkmode-floating');
        if (button) {
            button.innerHTML = isDarkMode ? '🌞' : '🌙';
            button.title = isDarkMode ? '切换到日间模式' : '切换到夜间模式';
            button.style.background = isDarkMode ? '#333' : '#6c757d';
        }
    }

    // 加载按钮位置
    async function loadButtonPosition(container) {
        try {
            const result = await chrome.storage.local.get(['floatingButtonPosition']);
            if (result.floatingButtonPosition) {
                const pos = result.floatingButtonPosition;
                container.style.left = pos.x + 'px';
                container.style.top = pos.y + 'px';
                container.style.right = 'auto';
            }
        } catch (error) {
            console.error('加载按钮位置失败:', error);
        }
    }

    // 加载夜间模式设置
    async function loadDarkModeSettings() {
        try {
            const result = await chrome.storage.local.get(['darkMode']);
            if (result.darkMode) {
                isDarkMode = true;
                enableDarkMode();
            }
        } catch (error) {
            console.error('加载夜间模式设置失败:', error);
        }
    }

    // 生成文件名的函数
    function generateFilename(songInfo, songId) {
        let filename = '';

        if (songInfo.songName && songInfo.artistName) {
            // 格式：艺术家 - 歌曲名
            filename = `${songInfo.artistName} - ${songInfo.songName}`;
        } else if (songInfo.songName) {
            // 只有歌曲名
            filename = songInfo.songName;
        } else if (songInfo.artistName) {
            // 只有艺术家名
            filename = `${songInfo.artistName} - song_${songId}`;
        } else {
            // 都没有，使用默认格式
            filename = `song_${songId}`;
        }

        // 清理文件名并添加扩展名
        return sanitizeFilename(filename) + '.mp3';
    }

    // 提取歌曲信息的函数
    function extractSongInfo() {
        try {
            let songName = '';
            let artistName = '';

            // 尝试多种选择器来获取歌曲名称
            const songSelectors = [
                '.g-single .head .info .hd .tit em',  // 歌曲页面主标题
                '.g-single .head .info .hd .tit',     // 歌曲页面标题容器
                '.m-playbar .info .name a',           // 播放栏歌曲名
                '.m-playbar .info .name',             // 播放栏歌曲名容器
                '.f-thide .tit',                      // 通用标题
                '.tit em',                            // 标题强调
                '.tit',                               // 标题
                'h1',                                 // 页面主标题
                'title'                               // 页面标题
            ];

            // 尝试多种选择器来获取艺术家名称
            const artistSelectors = [
                '.g-single .head .info .hd .by a',    // 歌曲页面艺术家
                '.g-single .head .info .hd .by',      // 歌曲页面艺术家容器
                '.m-playbar .info .by a',             // 播放栏艺术家
                '.m-playbar .info .by',               // 播放栏艺术家容器
                '.by a',                              // 通用艺术家链接
                '.by',                                // 通用艺术家容器
                '.artist a',                          // 艺术家链接
                '.artist'                             // 艺术家容器
            ];

            // 获取歌曲名称
            for (const selector of songSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    songName = element.textContent.trim();
                    // 移除可能的前缀和后缀
                    songName = songName.replace(/^歌曲名[:：]\s*/, '');
                    break;
                }
            }

            // 获取艺术家名称
            for (const selector of artistSelectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent.trim()) {
                    artistName = element.textContent.trim();
                    // 移除可能的前缀
                    artistName = artistName.replace(/^(歌手|艺术家|by)[:：]\s*/i, '');
                    break;
                }
            }

            // 如果没有找到歌曲名，尝试从页面标题提取
            if (!songName) {
                const pageTitle = document.title;
                if (pageTitle && pageTitle.includes(' - ')) {
                    const parts = pageTitle.split(' - ');
                    if (parts.length >= 2) {
                        songName = parts[0].trim();
                        if (!artistName) {
                            artistName = parts[1].trim();
                        }
                    }
                }
            }

            return {
                songName: songName || '',
                artistName: artistName || '',
                hasInfo: !!(songName || artistName)
            };
        } catch (e) {
            console.error('提取歌曲信息失败:', e);
            return {
                songName: '',
                artistName: '',
                hasInfo: false
            };
        }
    }

    // 清理文件名的函数
    function sanitizeFilename(filename) {
        // 移除或替换不允许的文件名字符
        return filename
            .replace(/[<>:"/\\|?*]/g, '_')  // 替换非法字符
            .replace(/\s+/g, ' ')           // 合并多个空格
            .trim()                         // 移除首尾空格
            .substring(0, 100);             // 限制长度
    }

    // 生成文件名的函数
    function generateFilename(songId, songInfo) {
        let filename = '';

        if (songInfo && songInfo.hasInfo) {
            if (songInfo.songName && songInfo.artistName) {
                filename = `${songInfo.artistName} - ${songInfo.songName}`;
            } else if (songInfo.songName) {
                filename = songInfo.songName;
            } else if (songInfo.artistName) {
                filename = `${songInfo.artistName} - song_${songId}`;
            }
        }

        // 如果没有获取到信息，使用默认格式
        if (!filename) {
            filename = `song_${songId}`;
        }

        // 清理文件名并添加扩展名
        filename = sanitizeFilename(filename);
        if (!filename.endsWith('.mp3')) {
            filename += '.mp3';
        }

        return filename;
    }

    // 获取下载URL
    function getDownloadUrl(songId) {
        return `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
    }

    // 创建下载按钮
    function createDownloadButton(songId) {
        const button = document.createElement('button');
        button.className = 'netease-download-btn';
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            下载MP3
        `;
        button.title = `下载歌曲 (ID: ${songId})`;
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            downloadSong(songId);
        });
        
        return button;
    }

    // 简化的歌曲信息提取（直接从标题）
    function extractSongInfoFromTitle() {
        console.log('🎵 从页面标题提取歌曲信息...');

        const title = document.title;
        console.log('页面标题:', title);

        if (title && title.includes(' - ')) {
            const parts = title.split(' - ');
            console.log('标题分割结果:', parts);

            if (parts.length >= 2) {
                const songName = parts[0].trim();
                const artistName = parts[1].trim();

                if (songName && songName !== '网易云音乐' && artistName && artistName !== '网易云音乐') {
                    console.log('✅ 成功提取歌曲信息:');
                    console.log('  歌曲名:', songName);
                    console.log('  艺术家:', artistName);

                    return {
                        songName: songName,
                        artistName: artistName
                    };
                }
            }
        }

        console.log('❌ 从标题提取失败');
        return {
            songName: '',
            artistName: ''
        };
    }

    // 下载歌曲（简化版本）
    function downloadSong(songId) {
        console.log('🎯 开始下载歌曲，ID:', songId);

        const downloadUrl = getDownloadUrl(songId);
        console.log('下载URL:', downloadUrl);

        // 直接从标题提取歌曲信息
        const songInfo = extractSongInfoFromTitle();
        console.log('歌曲信息:', songInfo);

        // 生成文件名
        let filename = '';
        if (songInfo.songName && songInfo.artistName) {
            filename = `${songInfo.artistName} - ${songInfo.songName}`;
        } else if (songInfo.songName) {
            filename = songInfo.songName;
        } else {
            filename = `song_${songId}`;
        }

        // 清理文件名
        filename = sanitizeFilename(filename) + '.mp3';
        console.log('生成的文件名:', filename);

        // 显示下载状态
        showNotification(`开始下载: ${songInfo.songName || `歌曲${songId}`}`, 'info');

        // 发送消息给background script处理下载
        chrome.runtime.sendMessage({
            action: 'download',
            url: downloadUrl,
            filename: filename,
            songId: songId,
            songInfo: songInfo
        }, function(response) {
            if (response && response.success) {
                showNotification(`下载开始: ${filename}`, 'success');
            } else {
                showNotification('下载失败: ' + (response?.error || '未知错误'), 'error');
            }
        });
    }

    // 显示通知
    function showNotification(message, type = 'info') {
        // 移除现有通知
        const existingNotification = document.querySelector('.netease-download-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `netease-download-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // 添加下载按钮到页面（异步版本）
    async function addDownloadButton() {
        const songId = extractSongId();
        if (!songId) {
            console.log('未找到歌曲ID');
            return;
        }

        // 移除现有的下载按钮
        const existingButton = document.querySelector('.netease-download-btn');
        if (existingButton) {
            existingButton.remove();
        }

        // 移除现有的浮动按钮
        const existingFloatingButton = document.querySelector('.netease-floating-download-btn');
        if (existingFloatingButton) {
            existingFloatingButton.remove();
        }

        // 等待页面内容加载
        await new Promise(resolve => setTimeout(resolve, 3000));

        // 查找合适的位置插入下载按钮
        let targetElement = null;

        // 尝试多个可能的选择器
        const selectors = [
            '.g-single .head .info .btns',      // 歌曲页面按钮区域
            '.n-single .head .info .btns',      // 新版歌曲页面按钮区域
            '.m-playbar .btns',                 // 播放栏按钮区域
            '.m-info .btns',                    // 信息区域按钮
            '.u-btns',                          // 通用按钮区域
            '.btns',                            // 任何按钮区域
            '.g-single .head .info',            // 歌曲信息区域
            '.n-single .head .info'             // 新版歌曲信息区域
        ];

        // 尝试等待按钮容器出现
        for (const selector of selectors) {
            try {
                targetElement = await waitForElement(selector, 5000);
                if (targetElement) {
                    console.log('找到目标元素:', selector);
                    break;
                }
            } catch (e) {
                console.log(`等待元素 ${selector} 超时`);
                continue;
            }
        }

        if (targetElement) {
            const downloadButton = createDownloadButton(songId);
            targetElement.appendChild(downloadButton);
            console.log('下载按钮已添加到:', targetElement);
        } else {
            console.log('未找到合适的位置插入下载按钮，创建浮动按钮');
            // 如果找不到合适位置，创建一个浮动按钮
            createFloatingButton(songId);
        }

        // 添加可拖动的浮动按钮组（如果还没有的话）
        if (!document.querySelector('.netease-floating-container')) {
            const floatingContainer = createDraggableFloatingButtons();
            document.body.appendChild(floatingContainer);
            loadButtonPosition(floatingContainer);
            console.log('可拖动浮动按钮已添加');
        }
    }

    // 创建浮动下载按钮
    function createFloatingButton(songId) {
        const floatingButton = document.createElement('div');
        floatingButton.className = 'netease-floating-download-btn';
        floatingButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
        `;
        floatingButton.title = `下载当前歌曲 (ID: ${songId})`;
        
        floatingButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            downloadSong(songId);
        });
        
        document.body.appendChild(floatingButton);
    }

    // 监听URL变化
    function observeUrlChange() {
        let currentUrl = window.location.href;

        const observer = new MutationObserver(function(mutations) {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('URL changed:', currentUrl);

                // 检查是否是歌曲页面
                if (currentUrl.includes('/song?id=') || currentUrl.includes('#/song?id=')) {
                    console.log('检测到歌曲页面，准备添加下载按钮');
                    setTimeout(() => addDownloadButton(), 3000); // 延迟3秒等待页面加载
                }
            }

            // 检查是否有新的歌曲信息元素出现
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 检查是否包含歌曲信息相关的类名
                            if (node.classList && (
                                node.classList.contains('g-single') ||
                                node.classList.contains('n-single') ||
                                node.classList.contains('m-info') ||
                                node.querySelector && node.querySelector('.tit, .info, .head')
                            )) {
                                console.log('检测到歌曲信息元素加载');
                                setTimeout(() => addDownloadButton(), 1000);
                                break;
                            }
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // 初始化
    async function init() {
        console.log('🚀 网易云音乐下载器插件初始化开始');
        console.log('📊 页面状态:', document.readyState);
        console.log('🔗 当前URL:', window.location.href);
        console.log('🏷️ 页面标题:', document.title);

        // 加载夜间模式设置
        await loadDarkModeSettings();

        // 检查是否是歌曲页面
        const isSongPage = window.location.href.includes('/song?id=') || window.location.href.includes('#/song?id=');
        console.log('🎵 是否为歌曲页面:', isSongPage);

        if (!isSongPage) {
            console.log('⚠️ 不是歌曲页面，但仍会添加浮动按钮');
            // 即使不是歌曲页面，也添加浮动按钮（只有夜间模式功能）
            if (!document.querySelector('.netease-floating-container')) {
                const floatingContainer = createDraggableFloatingButtons();
                document.body.appendChild(floatingContainer);
                loadButtonPosition(floatingContainer);
                console.log('浮动按钮已添加（非歌曲页面）');
            }
            return;
        }

        // 等待页面加载完成
        if (document.readyState === 'loading') {
            console.log('⏳ 页面正在加载，等待DOMContentLoaded事件');
            document.addEventListener('DOMContentLoaded', function() {
                console.log('✅ DOMContentLoaded事件触发');
                setTimeout(() => {
                    console.log('🎯 开始添加下载按钮 (DOMContentLoaded + 3秒)');
                    addDownloadButton();
                }, 3000);
            });
        } else {
            console.log('✅ 页面已加载完成，3秒后添加下载按钮');
            setTimeout(() => {
                console.log('🎯 开始添加下载按钮 (页面已加载 + 3秒)');
                addDownloadButton();
            }, 3000);
        }

        // 监听URL变化（SPA应用）
        observeUrlChange();

        // 监听popstate事件
        window.addEventListener('popstate', function() {
            console.log('📍 Popstate事件触发:', window.location.href);
            setTimeout(() => addDownloadButton(), 2000);
        });

        // 监听hashchange事件（网易云音乐使用hash路由）
        window.addEventListener('hashchange', function() {
            console.log('🔗 Hash变化:', window.location.hash);
            setTimeout(() => addDownloadButton(), 2000);
        });

        console.log('✅ 插件初始化完成');
    }

    // 监听来自popup和background的消息
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log('收到消息:', request);

        if (request.action === 'getSongInfo') {
            // 使用简化的歌曲信息提取
            const songInfo = extractSongInfoFromTitle();
            sendResponse({ songInfo: songInfo });
        } else if (request.action === 'triggerDownload') {
            const songId = extractSongId();
            if (songId) {
                downloadSong(songId);
                sendResponse({ success: true });
            } else {
                showNotification('无法获取歌曲ID，请确保在歌曲页面', 'error');
                sendResponse({ success: false, error: '无法获取歌曲ID' });
            }
        } else if (request.action === 'showMessage') {
            showNotification(request.message, request.type || 'info');
            sendResponse({ success: true });
        } else if (request.action === 'toggleDarkMode') {
            toggleDarkMode();
            sendResponse({ success: true, darkMode: isDarkMode });
        }
        return true; // 保持消息通道开放
    });

    // 强制创建按钮的函数
    function forceCreateButtons() {
        console.log('🔧 强制创建浮动按钮');

        // 移除所有旧按钮
        const oldContainers = document.querySelectorAll('.netease-floating-container');
        oldContainers.forEach(container => container.remove());

        // 创建新按钮
        const floatingContainer = createDraggableFloatingButtons();
        document.body.appendChild(floatingContainer);
        loadButtonPosition(floatingContainer);

        console.log('✅ 浮动按钮已强制创建');
    }

    // 立即启动插件，确保按钮尽快显示
    console.log('🚀 立即初始化插件');
    init();

    // 强制创建按钮
    setTimeout(forceCreateButtons, 100);

    // 页面加载完成后再次初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 DOMContentLoaded 事件触发，重新初始化');
            setTimeout(init, 500);
            setTimeout(forceCreateButtons, 1000);
        });
    } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
        console.log('📄 页面已加载，延迟初始化');
        setTimeout(init, 500);
        setTimeout(forceCreateButtons, 1000);
    }

    // 监听页面变化（SPA应用）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('🔄 页面URL变化，重新初始化');
            setTimeout(init, 1000);
            setTimeout(forceCreateButtons, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

    // 定期检查按钮是否存在，如果不存在则重新创建
    setInterval(function() {
        const container = document.querySelector('.netease-floating-container');
        if (!container) {
            console.log('🔍 检测到按钮丢失，重新创建');
            forceCreateButtons();
        } else {
            // 确保按钮可见
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            container.style.display = 'flex';
            container.style.zIndex = '999999';
        }
    }, 3000); // 每3秒检查一次

})();
