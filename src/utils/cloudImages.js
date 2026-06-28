// ===== 微信云存储图片管理器 =====
//
// 使用前：
// 1. 在微信开发者工具 → 云开发控制台 → 存储 → 上传文件
//    将 crush_001.png ~ crush_037.png 和所有 81 型人格头像 PNG（intj.png, enfp.png...）
//    全部上传到同一个/images/目录下
// 2. 已配置的 fileID 示例（crush 图）：
//    cloud://cloud1-d2gz1iuxn08055996.636c-cloud1-d2gz1iuxn08055996-1433194688/images/crush_001.png
// 3. 人格头像的 fileID 格式应为：
//    cloud://cloud1-d2gz1iuxn08055996.636c-cloud1-d2gz1iuxn08055996-1433194688/images/intj.png

import { reactive } from 'vue';

// -- cloud fileID 配置 --
// 云存储文件名使用下划线 crush_001.png ~ crush_037.png
const CRUSH_FILE_ID = 'cloud://cloud1-d2gz1iuxn08055996.636c-cloud1-d2gz1iuxn08055996-1433194688/images/crush_001.png';
const AVATAR_FILE_ID = 'cloud://cloud1-d2gz1iuxn08055996.636c-cloud1-d2gz1iuxn08055996-1433194688/images/enfp.png';

const urlCache = reactive({});
let cacheTimestamp = 0;
const CACHE_TTL = 100 * 60 * 1000;
const MAX_RETRIES = 2;

function extractPrefix(fileId, pattern) {
  const prefix = fileId.replace(pattern, '');
  if (!prefix || prefix === fileId) return '';
  return prefix;
}

// ===== v3.1: 12型关系图 spec→编号映射 =====
const SPEC_TO_NUM = {
  drain_relation:'001',
  last_card:'005',
  power_clash:'008',
  greatest_love:'011',
  soul_accomplice:'014',
  money_partners:'017',
  better_with_time:'020',
  another_me:'023',
  destined_partner:'026',
  right_beside_you:'029',
  certified_fool:'032',
  former_path:'035',
};

const FIRST = ['e','i','x'], SECOND = ['s','n','x'], THIRD = ['t','f','x'], FOURTH = ['j','p','x'];

function buildAvatarFileIdList() {
  const prefix = extractPrefix(AVATAR_FILE_ID, /[a-z]+\.png$/);
  if (!prefix) return [];
  const list = [];
  FIRST.forEach(f => SECOND.forEach(s => THIRD.forEach(t => FOURTH.forEach(fo => {
    list.push(prefix + f + s + t + fo + '.png');
  }))));
  ['nf_icon','nt_icon','sj_icon','sp_icon',
   '1x_icon','2x_icon','3x_icon','4x_icon',
   'unknown','unknown_icon'].forEach(k => {
    list.push(prefix + k + '.png');
  });
  return list;
}

function buildCrushFileIdList() {
  // 云存储实际文件名为 crush_001.png ~ crush_037.png（下划线）
  const prefix = extractPrefix(CRUSH_FILE_ID, /crush_\d+\.png$/);
  if (!prefix) return [];
  const list = [];
  for (let i = 1; i <= 37; i++) {
    list.push(prefix + 'crush_' + String(i).padStart(3, '0') + '.png');
  }
  return list;
}

async function loadBatch(fileList, retryLeft = MAX_RETRIES) {
  try {
    const res = await wx.cloud.getTempFileURL({ fileList });
    if (!res || !res.fileList) throw new Error('no fileList in response');

    const failed = [];
    let loaded = 0;
    res.fileList.forEach(item => {
      if (item.tempFileURL) {
        // 去掉 .png 后缀作为缓存 key，保留下划线
        const name = item.fileID.split('/').pop().replace(/\.png$/i, '');
        urlCache[name] = item.tempFileURL;
        loaded++;
      } else {
        failed.push(item.fileID);
      }
    });

    if (failed.length > 0 && retryLeft > 0) {
      console.warn(`[cloudImages] ${failed.length} failed, retrying... (${retryLeft - 1} left)`);
      await loadBatch(failed, retryLeft - 1);
    } else if (failed.length > 0) {
      console.error(`[cloudImages] ${failed.length} final failures:`, failed.slice(0, 5));
    }
    return loaded;
  } catch (e) {
    console.error('[cloudImages] batch request failed:', e.message);
    if (retryLeft > 0) {
      console.warn(`[cloudImages] retry, ${retryLeft - 1} left`);
      return loadBatch(fileList, retryLeft - 1);
    }
    return 0;
  }
}

export async function preloadCrushImages() {
  const avatarList = buildAvatarFileIdList();
  const crushList = buildCrushFileIdList();
  const totalList = [...avatarList, ...crushList];
  if (totalList.length === 0) return;

  const batchSize = 25;
  let total = 0;
  for (let i = 0; i < totalList.length; i += batchSize) {
    const batch = totalList.slice(i, i + batchSize);
    const loaded = await loadBatch(batch);
    total += loaded;
  }
  cacheTimestamp = Date.now();
  console.log(`[cloudImages] preload done: ${total}/${totalList.length}`);
}

export function getCrushImageUrl(imageKey, spec, typeId) {
  // 云存储文件名 crush_XXX.png（下划线），缓存 key 也是 crush_XXX
  var num = '';
  if (imageKey) {
    // imageKey 已经是 crush_001 格式，直接用作缓存 key
    num = imageKey.replace('crush_', '').padStart(3, '0');
  } else if (typeId) {
    // typeId 是从 GENDER_IMAGE_MAP 传入的性别特定编号
    num = String(typeId).padStart(3, '0');
  } else {
    num = SPEC_TO_NUM[spec] || '';
  }
  if (!num) return '';
  return urlCache['crush_' + num] || '';
}

export function getAvatarCloudUrl(code) {
  const key = (code || 'unknown').toLowerCase();
  return urlCache[key] || '';
}

export function isCacheStale() {
  return Date.now() - cacheTimestamp > CACHE_TTL;
}
