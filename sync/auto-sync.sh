#!/bin/bash

# auto-sync.sh - 自动同步版本的一键脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYNC_DIR="$SCRIPT_DIR"

echo "🔄 开始同步版本..."
echo ""

# 第一步：获取配置
echo "📥 步骤 1/2: 获取华为 API 版本列表..."
if ! node "$SYNC_DIR/fetch-config.js"; then
  echo "❌ 获取配置失败"
  exit 1
fi
echo ""

# 第二步：同步版本
echo "🔄 步骤 2/2: 同步版本信息并获取实时下载链接..."
if ! node "$SYNC_DIR/sync-versions.js"; then
  echo "❌ 同步版本失败"
  exit 1
fi
echo ""

echo "✅ 版本同步完成！"
echo ""
echo "📊 生成的版本文件:"
ls -1 "$SCRIPT_DIR/../versions/"*.json 2>/dev/null | while read f; do
  echo "   - $(basename "$f")"
done
