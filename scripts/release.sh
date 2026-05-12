#!/bin/bash
# 完整的本地发布脚本 (模拟 GitHub Workflow)
# 用法: ./scripts/release.sh [--check-only] [--skip-download]
#
# 选项:
#   --check-only     只检查版本和 Release 是否存在，不下载和发布
#   --skip-download  跳过下载步骤，仅生成 Release Notes 和创建 Release

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 解析参数
check_only=false
skip_download=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --check-only)
      check_only=true
      shift
      ;;
    --skip-download)
      skip_download=true
      shift
      ;;
    *)
      echo "❌ 未知选项: $1"
      echo "用法: ./scripts/release.sh [--check-only] [--skip-download]"
      exit 1
      ;;
  esac
done

cd "$PROJECT_ROOT"

echo "🚀 开始发布流程..."
echo ""

# 步骤 1: 检测版本
echo "📍 步骤 1: 检测版本"
version_output=$("$SCRIPT_DIR/detect-version.sh")
version_file=$(echo "$version_output" | grep "^version_file=" | cut -d'=' -f2)
build_version=$(echo "$version_output" | grep "^build_version=" | cut -d'=' -f2)
echo "   版本文件: $version_file"
echo "   构建版本: $build_version"
echo ""

if [ "$check_only" = true ]; then
  echo "✅ 检查模式: 完成"
  exit 0
fi

# 步骤 2: 检查 Release 是否存在
echo "📍 步骤 2: 检查 Release 是否存在"
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️ 警告: GITHUB_TOKEN 未设置，跳过 Release 检查"
  release_exists="false"
else
  release_check=$("$SCRIPT_DIR/check-release.sh" "$build_version")
  release_exists=$(echo "$release_check" | grep "^release_exists=" | cut -d'=' -f2)
fi
echo "   Release 存在: $release_exists"
echo ""

if [ "$release_exists" = "true" ]; then
  echo "ℹ️ Release 已存在，跳过发布"
  exit 0
fi

# 步骤 3: 下载平台文件
if [ "$skip_download" = false ]; then
  echo "📍 步骤 3: 下载平台文件"
  "$SCRIPT_DIR/download-platforms.sh" "$version_file" "$build_version"
  echo ""
else
  echo "📍 步骤 3: 跳过下载（--skip-download）"
  echo ""
fi

# 步骤 4: 生成 Release Notes
echo "📍 步骤 4: 生成 Release Notes"
"$SCRIPT_DIR/generate-release-notes.sh" "$version_file" "$build_version"
echo ""

# 步骤 5: 创建 Release
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️ 警告: GITHUB_TOKEN 未设置，跳过 Release 创建"
  echo "如需创建 Release，请设置 GITHUB_TOKEN 环境变量"
else
  echo "📍 步骤 5: 创建 Release"
  if [ -f "release_notes.txt" ]; then
    gh release create "$build_version" \
      --title "Command Line Tools Release $build_version" \
      --notes-file "release_notes.txt" \
      downloads/* \
      2>&1 || echo "⚠️ Release 创建失败，可能已存在"
  else
    echo "❌ 错误: release_notes.txt 不存在"
    exit 1
  fi
  echo ""
fi

echo "✅ 发布流程完成"
