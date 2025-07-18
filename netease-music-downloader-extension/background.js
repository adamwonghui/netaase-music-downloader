// 网易云音乐下载器 - 后台脚本
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'download') {
        handleDownload(request, sendResponse);
        return true; // 保持消息通道开放以进行异步响应
    }
});

// 处理下载请求
async function handleDownload(request, sendResponse) {
    try {
        const { url, filename, songId, songInfo } = request;

        console.log('开始下载:', { url, filename, songId, songInfo });

        // 使用Chrome Downloads API下载文件
        const downloadId = await chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: false, // 不显示保存对话框，直接下载到默认位置
            conflictAction: 'uniquify' // 如果文件名冲突，自动重命名
        });

        console.log('下载已开始，ID:', downloadId);

        // 保存下载历史
        await saveDownloadHistory(songId, filename, url, songInfo);

        // 监听下载状态
        const downloadListener = (downloadDelta) => {
            if (downloadDelta.id === downloadId) {
                if (downloadDelta.state && downloadDelta.state.current === 'complete') {
                    console.log('下载完成:', filename);
                    chrome.downloads.onChanged.removeListener(downloadListener);

                    // 发送通知
                    const notificationTitle = songInfo?.songName
                        ? `${songInfo.songName} - 下载完成`
                        : '歌曲下载完成';

                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: '网易云音乐下载器',
                        message: notificationTitle
                    });
                } else if (downloadDelta.state && downloadDelta.state.current === 'interrupted') {
                    console.error('下载中断:', filename);
                    chrome.downloads.onChanged.removeListener(downloadListener);
                }
            }
        };

        chrome.downloads.onChanged.addListener(downloadListener);

        sendResponse({ success: true, downloadId: downloadId });

    } catch (error) {
        console.error('下载失败:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
    console.log('网易云音乐下载器插件已安装，原因:', details.reason);

    // 创建右键菜单 - 简化版，直接下载
    chrome.contextMenus.create({
        id: 'download-netease-music',
        title: '🎵 下载这首歌',
        contexts: ['page'],
        documentUrlPatterns: ['https://music.163.com/*', 'https://*.music.163.com/*']
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('创建右键菜单失败:', chrome.runtime.lastError);
        } else {
            console.log('右键菜单创建成功');
        }
    });
});

// 处理右键菜单点击 - 简化版，直接下载
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('右键菜单被点击:', info.menuItemId);

    if (info.menuItemId === 'download-netease-music') {
        // 直接触发下载，无需二级菜单
        chrome.tabs.sendMessage(tab.id, { action: 'triggerDownload' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('发送下载消息失败:', chrome.runtime.lastError);
            } else {
                console.log('下载消息已发送');
            }
        });
    }
});

// 处理插件图标点击 - 由于有popup，这个事件不会触发
// 但保留代码以防需要切换到无popup模式
chrome.action.onClicked.addListener((tab) => {
    console.log('插件图标被点击');

    // 检查是否在网易云音乐页面
    if (tab.url && tab.url.includes('music.163.com')) {
        // 检查是否是歌曲页面
        if (tab.url.includes('/song?id=') || tab.url.includes('#/song?id=')) {
            // 向当前标签页发送消息，触发下载
            chrome.tabs.sendMessage(tab.id, { action: 'triggerDownload' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('发送下载消息失败:', chrome.runtime.lastError);
                }
            });
        } else {
            // 不是歌曲页面，显示提示
            chrome.tabs.sendMessage(tab.id, { action: 'showMessage', message: '请在歌曲页面使用下载功能' });
        }
    } else {
        // 如果不在网易云音乐页面，打开网易云音乐
        chrome.tabs.create({ url: 'https://music.163.com' });
    }
});

// 存储下载历史
async function saveDownloadHistory(songId, filename, url, songInfo = {}) {
    try {
        const result = await chrome.storage.local.get(['downloadHistory']);
        const history = result.downloadHistory || [];

        const downloadRecord = {
            songId: songId,
            filename: filename,
            url: url,
            songInfo: {
                songName: songInfo.songName || '',
                artistName: songInfo.artistName || ''
            },
            timestamp: Date.now(),
            date: new Date().toLocaleString()
        };

        history.unshift(downloadRecord); // 添加到开头

        // 只保留最近100条记录
        if (history.length > 100) {
            history.splice(100);
        }

        await chrome.storage.local.set({ downloadHistory: history });
        console.log('下载历史已保存:', downloadRecord);
    } catch (error) {
        console.error('保存下载历史失败:', error);
    }
}

// 获取下载历史
async function getDownloadHistory() {
    try {
        const result = await chrome.storage.local.get(['downloadHistory']);
        return result.downloadHistory || [];
    } catch (error) {
        console.error('获取下载历史失败:', error);
        return [];
    }
}

// 清除下载历史
async function clearDownloadHistory() {
    try {
        await chrome.storage.local.remove(['downloadHistory']);
        console.log('下载历史已清除');
    } catch (error) {
        console.error('清除下载历史失败:', error);
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getDownloadHistory') {
        getDownloadHistory().then(history => {
            sendResponse({ success: true, history: history });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    } else if (request.action === 'clearDownloadHistory') {
        clearDownloadHistory().then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
});



console.log('Background script loaded');
