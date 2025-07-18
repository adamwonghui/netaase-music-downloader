#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试网易云音乐下载器的各个功能
"""

import sys
import os

# 添加当前目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 导入我们的下载器模块
from 网易云音乐下载 import extract_song_id, get_download_url


def test_extract_song_id():
    """测试歌曲ID提取功能"""
    print("测试歌曲ID提取功能...")
    
    test_urls = [
        "https://music.163.com/#/song?id=26386494",
        "https://music.163.com/song?id=26386494",
        "https://music.163.com/#/song?id=123456789",
        "https://music.163.com/song?id=987654321"
    ]
    
    for url in test_urls:
        try:
            song_id = extract_song_id(url)
            print(f"✓ URL: {url}")
            print(f"  歌曲ID: {song_id}")
        except Exception as e:
            print(f"✗ URL: {url}")
            print(f"  错误: {e}")
        print()


def test_get_download_url():
    """测试下载URL构造功能"""
    print("测试下载URL构造功能...")
    
    test_ids = ["26386494", "123456789", "987654321"]
    
    for song_id in test_ids:
        download_url = get_download_url(song_id)
        expected_url = f"https://music.163.com/song/media/outer/url?id={song_id}.mp3"
        
        if download_url == expected_url:
            print(f"✓ 歌曲ID: {song_id}")
            print(f"  下载URL: {download_url}")
        else:
            print(f"✗ 歌曲ID: {song_id}")
            print(f"  期望: {expected_url}")
            print(f"  实际: {download_url}")
        print()


def main():
    """主测试函数"""
    print("网易云音乐下载器 - 功能测试")
    print("=" * 50)
    
    test_extract_song_id()
    test_get_download_url()
    
    print("测试完成！")


if __name__ == "__main__":
    main()
