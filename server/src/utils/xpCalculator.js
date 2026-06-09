const calculateLevel = (xp) => {
  // Simple leveling formula: Level = floor(sqrt(XP / 100)) + 1
  return Math.floor(Math.sqrt(xp / 100)) + 1;
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
