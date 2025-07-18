// 网易云音乐下载器 - 调试版本
(function() {
    'use strict';
    
    console.log('🔥 调试版本插件已注入');
    console.log('URL:', window.location.href);
    console.log('标题:', document.title);
    
    // 简化的歌曲信息提取
    function extractSongInfoSimple() {
        console.log('🎵 开始提取歌曲信息...');
        
        const title = document.title;
        console.log('页面标题:', title);
        
        if (title && title.includes(' - ')) {
            const parts = title.split(' - ');
            console.log('分割结果:', parts);
            
            if (parts.length >= 2) {
                const songName = parts[0].trim();
                const artistName = parts[1].trim();
                
                console.log('✅ 提取成功:');
                console.log('  歌曲名:', songName);
                console.log('  艺术家:', artistName);
                
                return { songName, artistName };
            }
        }
        
        console.log('❌ 提取失败');
        return { songName: '', artistName: '' };
    }
    
    // 简化的下载按钮创建
    function createSimpleDownloadButton() {
        console.log('🔧 创建下载按钮...');
        
        const button = document.createElement('button');
        button.textContent = '🎵 下载MP3 (调试版)';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        button.addEventListener('click', function() {
            console.log('🎯 下载按钮被点击');
            
            const songInfo = extractSongInfoSimple();
            console.log('提取的歌曲信息:', songInfo);
            
            // 提取歌曲ID
            const urlMatch = window.location.href.match(/[?&]id=(\d+)/);
            const songId = urlMatch ? urlMatch[1] : 'unknown';
            console.log('歌曲ID:', songId);
            
            // 生成文件名
            let filename = '';
            if (songInfo.songName && songInfo.artistName) {
                filename = `${songInfo.artistName} - ${songInfo.songName}.mp3`;
            } else if (songInfo.songName) {
                filename = `${songInfo.songName}.mp3`;
            } else {
                filename = `song_${songId}.mp3`;
            }
            
            console.log('生成的文件名:', filename);
            
            // 模拟下载（实际项目中这里会调用chrome.runtime.sendMessage）
            alert(`调试信息:\n歌曲名: ${songInfo.songName}\n艺术家: ${songInfo.artistName}\n文件名: ${filename}`);
        });
        
        document.body.appendChild(button);
        console.log('✅ 下载按钮已添加');
        
        return button;
    }
    
    // 检查页面是否为歌曲页面
    function isSongPage() {
        const url = window.location.href;
        return url.includes('/song?id=') || url.includes('#/song?id=');
    }
    
    // 主初始化函数
    function initDebug() {
        console.log('🚀 调试版本初始化');
        
        if (!isSongPage()) {
            console.log('❌ 不是歌曲页面，退出');
            return;
        }
        
        console.log('✅ 是歌曲页面，继续初始化');
        
        // 等待页面加载
        setTimeout(() => {
            console.log('⏰ 延迟执行，开始添加按钮');
            createSimpleDownloadButton();
            
            // 立即测试歌曲信息提取
            const songInfo = extractSongInfoSimple();
            console.log('初始歌曲信息:', songInfo);
        }, 2000);
        
        // 监听标题变化
        let lastTitle = document.title;
        const observer = new MutationObserver(() => {
            if (document.title !== lastTitle) {
                console.log('📄 标题变化:');
                console.log('  旧:', lastTitle);
                console.log('  新:', document.title);
                lastTitle = document.title;
                
                // 重新提取歌曲信息
                setTimeout(() => {
                    extractSongInfoSimple();
                }, 1000);
            }
        });
        
        observer.observe(document.head, {
            childList: true,
            subtree: true
        });
    }
    
    // 启动调试版本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDebug);
    } else {
        initDebug();
    }
    
    // 暴露调试函数到全局
    window.debugExtractSongInfo = extractSongInfoSimple;
    window.debugCreateButton = createSimpleDownloadButton;
    
    console.log('🔧 调试函数已暴露:');
    console.log('  debugExtractSongInfo() - 测试歌曲信息提取');
    console.log('  debugCreateButton() - 手动创建下载按钮');
    
})();
