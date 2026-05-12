#!/usr/bin/env node

/**
 * fetch-config.js
 * 调用华为 API 获取版本列表信息并保存为 config.json
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, 'config.json');

// 从环境变量或配置文件读取 Cookie
function getCookie() {
  // 尝试从 .github/huawei-api-config.txt 读取
  const configPath = path.join(__dirname, '../.github/huawei-api-config.txt');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/^COOKIE=(.+)$/m);
    if (match) {
      return match[1].trim();
    }
  }

  // 从环境变量读取
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
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function fetchConfig() {
  console.log('📥 正在获取华为 API 版本列表...');

  const cookie = getCookie();
  if (!cookie) {
    console.error('❌ 错误: 未找到华为 Cookie');
    console.error('   请在 .github/huawei-api-config.txt 中设置 COOKIE');
    process.exit(1);
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
    svc: 'PartnerCommunityService/v1/developer/downloadCenter/getToolVersionList',
    reqType: 1,
    reqJson: JSON.stringify({
      toolAlias: 'command-line-tools-for-hmos',
      language: 'cn'
    })
  };

  try {
    const response = await makeRequest(options, data);

    if (response.returnCode !== '0') {
      throw new Error(`API 返回错误: ${response.description}`);
    }

    // 保存原始响应
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(response, null, 2));
    console.log(`✅ 成功获取配置，已保存到: ${CONFIG_FILE}`);

    // 解析并显示版本信息
    try {
      const resJson = JSON.parse(response.resJson);
      const versions = resJson.value?.versionTypeList?.[0]?.versionList || [];
      console.log(`\n📦 发现 ${versions.length} 个版本:`);
      versions.forEach(v => {
        console.log(`   - ${v.buildVersion}: ${v.versionName}`);
      });
    } catch (e) {
      // 忽略解析错误
    }

  } catch (error) {
    console.error(`❌ 获取配置失败: ${error.message}`);
    process.exit(1);
  }
}

fetchConfig();
