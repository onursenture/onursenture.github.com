module.exports = function () {
  const now = new Date();
  return {
    hash: now.getTime().toString(36),
    date: now,
  };
};
