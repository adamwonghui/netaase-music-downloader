# 网易云音乐下载器

这是一个Python程序集合，可以根据网易云音乐的歌曲页面地址下载MP3文件。提供了基础版本和高级版本两个选择。

## 文件说明

- `网易云音乐下载.py` - 基础版本，简单易用
- `music_downloader_advanced.py` - 高级版本，功能更丰富
- `test_music_downloader.py` - 测试脚本

## 功能特点

### 基础版本功能
- 支持从网易云音乐网页URL自动提取歌曲ID
- 自动构造下载链接
- 下载MP3文件到本地
- 支持命令行和交互式两种使用方式

### 高级版本额外功能
- 实时下载进度显示
- 批量下载多首歌曲
- 自定义文件名
- 文件覆盖确认
- 面向对象设计，更易扩展
- 下载间隔控制，避免请求过于频繁

## 支持的URL格式

- `https://music.163.com/#/song?id=26386494`
- `https://music.163.com/song?id=26386494`

## 使用方法

### 基础版本

#### 方法1: 交互式使用
```bash
python3 网易云音乐下载.py
```
然后按提示输入歌曲页面地址。

#### 方法2: 命令行参数
```bash
python3 网易云音乐下载.py "https://music.163.com/#/song?id=26386494"
```

### 高级版本

#### 方法1: 下载单首歌曲
```bash
python3 music_downloader_advanced.py "https://music.163.com/#/song?id=26386494"
```

#### 方法2: 批量下载
```bash
python3 music_downloader_advanced.py "https://music.163.com/#/song?id=26386494" "https://music.163.com/#/song?id=123456"
```

#### 方法3: 交互式模式
```bash
python3 music_downloader_advanced.py
```
然后选择相应的操作选项。

## 依赖库

程序使用了以下Python标准库和第三方库：
- `requests` - 用于HTTP请求
- `re` - 正则表达式
- `os` - 文件系统操作
- `urllib.parse` - URL解析
- `typing` - 类型提示（仅高级版本）

安装依赖：
```bash
pip install requests
```

## 输出

- 下载的文件会保存在 `downloads` 目录中
- 文件名格式为 `song_{歌曲ID}.mp3`（可在高级版本中自定义）

## 测试

运行测试脚本验证功能：
```bash
python3 test_music_downloader.py
```

## 注意事项

1. **版权声明**: 请确保你有权下载相关音乐内容，仅用于个人学习和研究
2. **可用性**: 某些歌曲可能由于版权限制无法下载
3. **音质**: 下载的文件质量取决于网易云音乐提供的音质
4. **文件大小**: 如果下载的文件很小（小于1KB），可能表示下载失败或歌曲不可用
5. **请求频率**: 高级版本在批量下载时会自动添加延迟，避免请求过于频繁

## 示例输出

### 基础版本
```bash
$ python3 网易云音乐下载.py "https://music.163.com/#/song?id=26386494"
网易云音乐下载器
==================================================
解析URL: https://music.163.com/#/song?id=26386494
歌曲ID: 26386494
下载地址: https://music.163.com/song/media/outer/url?id=26386494.mp3
正在下载: https://music.163.com/song/media/outer/url?id=26386494.mp3
下载完成: downloads/song_26386494.mp3 (大小: 3093118 字节)
成功下载到: downloads/song_26386494.mp3
```

### 高级版本
```bash
$ python3 music_downloader_advanced.py "https://music.163.com/#/song?id=26386494"
网易云音乐下载器 - 高级版本
==================================================
歌曲ID: 26386494
下载地址: https://music.163.com/song/media/outer/url?id=26386494.mp3
开始下载: song_26386494.mp3
下载进度: 100.0% (3093118/3093118 字节)
下载完成: downloads/song_26386494.mp3 (大小: 3093118 字节)
```
