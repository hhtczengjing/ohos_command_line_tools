#!/bin/bash
# Release 存在检查脚本
# 用法: ./scripts/check-release.sh <build_version>
# 需要环境变量: GITHUB_TOKEN

set -e

if [ -z "$1" ]; then
  echo "❌ 错误: 缺少必需参数 build_version"
  echo "用法: ./scripts/check-release.sh <build_version>"
  exit 1
fi

build_version="$1"

# 检查 Release 是否已存在
if gh release view "$build_version" &>/dev/null; then
  echo "✅ Release 已存在: $build_version"
  echo "release_exists=true"
else
  echo "📝 Release 不存在: $build_version，准备创建"
  echo "release_exists=false"
fi
