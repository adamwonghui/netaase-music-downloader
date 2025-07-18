#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网易云音乐下载器 - 高级版本
支持批量下载、自定义文件名、进度显示等功能
"""

import re
import requests
import os
import sys
import time
from urllib.parse import urlparse, parse_qs
from typing import List, Optional


class NeteaseMusicDownloader:
    """网易云音乐下载器类"""
    
    def __init__(self, output_dir: str = "downloads"):
        self.output_dir = output_dir
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://music.163.com/',
            'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5'
        })
        
        # 创建下载目录
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
    
    def extract_song_id(self, url: str) -> str:
        """从URL中提取歌曲ID"""
        try:
            url = url.replace('#/', '')
            parsed_url = urlparse(url)
            query_params = parse_qs(parsed_url.query)
            
            if 'id' in query_params:
                return query_params['id'][0]
            else:
                match = re.search(r'id=(\d+)', url)
                if match:
                    return match.group(1)
                else:
                    raise ValueError("无法从URL中提取歌曲ID")
        except Exception as e:
            raise ValueError(f"URL解析失败: {e}")
    
    def get_download_url(self, song_id: str) -> str:
        """构造下载URL"""
        return f"https://music.163.com/song/media/outer/url?id={song_id}.mp3"
    
    def download_with_progress(self, url: str, filepath: str) -> bool:
        """带进度显示的下载函数"""
        try:
            response = self.session.get(url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            downloaded_size = 0
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded_size += len(chunk)
                        
                        if total_size > 0:
                            progress = (downloaded_size / total_size) * 100
                            print(f"\r下载进度: {progress:.1f}% ({downloaded_size}/{total_size} 字节)", end='')
                        else:
                            print(f"\r已下载: {downloaded_size} 字节", end='')
            
            print()  # 换行
            return True
            
        except Exception as e:
            print(f"\n下载失败: {e}")
            return False
    
    def download_song(self, url: str, custom_filename: Optional[str] = None) -> Optional[str]:
        """下载单首歌曲"""
        try:
            # 提取歌曲ID
            song_id = self.extract_song_id(url)
            print(f"歌曲ID: {song_id}")
            
            # 构造下载URL
            download_url = self.get_download_url(song_id)
            print(f"下载地址: {download_url}")
            
            # 确定文件名
            if custom_filename:
                filename = custom_filename
                if not filename.endswith('.mp3'):
                    filename += '.mp3'
            else:
                filename = f"song_{song_id}.mp3"
            
            filepath = os.path.join(self.output_dir, filename)
            
            # 检查文件是否已存在
            if os.path.exists(filepath):
                choice = input(f"文件 {filename} 已存在，是否覆盖？(y/n): ").lower()
                if choice != 'y':
                    print("跳过下载")
                    return None
            
            print(f"开始下载: {filename}")
            
            # 下载文件
            if self.download_with_progress(download_url, filepath):
                file_size = os.path.getsize(filepath)
                print(f"下载完成: {filepath} (大小: {file_size} 字节)")
                
                if file_size < 1024:
                    print("警告: 文件很小，可能下载失败或歌曲不可用")
                
                return filepath
            else:
                return None
                
        except Exception as e:
            print(f"错误: {e}")
            return None
    
    def download_batch(self, urls: List[str]) -> List[str]:
        """批量下载歌曲"""
        successful_downloads = []
        
        print(f"开始批量下载 {len(urls)} 首歌曲...")
        print("=" * 50)
        
        for i, url in enumerate(urls, 1):
            print(f"\n[{i}/{len(urls)}] 处理: {url}")
            
            filepath = self.download_song(url)
            if filepath:
                successful_downloads.append(filepath)
            
            # 添加延迟避免请求过于频繁
            if i < len(urls):
                time.sleep(1)
        
        print(f"\n批量下载完成！成功下载 {len(successful_downloads)} 首歌曲")
        return successful_downloads


def main():
    """主函数"""
    print("网易云音乐下载器 - 高级版本")
    print("=" * 50)
    
    downloader = NeteaseMusicDownloader()
    
    if len(sys.argv) > 1:
        # 命令行模式
        urls = sys.argv[1:]
        if len(urls) == 1:
            downloader.download_song(urls[0])
        else:
            downloader.download_batch(urls)
    else:
        # 交互模式
        while True:
            print("\n选择操作:")
            print("1. 下载单首歌曲")
            print("2. 批量下载歌曲")
            print("3. 退出")
            
            choice = input("请选择 (1-3): ").strip()
            
            if choice == '1':
                url = input("请输入歌曲页面地址: ").strip()
                if url:
                    custom_name = input("自定义文件名 (可选，按回车跳过): ").strip()
                    downloader.download_song(url, custom_name if custom_name else None)
            
            elif choice == '2':
                print("请输入歌曲地址，每行一个，输入空行结束:")
                urls = []
                while True:
                    url = input().strip()
                    if not url:
                        break
                    urls.append(url)
                
                if urls:
                    downloader.download_batch(urls)
                else:
                    print("没有输入任何地址")
            
            elif choice == '3':
                print("再见！")
                break
            
            else:
                print("无效选择，请重试")


if __name__ == "__main__":
    main()
