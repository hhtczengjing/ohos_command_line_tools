#!/usr/bin/env node

/**
 * sync-versions.js
 * 从 config.json 提取版本信息，并通过华为 API 获取真实下载地址
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, 'config.json');
const VERSIONS_DIR = path.join(__dirname, '../versions');

// 平台映射关系 - 根据 osType 映射
const OS_TYPE_MAP = {
  1: 'windows-x64',
  2: 'linux-x86',
  3: 'macos-x86',
  4: 'macos-arm64'
};

// 从环境变量或配置文件读取 Cookie
function getCookie() {
  const configPath = path.join(__dirname, '../.github/huawei-api-config.txt');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/^COOKIE=(.+)$/m);
    if (match) {
      return match[1].trim();
    }
  }
  return process.env.HUAWEI_COOKIE || '';
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getDownloadUrl(sdkId, versionId, packageId) {
  const cookie = getCookie();
  if (!cookie) {
    throw new Error('未找到华为 Cookie');
  }

  const options = {
    hostname: 'svc-drcn.developer.huawei.com',
    port: 443,
    path: '/svc/community/common/v1/delegate',
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Content-Type': 'application/json;charset=UTF-8',
      'Cookie': cookie,
      'Origin': 'https://developer.huawei.com',
      'Referer': 'https://developer.huawei.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'X-HD-CSRF': cookie.match(/csrfToken=([^;]+)/)?.[1] || '',
      'X-HD-Date': new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'X-HD-SerialNo': Math.floor(Math.random() * 10000000).toString()
    }
  };

  const data = {
    svc: 'PartnerCommunityService/v1/developer/downloadCenter/getToolVersionDownloadUrl',
    reqType: 1,
    reqJson: JSON.stringify({
      sdkId: sdkId,
      versionId: versionId,
      packageId: packageId
    })
  };

  const response = await makeRequest(options, data);

  if (response.returnCode !== '0') {
    throw new Error(`获取下载 URL 失败: ${response.description}`);
  }

  try {
    const resJson = JSON.parse(response.resJson);
    return resJson.value?.downloadUrl || null;
  } catch (e) {
    throw new Error(`解析下载 URL 失败: ${e.message}`);
  }
}

async function syncVersions() {
  console.log('🔄 同步版本信息...');

  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`❌ 错误: 未找到 config.json，请先运行 fetch-config.js`);
    process.exit(1);
  }

  const configContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
  let config;
  try {
    config = JSON.parse(configContent);
  } catch (e) {
    console.error(`❌ 解析 config.json 失败: ${e.message}`);
    process.exit(1);
  }

  if (!fs.existsSync(VERSIONS_DIR)) {
    fs.mkdirSync(VERSIONS_DIR, { recursive: true });
  }

  try {
    const resJson = JSON.parse(config.resJson);
    const versionTypeList = resJson.value?.versionTypeList || [];

    if (versionTypeList.length === 0) {
      console.error('❌ 错误: 未找到版本信息');
      process.exit(1);
    }

    // 创建一个映射，按 buildVersion 汇总来自所有 osType 的包
    const versionMap = new Map();

    // 遍历所有 versionTypeList（每个对应一个平台/osType）
    for (const versionType of versionTypeList) {
      const osType = versionType.osType;
      const platformId = OS_TYPE_MAP[osType];

      if (!platformId) {
        console.warn(`⚠️  未知的 osType: ${osType}，跳过`);
        continue;
      }

      const versionList = versionType.versionList || [];
      console.log(`📱 处理 osType=${osType} (${platformId}): ${versionList.length} 个版本`);

      for (const version of versionList) {
        const buildVersion = version.buildVersion;

        // 如果版本还未在 map 中，则创建新条目
        if (!versionMap.has(buildVersion)) {
          versionMap.set(buildVersion, {
            versionName: version.versionName,
            buildVersion: version.buildVersion,
            publishTime: version.publishTime,
            versionId: version.versionId,
            platforms: {}
          });
        }

        const versionData = versionMap.get(buildVersion);
        const packageList = version.packageList || [];

        for (const pkg of packageList) {
          console.log(`   ⏳ 正在获取 ${platformId} 的下载 URL (${buildVersion})...`);

          try {
            const downloadUrl = await getDownloadUrl(pkg.sdkId, version.versionId, pkg.packageId);

            versionData.platforms[platformId] = {
              showName: pkg.showName,
              packageName: pkg.packageName,
              downloadUrl: downloadUrl || '',
              sha256: pkg.sha256,
              packageSize: pkg.packageSize,
              sdkId: pkg.sdkId,
              packageId: pkg.packageId
            };

            console.log(`   ✅ ${platformId}: 获取成功`);
          } catch (error) {
            console.warn(`   ❌ ${platformId}: ${error.message}`);
            // 继续处理其他平台
          }

          // 避免请求过快，等待 500ms
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    // 保存所有版本文件
    console.log(`\n💾 保存版本文件...`);
    let savedCount = 0;
    for (const [buildVersion, versionData] of versionMap) {
      const versionFile = path.join(VERSIONS_DIR, `${buildVersion}.json`);
      fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
      console.log(`   ✅ ${buildVersion} (${Object.keys(versionData.platforms).length} 个平台)`);
      savedCount++;
    }

    console.log(`\n✅ 版本同步完成！共保存 ${savedCount} 个版本`);
  } catch (error) {
    console.error(`❌ 同步失败: ${error.message}`);
    process.exit(1);
  }
}

syncVersions();
