const firstLetters = ['e', 'i', 'x'];
const secondLetters = ['s', 'n', 'x'];
const thirdLetters = ['t', 'f', 'x'];
const fourthLetters = ['j', 'p', 'x'];

const imagePaths = {};

firstLetters.forEach(f => {
  secondLetters.forEach(s => {
    thirdLetters.forEach(t => {
      fourthLetters.forEach(fo => {
        const key = f + s + t + fo;
        imagePaths[key] = `/static/images/${key}.png`;
      });
    });
  });
});

imagePaths['logo'] = '/static/images/logo.png';
imagePaths['nf_icon'] = '/static/images/nf_icon.png';
imagePaths['nt_icon'] = '/static/images/nt_icon.png';
imagePaths['sj_icon'] = '/static/images/sj_icon.png';
imagePaths['sp_icon'] = '/static/images/sp_icon.png';
imagePaths['1x_icon'] = '/static/images/1x_icon.png';
imagePaths['2x_icon'] = '/static/images/2x_icon.png';
imagePaths['3x_icon'] = '/static/images/3x_icon.png';
imagePaths['4x_icon'] = '/static/images/4x_icon.png';
imagePaths['tab_home'] = '/static/images/tab_home.png';
imagePaths['tab_home_active'] = '/static/images/tab_home_active.png';
imagePaths['unknown'] = '/static/images/unknown.png';
imagePaths['unknown_icon'] = '/static/images/unknown_icon.png';
imagePaths['delete'] = '/static/images/delete.png';

function getPersonalityAvatar(personality) {
  const lowerPersonality = (personality || 'unknown').toLowerCase();
  return imagePaths[lowerPersonality] || imagePaths['unknown'];
}

function getCampIconUrl(personality) {
  const camp = getCampGroup(personality);
  const iconKey = camp.toLowerCase() + '_icon';
  return imagePaths[iconKey] || imagePaths['unknown_icon'];
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
