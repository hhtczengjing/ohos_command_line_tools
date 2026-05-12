# Scripts 目录

此目录包含 GitHub Workflow 中使用的所有脚本，方便本地开发和测试。

## 脚本列表

### `release.sh` - 主发布脚本（推荐使用）

完整的本地发布流程，模拟 GitHub Workflow 的行为。

**用法:**
```bash
# 完整发布
./scripts/release.sh

# 仅检查版本和 Release 状态
./scripts/release.sh --check-only

# 跳过下载，仅生成 Release Notes（用于调试）
./scripts/release.sh --skip-download
```

**流程:**
1. 检测最新版本
2. 检查 Release 是否已存在
3. 下载所有平台文件（带 SHA256 校验）
4. 生成 Release Notes
5. 创建 GitHub Release（需要 GITHUB_TOKEN）

**环境变量:**
- `GITHUB_TOKEN`: 用于 Release 操作（可选，不设置则跳过 Release 创建）

---

### `detect-version.sh` - 版本检测脚本

检测 `versions/` 目录中的最新版本。

**用法:**
```bash
./scripts/detect-version.sh
```

**输出:**
```
✅ 检测到最新版本: 6.1.1.268
version_file=versions/6.1.1.268.json
build_version=6.1.1.268
```

---

### `check-release.sh` - Release 检查脚本

检查指定版本的 Release 是否已存在。

**用法:**
```bash
export GITHUB_TOKEN=your_token
./scripts/check-release.sh 6.1.1.268
```

**输出:**
```
✅ Release 已存在: 6.1.1.268
release_exists=true
```

或

```
📝 Release 不存在: 6.1.1.268，准备创建
release_exists=false
```

**环境变量:**
- `GITHUB_TOKEN`: GitHub 访问令牌（必需）

---

### `download-platforms.sh` - 文件下载脚本

下载指定版本的所有平台文件，并进行 SHA256 校验。

**用法:**
```bash
./scripts/download-platforms.sh <version_file> <build_version>
```

**示例:**
```bash
./scripts/download-platforms.sh versions/6.1.1.268.json 6.1.1.268
```

**特点:**
- 自动重试（最多 3 次）
- SHA256 校验和验证
- 详细的下载进度和统计信息
- 任何平台失败则整体失败

**输出文件:**
- `downloads/`: 下载的文件目录
- `download_summary.md`: 下载统计和结果摘要
- `file_list.txt`: 成功下载的文件列表
- `failed_list.txt`: 失败的文件列表（如有）

---

### `generate-release-notes.sh` - Release Notes 生成脚本

从版本 JSON 文件生成 Release Notes。

**用法:**
```bash
./scripts/generate-release-notes.sh <version_file> <build_version>
```

**示例:**
```bash
./scripts/generate-release-notes.sh versions/6.1.1.268.json 6.1.1.268
```

**输出:**
- `release_notes.txt`: 生成的 Release Notes 文件

**内容:**
```
# Command Line Tools 6.1.1 Beta1 (Build 6.1.1.268)

**发布时间**: 2026-04-30 01:17:18

## 📦 包含的平台版本

- **Command Line Tools for Windows 6.1.1.268** (windows-x64)
- **Command Line Tools for Linux 6.1.1.268** (linux-x86)
- **Command Line Tools for Mac 6.1.1.268** (macos-x86)
- **Command Line Tools for Mac 6.1.1.268** (macos-arm64)
```

---

## 本地开发工作流

### 1. 快速检查版本和 Release 状态

```bash
./scripts/release.sh --check-only
```

### 2. 测试下载和校验功能

```bash
./scripts/release.sh --skip-download
```

### 3. 完整发布（需要 GITHUB_TOKEN）

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
./scripts/release.sh
```

### 4. 单独测试某个步骤

```bash
# 仅检测版本
./scripts/detect-version.sh

# 仅下载文件
./scripts/download-platforms.sh versions/6.1.1.268.json 6.1.1.268

# 仅生成 Release Notes
./scripts/generate-release-notes.sh versions/6.1.1.268.json 6.1.1.268
```

---

## 故障排查

### 错误：版本文件不存在

```
❌ 错误: 未找到任何版本文件在 versions/ 目录中
```

**解决:** 确保 `versions/` 目录存在且包含至少一个 JSON 文件

### 错误：缺少 GITHUB_TOKEN

```
⚠️ 警告: GITHUB_TOKEN 未设置，跳过 Release 检查
```

**解决:** 设置环境变量
```bash
export GITHUB_TOKEN=your_github_token
```

### 错误：SHA256 校验失败

```
❌ SHA256 校验失败: commandline-tools-windows-x64-6.1.1.268.zip
   期望: 40cc0d9d677406f6f8f2704107dcff89e36ed271ead357db5cef62501473f37e
   实际: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**解决:** 检查版本 JSON 中的 SHA256 值是否正确

---

## 与 GitHub Workflow 的关系

这些脚本直接来自 `.github/workflows/download-multiplatform-release.yml` Workflow，可以：
- 在本地完全复现 Workflow 的行为
- 便于调试和测试
- 加快开发迭代速度
- 支持 CI/CD 以外的环境

Workflow 中的每个步骤都对应一个脚本：

| Workflow 步骤 | 脚本 |
|-------------|------|
| Detect latest version | `detect-version.sh` |
| Check if release exists | `check-release.sh` |
| Download platform files | `download-platforms.sh` |
| Generate Release Notes | `generate-release-notes.sh` |

---

## 许可证

同项目许可证。
