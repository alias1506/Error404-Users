const calculateLevel = (xp) => {
  if (xp < 100) return 1;
  return Math.floor((xp - 100) / 150) + 2;
};

const getRankTitle = (level) => {
  if (level < 5) return 'Noob Debugger';
  if (level < 10) return 'Syntax Slayer';
  if (level < 20) return 'Bug Hunter';
  if (level < 30) return 'Code Ninja';
  if (level < 40) return 'Error Destroyer';
  return 'Cyber Wizard';
};

module.exports = {
  calculateLevel,
  getRankTitle
};
