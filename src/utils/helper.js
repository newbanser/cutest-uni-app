const dimensionMap = {
  "E": "外向-E",
  "I": "内倾-I",
  "S": "实感-S",
  "N": "直觉-N",
  "T": "思维-T",
  "F": "情感-F",
  "J": "判断-J",
  "P": "感知-P"
};

function getCampGroup(personality) {
  if (!personality || personality.length < 4) return "";
  const second = personality[1];
  if (second === "S") {
    return "S" + personality[3];
  } else if (second === "N") {
    return "N" + personality[2];
  }
  return "";
}

function getDimensionTags(personality) {
  if (!personality || personality.length !== 4) return ["未知-?", "未知-?", "未知-?", "未知-?"];
  return personality.split("").map(letter => dimensionMap[letter.toUpperCase()] || "未知-?");
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

function formatFullDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export {
  getCampGroup,
  getDimensionTags,
  formatDate,
  formatFullDate
};
