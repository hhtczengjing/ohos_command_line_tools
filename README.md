# 鸿蒙命令行工具 - 多平台自动发布系统

## 🎯 概述

完整的 **GitHub Actions 自动化工作流**，用于管理鸿蒙命令行工具的多平台版本发布。

### ✨ 核心特性

- 📦 **多平台支持**: Windows (64-bit), Linux (X86), macOS (X86), macOS (ARM)
- 🔄 **自动版本检测**: 自动识别 `versions/` 目录中的最新版本
- 🎁 **一键发布**: 点击按钮即可自动下载并发布最新版本到 GitHub Release
- 🛡️ **完整校验**: SHA256 校验和验证，确保文件完整性
- 🔐 **严格把控**: 任一平台失败则整体失败

## 📁 项目结构

```
ohos_command_line_tools/
├── .github/
│   └── workflows/
│       └── download-multiplatform-release.yml  # 自动发布 Workflow
├── versions/                                   # 版本数据目录
│   ├── 6.1.1.268.json                          # 最新版本
│   ├── 6.1.0.830.json
│   └── ... （更多版本文件）
├── README.md                                   # 本文件
└── config.json                                 # 原始数据源
```

## 🚀 快速开始

### 步骤 1: 添加版本数据

在 `versions/` 目录中创建 JSON 文件（文件名: `{buildVersion}.json`）：

```json
{
  "versionName": "Command Line Tools 6.1.1 Beta1",
  "buildVersion": "6.1.1.268",
  "publishTime": "2026-04-30 01:17:18",
  "platforms": {
    "windows-x64": {
      "showName": "Command Line Tools for Windows 6.1.1.268",
      "packageName": "commandline-tools-windows-x64-6.1.1.268.zip",
      "downloadUrl": "https://your-domain.com/releases/commandline-tools-windows-x64-6.1.1.268.zip",
      "sha256": "40cc0d9d677406f6f8f2704107dcff89e36ed271ead357db5cef62501473f37e"
    },
    "linux-x86": { ... },
    "macos-x86": { ... },
    "macos-arm64": { ... }
  }
}
```

### 步骤 2: 触发 Workflow

1. 进入 GitHub 仓库 → **Actions** 选项卡
2. 选择 **"Download Multi-Platform and Release"**
3. 点击 **"Run workflow"** 按钮

Workflow 会自动：
- ✅ 检测 `versions/` 目录中的最新版本
- ✅ 下载该版本的所有平台文件
- ✅ 验证 SHA256 校验和
- ✅ 创建 GitHub Release
- ✅ 上传所有文件到 Release

## 📝 版本文件格式

### 必需字段

| 字段 | 说明 |
|------|------|
| `versionName` | 版本显示名称 |
| `buildVersion` | 构建版本号 (Release 标签) |
| `platforms` | 平台列表 |

### platforms 字段

每个平台必须包含：

| 字段 | 说明 |
|------|------|
| `showName` | 平台显示名称 |
| `packageName` | 文件名称 |
| `downloadUrl` | 下载链接 |
| `sha256` | SHA256 校验和 |

### 支持的平台

| 平台 | platform_id |
|------|------------|
| Windows 64-bit | `windows-x64` |
| Linux X86 | `linux-x86` |
| macOS X86 | `macos-x86` |
| macOS ARM64 | `macos-arm64` |

## 🔗 使用 Release 文件

### 直接下载

```bash
# 下载指定版本
wget https://github.com/{owner}/{repo}/releases/download/6.1.1.268/commandline-tools-windows-x64-6.1.1.268.zip
```

### 在 Workflow 中使用

```yaml
- name: Download OHOS CLI
  run: |
    wget https://github.com/{owner}/{repo}/releases/download/6.1.1.268/commandline-tools-linux-x86-6.1.1.268.zip
    unzip commandline-tools-linux-x86-6.1.1.268.zip
```

### GitHub API

```bash
# 获取最新 Release
curl -s https://api.github.com/repos/{owner}/{repo}/releases/latest | jq '.assets[]'
```

## ⚠️ 重要说明

### 失败策略

- 任何平台的下载失败 → **整个任务失败**
- 任何平台的 SHA256 校验失败 → **整个任务失败**
- 重试机制：失败平台会自动重试 3 次

### 文件命名

上传到 Release 的文件名直接使用 `packageName`，例如：
- `commandline-tools-windows-x64-6.1.1.268.zip`
- `commandline-tools-linux-x86-6.1.1.268.zip`
- `commandline-tools-macos-x86-6.1.1.268.zip`
- `commandline-tools-macos-arm64-6.1.1.268.zip`

## 📞 故障排查

### 检查版本文件

使用 [JSONLint](https://jsonlint.com/) 验证 `versions/` 中的 JSON 文件格式

### 常见问题

| 问题 | 解决方案 |
|------|--------|
| 未找到版本文件 | 确保 `versions/` 目录存在且包含至少一个 `.json` 文件 |
| JSON 格式错误 | 用 JSONLint 验证文件格式 |
| 下载失败 | 在浏览器中测试 URL，确保链接有效 |
| SHA256 校验失败 | 验证 JSON 中的 SHA256 值是否正确 |

## 📄 许可证

此项目代码可自由使用和修改。

---

**更新日期**: 2026-05-12
**版本**: v2.0.0
