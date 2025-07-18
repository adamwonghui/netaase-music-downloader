#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网易云音乐下载器
根据网页地址下载MP3音乐文件
"""

import re
import requests
import os
from urllib.parse import urlparse, parse_qs
import sys


def extract_song_id(url):
    """
    从网易云音乐网页URL中提取歌曲ID
    支持的URL格式:
    - https://music.163.com/#/song?id=26386494
    - https://music.163.com/song?id=26386494
    """
    try:
        # 移除URL中的#号
        url = url.replace('#/', '')

        # 解析URL
        parsed_url = urlparse(url)

        # 提取查询参数
        query_params = parse_qs(parsed_url.query)

        # 获取id参数
        if 'id' in query_params:
            song_id = query_params['id'][0]
            return song_id
        else:
            # 尝试用正则表达式提取ID
            match = re.search(r'id=(\d+)', url)
            if match:
                return match.group(1)
            else:
                raise ValueError("无法从URL中提取歌曲ID")

    except Exception as e:
        raise ValueError(f"URL解析失败: {e}")


def get_download_url(song_id):
    """
    根据歌曲ID构造下载URL
    """
    return f"https://music.163.com/song/media/outer/url?id={song_id}.mp3"


def download_mp3(download_url, filename=None, output_dir="downloads"):
    """
    下载MP3文件
    """
    try:
        # 创建下载目录
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # 设置请求头，模拟浏览器访问
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://music.163.com/',
            'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5'
        }

        print(f"正在下载: {download_url}")

        # 发送请求
        response = requests.get(download_url, headers=headers, stream=True)
        response.raise_for_status()

        # 检查响应内容类型
        content_type = response.headers.get('content-type', '')
        if 'audio' not in content_type and 'application/octet-stream' not in content_type:
            print(f"警告: 响应内容类型为 {content_type}，可能不是音频文件")

        # 如果没有指定文件名，从URL中提取
        if filename is None:
            song_id = re.search(r'id=(\d+)', download_url).group(1)
            filename = f"song_{song_id}.mp3"

        # 确保文件名以.mp3结尾
        if not filename.endswith('.mp3'):
            filename += '.mp3'

        # 完整的文件路径
        filepath = os.path.join(output_dir, filename)

        # 写入文件
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        file_size = os.path.getsize(filepath)
        print(f"下载完成: {filepath} (大小: {file_size} 字节)")

        # 检查文件大小，如果太小可能下载失败
        if file_size < 1024:  # 小于1KB
            print("警告: 下载的文件很小，可能下载失败或歌曲不可用")

        return filepath

    except requests.exceptions.RequestException as e:
        raise Exception(f"下载失败: {e}")
    except Exception as e:
        raise Exception(f"保存文件失败: {e}")


def main():
    """
    主函数
    """
    print("网易云音乐下载器")
    print("=" * 50)

    # 获取用户输入
    if len(sys.argv) > 1:
        # 从命令行参数获取URL
        music_url = sys.argv[1]
    else:
        # 交互式输入
        music_url = input("请输入网易云音乐歌曲页面地址: ").strip()

    if not music_url:
        print("错误: 请提供有效的URL")
        return

    try:
        # 提取歌曲ID
        print(f"解析URL: {music_url}")
        song_id = extract_song_id(music_url)
        print(f"歌曲ID: {song_id}")

        # 构造下载URL
        download_url = get_download_url(song_id)
        print(f"下载地址: {download_url}")

        # 下载文件
        filepath = download_mp3(download_url)
        print(f"成功下载到: {filepath}")

    except Exception as e:
        print(f"错误: {e}")
        return


if __name__ == "__main__":
    main()