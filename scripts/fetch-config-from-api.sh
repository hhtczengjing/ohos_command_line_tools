#!/bin/bash
# 从华为 API 获取最新的版本列表并生成 config.json
# 用法: ./scripts/fetch-config-from-api.sh

set -e

CONFIG_FILE=".github/huawei-api-config.txt"
OUTPUT_FILE="config.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ 错误: 配置文件 $CONFIG_FILE 不存在"
  echo "请先创建配置文件，参考 .github/huawei-api-config.txt.example"
  exit 1
fi

echo "📥 从华为 API 获取版本列表..."
echo "配置文件: $CONFIG_FILE"
echo ""

# 读取配置文件
source "$CONFIG_FILE"

# 构建 Cookie 字符串
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

# 构建 authInfo JSON
AUTHINFO_JSON=$(jq -n \
  --arg accesstoken "$authInfo_accesstoken" \
  --arg createtime "$authInfo_createtime" \
  --arg expiretime "$authInfo_expiretime" \
  --arg rtCiphertext "$authInfo_rtCiphertext" \
  --arg signature "$authInfo_signature" \
  --arg siteID "$authInfo_siteID" \
  '{
    accesstoken: $accesstoken,
    createtime: $createtime,
    expiretime: $expiretime,
    rtCiphertext: $rtCiphertext,
    signature: $signature,
    siteID: $siteID
  }')

AUTHINFO_COOKIE=$(echo "$AUTHINFO_JSON" | jq -c . | sed 's/"/\\"/g')

# 构建 authdata JSON
AUTHDATA_JSON=$(jq -n \
  --arg accesstoken "$authdata_accesstoken" \
  --arg createtime "$authdata_createtime" \
  --arg expiretime "$authdata_expiretime" \
  --arg loginTime "$authdata_loginTime" \
  --arg rtCiphertext "$authdata_rtCiphertext" \
  --arg signature "$authdata_signature" \
  --arg siteID "$authdata_siteID" \
  '{
    accesstoken: $accesstoken,
    createtime: $createtime,
    expiretime: $expiretime,
    loginTime: $loginTime,
    rtCiphertext: $rtCiphertext,
    signature: $signature,
    siteID: $siteID
  }')

AUTHDATA_COOKIE=$(echo "$AUTHDATA_JSON" | jq -c . | sed 's/"/\\"/g')

# 完整 Cookie 字符串
FULL_COOKIE="$COOKIE_STRING; authInfo=\"$AUTHINFO_COOKIE\"; authdata=\"$AUTHDATA_COOKIE\"; developer_userinfo=%7B%22siteid%22%3A%221%22%2C%22expiretime%22%3A%2220260512T062058Z%22%2C%22cookieExpireTime%22%3A%2220260611T013450Z%22%2C%22csrftoken%22%3A%22408F61157739323EBF54CBB5599A610117D08A3F948BE4B6C2%22%7D; developer_userdata=%7B%22siteid%22%3A%221%22%2C%22expiretime%22%3A%2220260512T062058Z%22%2C%22cookieExpireTime%22%3A%2220260611T013450Z%22%2C%22csrftoken%22%3A%22408F61157739323EBF54CBB5599A610117D08A3F948BE4B6C2%22%7D"

# 调用 API 获取版本列表
echo "📤 调用 API: getToolVersionList"
RESPONSE=$(curl -s "$API_BASE_URL" \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'content-type: application/json;charset=UTF-8' \
  -H "Cookie: $FULL_COOKIE" \
  -H 'origin: https://developer.huawei.com' \
  -H 'referer: https://developer.huawei.com/' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15' \
  -H "x-hd-csrf: $csrfToken" \
  -H 'x-hd-date: 20260512T053409Z' \
  -H 'x-hd-serialno: 2602195' \
  --data-raw "{\"svc\":\"PartnerCommunityService/v1/developer/downloadCenter/getToolVersionList\",\"reqType\":1,\"reqJson\":\"{\\\"toolAlias\\\":\\\"$API_TOOL_ALIAS\\\",\\\"language\\\":\\\"$API_LANGUAGE\\\"}\"}")

# 检查响应
if ! echo "$RESPONSE" | jq . > /dev/null 2>&1; then
  echo "❌ API 响应不是有效的 JSON"
  echo "响应内容: $RESPONSE"
  exit 1
fi

# 检查是否成功
if echo "$RESPONSE" | jq -e '.returnCode' > /dev/null 2>&1; then
  RETURN_CODE=$(echo "$RESPONSE" | jq -r '.returnCode')
  if [ "$RETURN_CODE" != "0" ]; then
    echo "❌ API 返回错误代码: $RETURN_CODE"
    echo "响应: $(echo "$RESPONSE" | jq .)"
    exit 1
  fi
fi

# 保存原始响应到 config.json
echo "$RESPONSE" > "$OUTPUT_FILE"
echo "✅ 已保存: $OUTPUT_FILE"
echo ""

# 显示版本列表
echo "📋 获取到的版本列表:"
echo "$RESPONSE" | jq -r '.resJson | fromjson | .value.versionTypeList[0].versionList[] | "\(.buildVersion): \(.versionName)"' | head -20

echo ""
echo "✅ 版本列表获取完成"
