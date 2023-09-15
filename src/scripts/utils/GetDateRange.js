const GetDateRange = (howManyDayAgo) => {
  const date = new Date(new Date().valueOf() + 18000000)
  const today = date.toISOString().slice(0, 10);
  const dateAgo =
    date.getFullYear() +
    "-" +
    (date.getMonth() + 1) +
    "-" +
    (date.getDate() - howManyDayAgo);
  return { today, dateAgo };
};

module.exports = GetDateRange;
