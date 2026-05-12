#!/bin/bash
# 从华为 API 获取每个包的真实下载链接
# 用法: ./scripts/fetch-download-urls-from-api.sh <version_file>

set -e

CONFIG_FILE=".github/huawei-api-config.txt"
VERSION_FILE="${1:-versions/6.1.1.268.json}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ 错误: 配置文件 $CONFIG_FILE 不存在"
  exit 1
fi

if [ ! -f "$VERSION_FILE" ]; then
  echo "❌ 错误: 版本文件 $VERSION_FILE 不存在"
  exit 1
fi

echo "📥 从华为 API 获取真实下载链接..."
echo "版本文件: $VERSION_FILE"
echo ""

# 读取配置文件
source "$CONFIG_FILE"

# 构建 Cookie 字符串（简化版本）
COOKIE_STRING="urlBeforeLogin=$urlBeforeLogin"
COOKIE_STRING="$COOKIE_STRING; state=$state"
COOKIE_STRING="$COOKIE_STRING; CASLOGINSITE=$CASLOGINSITE"
COOKIE_STRING="$COOKIE_STRING; LOGINACCSITE=$LOGINACCSITE"
COOKIE_STRING="$COOKIE_STRING; HuaweiID_CAS_ISCASLOGIN=$HuaweiID_CAS_ISCASLOGIN"
COOKIE_STRING="$COOKIE_STRING; HWWAFSESID=$HWWAFSESID"
COOKIE_STRING="$COOKIE_STRING; HWWAFSESTIME=$HWWAFSESTIME"
COOKIE_STRING="$COOKIE_STRING; csrfToken=$csrfToken"
COOKIE_STRING="$COOKIE_STRING; x-siteId=$x_siteId"
COOKIE_STRING="$COOKIE_STRING; x-country=$x_country"
COOKIE_STRING="$COOKIE_STRING; X-HD-SESSION=$X_HD_SESSION"
COOKIE_STRING="$COOKIE_STRING; x-hd-grey=$x_hd_grey"

# 提取版本信息
BUILD_VERSION=$(jq -r '.buildVersion' "$VERSION_FILE")
VERSION_ID=$(jq -r '.versionId' "$VERSION_FILE")

echo "构建版本: $BUILD_VERSION"
echo "版本 ID: $VERSION_ID"
echo ""

# 创建临时文件保存更新后的版本数据
TEMP_FILE="/tmp/${BUILD_VERSION}_updated.json"
cp "$VERSION_FILE" "$TEMP_FILE"

# 遍历每个平台获取真实下载链接
jq -r '.platforms | to_entries[] | "\(.key)|\(.value.sdkId)|\(.value.packageId)"' "$VERSION_FILE" | while IFS='|' read -r platform_key sdk_id package_id; do
  if [ -z "$sdk_id" ] || [ -z "$package_id" ]; then
    echo "⚠️  跳过 $platform_key: 缺少 SDK ID 或 Package ID"
    continue
  fi

  echo "📤 获取 $platform_key 的下载链接..."
  echo "   SDK ID: $sdk_id"
  echo "   Package ID: $package_id"
  echo "   Version ID: $VERSION_ID"

  # 调用 API 获取下载链接
  RESPONSE=$(curl -s "$API_BASE_URL" \
    -H 'accept: application/json, text/plain, */*' \
    -H 'accept-language: zh-CN,zh;q=0.9' \
    -H 'content-type: application/json;charset=UTF-8' \
    -H "Cookie: $COOKIE_STRING" \
    -H 'origin: https://developer.huawei.com' \
    -H 'referer: https://developer.huawei.com/' \
    -H 'sec-fetch-dest: empty' \
    -H 'sec-fetch-mode: cors' \
    -H 'sec-fetch-site: same-site' \
    -H 'user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15' \
    -H "x-hd-csrf: $csrfToken" \
    -H "x-hd-date: $(date -u +%Y%m%dT%H%M%SZ)" \
    -H "x-hd-serialno: $RANDOM" \
    --data-raw "{\"svc\":\"PartnerCommunityService/v1/developer/downloadCenter/getToolVersionDownloadUrl\",\"reqType\":1,\"reqJson\":\"{\\\"sdkId\\\":\\\"$sdk_id\\\",\\\"versionId\\\":\\\"$VERSION_ID\\\",\\\"packageId\\\":\\\"$package_id\\\"}\"}")

  # 检查响应
  if ! echo "$RESPONSE" | jq . > /dev/null 2>&1; then
    echo "❌ API 返回无效 JSON: $RESPONSE"
    continue
  fi

  # 检查返回状态
  RETURN_CODE=$(echo "$RESPONSE" | jq -r '.returnCode // "999"')
  if [ "$RETURN_CODE" != "0" ]; then
    echo "❌ API 返回错误代码: $RETURN_CODE"
    echo "响应: $(echo "$RESPONSE" | jq .)"
    continue
  fi

  # 提取下载链接
  DOWNLOAD_URL=$(echo "$RESPONSE" | jq -r '.resJson | fromjson | .value.downloadUrl // empty')

  if [ -n "$DOWNLOAD_URL" ]; then
    echo "✅ 获得下载链接: $(echo "$DOWNLOAD_URL" | cut -c1-80)..."

    # 更新临时文件中的下载链接
    # 注意: 这里需要转义特殊字符以适应 jq
    ESCAPED_URL=$(echo "$DOWNLOAD_URL" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')

    jq ".platforms[\"$platform_key\"].downloadUrl = \"$ESCAPED_URL\"" "$TEMP_FILE" > "${TEMP_FILE}.tmp" && mv "${TEMP_FILE}.tmp" "$TEMP_FILE"
  else
    echo "❌ 无法从 API 响应中提取下载链接"
  fi

  echo ""
  # 避免 API 限制，每个请求间隔 1 秒
  sleep 1
done

# 将更新后的版本文件复制回原位置
cp "$TEMP_FILE" "$VERSION_FILE"
echo "✅ 已更新: $VERSION_FILE"

# 清理临时文件
rm -f "$TEMP_FILE"

echo ""
echo "✅ 下载链接更新完成"
echo ""
echo "📝 更新的 URL 摘要:"
jq -r '.platforms | to_entries[] | "\(.key): \(.value.downloadUrl | sub(".*\/"; "") | sub("\?.*"; ""))"' "$VERSION_FILE"
