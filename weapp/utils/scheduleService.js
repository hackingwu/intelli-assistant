const md5 = require('blueimp-md5');
const config = require('./config');
const app = getApp();

const fetchSchedules = (tabActive) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '加载中...',
      mask: false // Set mask to true to prevent user interaction during loading
    });

    const now = new Date().getTime();
    let timeFrom = now, timeTo = now;
    const tenYearMills = 10 * 365 * 24 * 60 * 60 * 1000;

    if (tabActive === 'pending') {
      timeTo = now + tenYearMills;
    } else if (tabActive === 'done') {
      timeFrom = now - tenYearMills;
    }

    wx.request({
      url: `${app.globalData.ADMIN_HOST}/schedules`,
      header: {
        'x-api-key': app.globalData.API_KEY
      },
      data: {
        openid: app.globalData.openid,
        timeFrom: timeFrom,
        timeTo: timeTo
      },
      success: (res) => {
        const scheduleList = res.data;
        if (tabActive === 'pending') {
          scheduleList.sort((a, b) => a.startTime - b.startTime);
        }
        scheduleList.forEach(item => {
          item.time = formatDate(item.startTime);
        });
        wx.hideLoading();
        resolve(scheduleList);
      },
      fail: (res) => {
        wx.hideLoading();
        wx.showToast({
          title: res.errMsg,
          icon: 'none'
        });
        reject(res);
      }
    });
  });
};

const formatDate = (startTime) => {
  const date = new Date(startTime);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = `${year}年${month}月${day}日 星期${week} ${hours}:${minutes}`;
  return timeStr;
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

const recognizeSchedule = (text, fromCache = true) => {
  console.log('recognizeSchedule called with:', text, fromCache);
  const md5Value = md5(text);

  const fetchDataFromServer = () => new Promise((resolve, reject) => {
    wx.request({
      url: `${config.ADMIN_HOST}/help_remember`,
      method: 'POST',
      header: {
        'x-api-key': config.API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        'text': text
      },
      success: (resp) => {
        const scheduleInfo = {};
        const respData = resp.data;
        scheduleInfo.title = respData.title;
        const timeFrom = respData.dateTimeFrom;
        scheduleInfo.startTimeStr = timeFrom;
        scheduleInfo.startTime = respData.timestampFrom;
        scheduleInfo.description = respData.description;
        scheduleInfo.location = respData.location;
        // Set alarmOffset based on the start time
        const now = new Date().getTime();
        const startTime = new Date(respData.timestampFrom).getTime();
        const timeDiff = startTime - now;

        if (timeDiff <= 15 * 60 * 1000) { // Within 15 minutes
            scheduleInfo.alarmOffset = 0; // Remind at event time
        } else if (timeDiff <= 60 * 60 * 1000) { // Within 1 hour
            scheduleInfo.alarmOffset = 900; // 15 minutes before
        } else if (timeDiff <= 24 * 60 * 60 * 1000) { // Within 1 day
            scheduleInfo.alarmOffset = 3600; // 1 hour before
        } else if (timeDiff <= 7 * 24 * 60 * 60 * 1000) { // Within 1 week
            scheduleInfo.alarmOffset = 86400; // 1 day before
        } else {
            scheduleInfo.alarmOffset = 604800; // 1 week before
        }

        if (timeFrom && scheduleInfo.title && scheduleInfo.title !== "") {
          wx.setStorageSync(md5Value, scheduleInfo);
          resolve(scheduleInfo);
        } else {
          reject(new Error("未识别到日程，请重试或更换内容"));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg));
      }
    });
  });

  if (!fromCache) {
    return fetchDataFromServer();
  }

  return new Promise((resolve, reject) => {
    wx.getStorage({
      key: md5Value,
      success: res => {
        console.log("从storage中获取:" + JSON.stringify(res.data));
        res.data["isCache"] = true;
        resolve(res.data);
      },
      fail: () => {
        fetchDataFromServer().then(res => {
          res["isCache"] = false;
          resolve(res);
        }).catch(err => reject(err));
      }
    });
  });
};

module.exports = {
  fetchSchedules,
  groupSchedulesByTime,
  recognizeSchedule
};
