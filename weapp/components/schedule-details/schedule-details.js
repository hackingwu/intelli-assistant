// 在 Component 外部定义防抖函数
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    loadingDetails: {
      type: Boolean,
      value: true
    },
    scheduleInfo: {
      type: Object,
      value: {},
      observer: function(newVal) {
        console.log("scheduleInfo changed:", newVal);
        if (newVal && (newVal.startTime || newVal.timeFrom)) {
          const date = new Date(newVal.startTime || newVal.timeFrom); 
          this.setData({
            'scheduleInfo.dateStr': `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
            'scheduleInfo.timeStr': `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
          });
        }
        if (newVal && newVal.alarmOffset !== undefined) {
          this.setScheduleAlarmText(newVal.alarmOffset);
        }
      }
    },
    lastScheduleType: {
      type: Number,
      value: 0
    },
    lastScheduleText: {
      type: String,
      value: ''
    },
    keyboardHeight: {
      type: Number,
      value: 0
    },
    loading: {
      type: Boolean,
      value: false
    },
    isNewSchedule: {
      type: Boolean,
      value: true
    }
  },

  data: {
    alarmOptions: [
      { label: '不提醒', value: -1 },
      { label: '日程开始时', value: 0 },
      { label: '提前 5 分钟', value: 300 },
      { label: '提前 15 分钟', value: 900 },
      { label: '提前 30 分钟', value: 1800 },
      { label: '提前 1 小时', value: 3600 },
      { label: '提前 2 小时', value: 7200 },
      { label: '提前 1 天', value: 86400 },
      { label: '提前 2 天', value: 172800 },
      { label: '提前 1 周', value: 604800 },
    ],
    alarmOptionsMap: {},
    scheduleAlarmText: '日程开始时',
    scheduleAlarmOffset: 0,
    reminderIndex: 1, // 默认选中 "日程开始时"
    showReminderOptions: false,
    selectedReminder: '', // 存储当前选中的提醒选项,
    keyboardHeight: 0,
    textareaHeight: 100, // 初始高度
  },

  lifetimes: {
    attached() {
      this.initAlarmOptionsMap();
    }
  },

  methods: {
    initAlarmOptionsMap() {
      const map = {};
      this.data.alarmOptions.forEach(option => {
        map[option.value] = option.label;
      });
      this.setData({ alarmOptionsMap: map });
    },

    onHide() {
      this.triggerEvent('hide');
    },

    onScheduleCreate() {
      const { scheduleInfo } = this.data;
      // 确保 alarmOffset 有默认值
      if (scheduleInfo.alarmOffset === undefined) {
        scheduleInfo.alarmOffset = 0; // 默认为日程开始时
      }
      
      wx.addPhoneCalendar({
        title: scheduleInfo.title,
        startTime: (scheduleInfo.timeFrom || scheduleInfo.startTime) / 1000,
        description: scheduleInfo.description,
        location: scheduleInfo.location,
        alarm: scheduleInfo.alarmOffset !== -1,
        alarmOffset: scheduleInfo.alarmOffset,
        success: () => {
          this.createScheduleOnServer(scheduleInfo);
          getApp().logOperation(this.data.lastScheduleType, true, "");
          this.showSuccessNotification();
          this.handleInviteComment();
          // 触发刷新事件
          this.triggerEvent('refresh');
        },
        fail: (e) => {
          this.handleAddCalendarFail(e, scheduleInfo);
        }
      });
    },

    showSuccessNotification() {
      wx.showToast({
        title: '日程创建成功',
        icon: 'success',
        duration: 2000
      });
    },

    handleInviteComment() {
      if (!getApp().globalData.inviteComment) {
        this.setData({ show: false });
        return;
      }
      
      wx.showModal({
        title: '喜欢我们的小程序吗？',
        content: '请留下您的宝贵意见和建议吧！您的评价对我们很重要，能让我们走的更长更远！',
        confirmText: '愿意推荐',
        cancelText: '不好用',
        success: (res) => {
          if (res.confirm) {
            this.openCommentPlugin();
          } else if (res.cancel) {
            getApp().commentInvited();
          }
        }
      });
    },
    createScheduleOnServer(scheduleInfo) {
      wx.request({
        url: getApp().globalData.ADMIN_HOST + '/schedules',
        method: 'POST',
        header: {
          'x-api-key': getApp().globalData.API_KEY
        },
        data: {
          title: scheduleInfo.title,
          location: scheduleInfo.location,
          openid: getApp().globalData.openid,
          startTime: (scheduleInfo.timeFrom || scheduleInfo.startTime),
          description: scheduleInfo.description,
          alarmOffset: scheduleInfo.alarmOffset
        },
        success: (res) => {
          console.log("请求成功:", res);
        },
        fail: (res) => {
          console.log("请求失败:", res);
        }
      });
    },

    handleAddCalendarFail(e, scheduleInfo) {
      const errMsg = e.errMsg;
      let userWarnTip, operationLogMsg;
      const scheduleInfoStr = `title:${scheduleInfo.title}, startTime:${scheduleInfo.timeFrom}, startTimeStr:${new Date(scheduleInfo.timeFrom).toLocaleString()}, location:${scheduleInfo.location}`;
      
      if (errMsg === 'addPhoneCalendar:fail cancel') {
        userWarnTip = "取消创建日程";
        operationLogMsg = "用户取消创建日程";
      } else if (errMsg === 'addPhoneCalendar:fail need startTime') {
        userWarnTip = "需要填写开始时间，请重新选择正确的开始时间";
        operationLogMsg = "开始时间未填";
      } else if (errMsg === 'addPhoneCalendar:fail:wrong format:title or startTime') {
        userWarnTip = "请检查日程标题和开始时间是否正确填写";
        operationLogMsg = "标题和开始时间格式不正确";
      } else if (errMsg === 'addPhoneCalendar:fail auth deny') {
        userWarnTip = "本程序需要「添加日历」的权限，请返回首页再次操作，并授予权限";
        operationLogMsg = "未授予权限";
      } else if (errMsg === 'addPhoneCalendar:fail:not supported') {
        userWarnTip = '请在手机端上使用，不支持在PC上使用';
        operationLogMsg = "不支持";
      } else {
        userWarnTip = errMsg;
        operationLogMsg = errMsg;
      }

      wx.showToast({
        title: userWarnTip,
        icon: 'none',
        duration: 3000
      });

      getApp().logOperation(this.data.lastScheduleType + (scheduleInfo.scheduleFromCache ? 20 : 10), false, operationLogMsg + scheduleInfoStr);
    },

    onRetry() {
      this.triggerEvent('retry', { text: this.properties.lastScheduleText });
    },

    onReminderChange(e) {
      const selectedValue = this.data.alarmOptions[e.detail.value].value;
      this.setData({ 
        'scheduleInfo.alarmOffset': selectedValue
      });
    },

    setScheduleAlarmText(offset) {
      const offsetMap = [-1, 0, 5 * 60, 10 * 60, 15 * 60, 30 * 60, 60 * 60, 2 * 60 * 60, 24 * 60 * 60, 2 * 24 * 60 * 60, 7 * 24 * 60 * 60];
      const index = offsetMap.indexOf(offset);
      if (index !== -1) {
        this.setData({ 
          scheduleAlarmText: this.data.alarmOptions[index],
          reminderIndex: index
        });
      }
    },

    onTitleInput: debounce(function(e) {
      this.setData({ 
        'scheduleInfo.title': e.detail.value,
        title: e.detail.value || '新建日程'  // 更新顶部标题
      });
    }, 300),

    onLocationInput: debounce(function(e) {
      this.setData({ 'scheduleInfo.location': e.detail.value });
    }, 300),

    onDescriptionInput: debounce(function(e) {
      // 立即更新输入值
      console.log("onDescriptionInput", e.detail.value);
      this.setData({ 'scheduleInfo.description': e.detail.value });
    },300),

    onDateChange(e) {
      this.setData({ 'scheduleInfo.dateStr': e.detail.value });
      this.updateTimeFrom();
    },

    onTimeChange(e) {
      this.setData({ 'scheduleInfo.timeStr': e.detail.value });
      this.updateTimeFrom();
    },

    updateTimeFrom() {
      const { dateStr, timeStr } = this.data.scheduleInfo;
      if (dateStr && timeStr) {
        const newTimeFrom = new Date(`${dateStr} ${timeStr}`).getTime();
        this.setData({ 'scheduleInfo.timeFrom': newTimeFrom });
      }
    },

    onRecreateSchedule() {
      // 实现再次创建日程的逻辑
      this.onScheduleCreate();
    },

    onInputFocus(e) {
      // 获取当前获得焦点的输入框的位置信息
      const query = wx.createSelectorQuery().in(this);
      query.select(`.${e.target.dataset.class}`).boundingClientRect();
      query.selectViewport().scrollOffset();
      query.exec((res) => {
        if (res && res[0] && res[1]) {
          const inputTop = res[0].top;
          const scrollTop = res[1].scrollTop;
          const viewportHeight = wx.getSystemInfoSync().windowHeight;

          // 计算需要滚动的距离
          const scrollDistance = inputTop - (viewportHeight / 2) + scrollTop;

          // 滚动到合适的位置
          wx.pageScrollTo({
            scrollTop: scrollDistance,
            duration: 300
          });
        } else {
          console.error('Failed to get element position', res);
        }
      });
    },
  }
});
