import { getAvatarCloudUrl } from './cloudImages';

// 本地路径表 — 仅保留仍在本地的图
const localPaths = {
  'logo': '/static/images/logo.png',
  'tab_home': '/static/images/tab_home.png',
  'tab_home_active': '/static/images/tab_home_active.png',
  'delete': '/static/images/delete.png',
  'unknown': '/static/images/unknown.png',
  'unknown_icon': '/static/images/unknown_icon.png',
};

// 本地阵营图标映射（云未就绪时的兜底）
const campIconLocal = {
  'nf': '/static/images/nf_icon.png',
  'nt': '/static/images/nt_icon.png',
  'sj': '/static/images/sj_icon.png',
  'sp': '/static/images/sp_icon.png',
  '1x': '/static/images/1x_icon.png',
  '2x': '/static/images/2x_icon.png',
  '3x': '/static/images/3x_icon.png',
  '4x': '/static/images/4x_icon.png',
};

function getPersonalityAvatar(personality) {
  const code = (personality || 'unknown').toLowerCase();
  // 优先云存储链接
  const cloudUrl = getAvatarCloudUrl(code);
  if (cloudUrl) return cloudUrl;
  // 云未就绪时返回 unknown 占位图
  return '/static/images/unknown.png';
}

function getCampIconUrl(personality) {
  const camp = getCampGroup(personality);
  if (!camp) return '';
  const key = camp.toLowerCase() + '_icon';
  // 优先云存储链接
  const cloudUrl = getAvatarCloudUrl(key);
  if (cloudUrl) return cloudUrl;
  // 云未就绪时返回空
  return campIconLocal[key] || '/static/images/unknown_icon.png';
}

function getCampGroup(personality) {
  if (!personality || personality.length < 4) return '';
  const xCount = (personality.match(/X/g) || []).length;
  if (xCount === 0) {
    const second = personality[1];
    if (second === 'S' || second === 's') {
      return 'S' + personality[3].toUpperCase();
    } else if (second === 'N' || second === 'n') {
      return 'N' + personality[2].toUpperCase();
    }
  } else if (xCount === 1) {
    return '1X';
  } else if (xCount === 2) {
    return '2X';
  } else if (xCount === 3) {
    return '3X';
  } else if (xCount === 4) {
    return '4X';
  }
  return '';
}

export {
  getPersonalityAvatar,
  getCampIconUrl,
  getCampGroup
};
