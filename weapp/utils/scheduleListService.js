const { fetchSchedules } = require('./scheduleService');
const { formatDate, formatTime } = require('./dateUtils');

const loadSchedules = async (isHistoryView) => {
  try {
    const schedules = await fetchSchedules(isHistoryView ? 'done' : 'pending');
    const formattedSchedules = schedules.map(schedule => ({
      ...schedule,
      dateStr: formatDate(schedule.startTime),
      timeStr: formatTime(schedule.startTime)
    }));
    return isHistoryView 
      ? groupSchedulesByYear(formattedSchedules)
      : groupSchedulesByTime(formattedSchedules);
  } catch (error) {
    console.error('loadSchedules failed:', error);
    throw error;
  }
};

const groupSchedulesByTime = (schedules) => {
  const now = new Date().getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  const threeMonths = 90 * 24 * 60 * 60 * 1000;

  const timeSections = [
    { title: '近一周', schedules: [] },
    { title: '近一个月', schedules: [] },
    { title: '近三个月', schedules: [] },
    { title: '未来', schedules: [] }
  ];

  schedules.forEach(schedule => {
    const timeFrom = new Date(schedule.startTime).getTime();
    if (timeFrom - now <= oneWeek) {
      timeSections[0].schedules.push(schedule);
    } else if (timeFrom - now <= oneMonth) {
      timeSections[1].schedules.push(schedule);
    } else if (timeFrom - now <= threeMonths) {
      timeSections[2].schedules.push(schedule);
    } else {
      timeSections[3].schedules.push(schedule);
    }
  });

  return timeSections;
};

const groupSchedulesByYear = (schedules) => {
  const yearSections = {};

  schedules.forEach(schedule => {
    const year = new Date(schedule.startTime).getFullYear();
    if (!yearSections[year]) {
      yearSections[year] = [];
    }
    yearSections[year].push(schedule);
  });

  return Object.entries(yearSections).map(([year, schedules]) => ({
    title: `${year}年`,
    schedules: schedules
  })).sort((a, b) => parseInt(b.title) - parseInt(a.title));
};

module.exports = {
  loadSchedules,
  groupSchedulesByTime,
  groupSchedulesByYear
};
