import Notify from '@vant/weapp/notify/notify';
var plugin = requirePlugin("wxacommentplugin");
const app = getApp();
Page({
  data: {
    fileList:[],
    access_token: "",
    dialogShow: false,
    
    scheduleInfoLoading: true,
    scheduleType:0,
    scheduleFromCache:false,
    scheduleTitle:"",
    scheduleDescription:"",
    scheduleFromDateTimeStr:'',
    scheduleFromDateTime:undefined,
    scheduleFromDateTimeShow:false,
    // hours:[],
    // minutes:[],
    scheduleHour:0,
    scheduleMinute:0,
    lastScheduleContext:{},
    recoginzeSchedulePromise:undefined,
    
    scheduleAlarmOffset: 60 * 60 * 24,
    scheduleLocation:'',
    scheduleRemark:'',
    scheduleAlarmText: "1天前",
    scheduleAlarmPickerShow: false,
    defaultAlaramOption:8,
    alarmOptions: ["无", "日程开始时", "5分钟前", "10分钟前", "15分钟前", "30分钟前", "1小时前", "2小时前", "1天前", "2天前", "1周前"],
    
  },
  getTime: function(str) {
    return new Date(str.replace(/-/g, '/')).getTime();
  },
  onLoad: function(options){
    console.log("schedule page Onload")
    this.checkPermission();
    const eventChannel = this.getOpenerEventChannel()
    const that = this;
    if (!eventChannel) {
      console.log("竟然没有eventChannel")
      wx.navigateBack()
      return;
    }
    eventChannel.on('acceptDataFromOpenerPage', function(acceptData) {
      const scheduleInfo = {}
      scheduleInfo.scheduleTitle = acceptData.title;
      scheduleInfo.scheduleType = acceptData.scheduleType;
      scheduleInfo.scheduleFromCache = acceptData.isCache;
      scheduleInfo.scheduleDescription = acceptData.description;
      scheduleInfo.scheduleLocation = acceptData.location ? acceptData.location : ""
      if (acceptData.timeFrom) {
        if (!acceptData.timeFromStr) {
          //旧版本是没有timeFromStr
          scheduleInfo.scheduleFromDateTimeStr = acceptData.timeFrom
          scheduleInfo.scheduleFromDateTime = that.getTime(acceptData.timeFrom); 
        } else {
          scheduleInfo.scheduleFromDateTimeStr = acceptData.timeFromStr;
          scheduleInfo.scheduleFromDateTime = acceptData.timeFrom;
        }
      } else if (acceptData.timeFromStr){
        scheduleInfo.scheduleFromDateTimeStr = acceptData.timeFromStr;
          scheduleInfo.scheduleFromDateTime = that.getTIme(acceptData.timeFromStr); 
      } else {
        getApp().logOperation(acceptData.scheduleType, false, JSON.stringify(acceptData))
      }
      const scheduleAlarmText = that.getAlarmOffset(scheduleInfo.scheduleFromDateTime)
      that.setData({
        scheduleAlarmText: scheduleAlarmText,
        ...scheduleInfo
      })
    })
    
  },
  checkPermission(){
    const that = this;
    wx.authorize({
      scope: 'scope.addPhoneCalendar',
      success: () => {
        // 用户已授权，可以进行相关操作
       
      },
      fail: (e) => {
        // 用户拒绝授权，提示用户授权
        wx.showModal({
          title: '提示',
          content: '本小程序是帮你创建日程，必须获得日程权限，否则无法工作'+e.errMsg,
          confirmText: '重新授权',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting({
                success(res) {
                  if (res.authSetting["scope.addPhoneCalendar"]) {
                    
                  } else {
                    that.showModalIfAuthDeny();
                  }
                  
                },
                fail(e){
                  console.log("open setting fail:" + e);
                }
              })
            } else {
              that.showModalIfAuthDeny();
            }
          }
        })
      }
    })
  },
  showModalIfAuthDeny() {
    // 用户点击了取消按钮，提示用户无法使用该功能
    wx.showModal({
      title: '提示',
      content: '您拒绝了授权，无法创建日程。如果您需要该功能，请重新操作并进行授权',
      showCancel: false,
      success: function(res) {
        wx.navigateBack();
      }
    })
  },
  onShow(){
    console.log("schedule page onShow")
  },
  onReady() {
    this.setPickerOption();
  },

  setPickerOption(){
    const picker = this.selectComponent(".scheduleAlarmPicker");
    picker.setColumnIndex(0, this.data.defaultAlaramOption)
  },
  retry(){
    app.retry()
    wx.navigateBack()
  },
  onScheduleFromDateTimeClose(event){
    this.setData({scheduleFromDateTimeShow: false})
  },
  onScheduleFromDateTimeConfirm(event) {
    if (!event.detail) return;
    
    const scheduleAlarmText = this.getAlarmOffset(event.detail)
    this.setPickerOption();
    this.setData({
      scheduleFromDateTime: event.detail,
      scheduleFromDateTimeStr: this.formatDate(event.detail),
      scheduleAlarmText: scheduleAlarmText,
      scheduleFromDateTimeShow: false})
  },

  getAlarmOffset(scheduleFromDateTime) {

    let alaramOffset = 2;
    if (scheduleFromDateTime > 0) {

      // 当前时间戳
      const currentTimestamp = Date.now();

      // 计算剩余时间（以毫秒为单位）
      const timeDiff = scheduleFromDateTime - currentTimestamp;

      // 将剩余时间转换为分钟数
      const timeDiffMinutes = Math.floor(timeDiff / (1000 * 60));

      // 根据剩余时间选择提前提醒选项
      if (timeDiffMinutes <= 0) {
        alaramOffset = 1;
      } else if (timeDiffMinutes >= 5 && timeDiffMinutes < 10) {
        alaramOffset = 2;
      } else if (timeDiffMinutes >= 10 && timeDiffMinutes < 15) {
        alaramOffset = 3;
      } else if (timeDiffMinutes >= 15 && timeDiffMinutes < 30) {
        alaramOffset = 4;
      } else if (timeDiffMinutes >= 30 && timeDiffMinutes < 60) {
        alaramOffset = 5;
      } else if (timeDiffMinutes >= 60 && timeDiffMinutes < 120) {
        alaramOffset = 6;
      } else if (timeDiffMinutes >= 120 && timeDiffMinutes < 1440) {
        alaramOffset = 7;
      } else if (timeDiffMinutes >= 1440 && timeDiffMinutes < 129600) {
        alaramOffset = 8;
      } else if (timeDiffMinutes >= 129600 && timeDiffMinutes < 259200) {
        alaramOffset = 9;
      } else if (timeDiffMinutes >= 259200) {
        alaramOffset = 10;
      }
    }
    this.calcScheduleAlarmOffset(alaramOffset);
    
    const scheduleAlarmText = this.data.alarmOptions[alaramOffset];
    this.data.defaultAlaramOption = alaramOffset;
    return scheduleAlarmText;
    
  },
  
  onScheduleFromDateTimeClick(){
    this.setData({
      scheduleFromDateTimeShow: true
    })
  },
  
  onScheduleAlarmInputClick(){
    console.log("onScheduleAlarmInputClick")
    console.log(this.data.alarmOptions)
    this.setData({scheduleAlarmPickerShow: true})
  },
  calcScheduleAlarmOffset(index) {
    if (index == 0) {
      this.data.scheduleAlarmOffset = -1;
    } else if (index == 1) {
      this.data.scheduleAlarmOffset = 0;
    } else if (index == 2) {
      this.data.scheduleAlarmOffset = 5 * 60;
    } else if (index == 3) {
      this.data.scheduleAlarmOffset = 10 * 60;
    } else if (index == 4) {
      this.data.scheduleAlarmOffset = 15 * 60;
    } else if (index == 5) {
      this.data.scheduleAlarmOffset = 30 * 60;
    } else if (index == 6) {
      this.data.scheduleAlarmOffset = 60 * 60;
    } else if (index == 7) {
      this.data.scheduleAlarmOffset = 2 * 60 * 60;
    } else if (index == 8) {
      this.data.scheduleAlarmOffset = 24 * 60 * 60;
    } else if (index == 9) {
      this.data.scheduleAlarmOffset = 2 * 24 * 60 * 60;
    } else if (index == 10) {
      this.data.scheduleAlarmOffset = 7 * 24 * 60 * 60;
    } 
  },
  onAlarmOptionChange(event){
    const { picker, value, index } = event.detail;
    
    this.calcScheduleAlarmOffset(index);
    this.setData({
      scheduleAlarmText: value,
      scheduleAlarmPickerShow: false
    })
    
  },

  onAlarmOptionConfirm(event){
    const { picker, value, index } = event.detail;
    
    this.calcScheduleAlarmOffset(index);
    this.setData({
      scheduleAlarmText: value,
      scheduleAlarmPickerShow: false
    })
  },

  onAlarmOptionCancel() {
    this.setData({
      scheduleAlarmPickerShow: false
    })
  },
  
  onScheduleCreate() {
    const operationLogType = this.data.scheduleType + (this.data.scheduleFromCache ? 20 : 10);
    const that = this;
    wx.addPhoneCalendar({
      title: this.data.scheduleTitle,
      startTime: this.data.scheduleFromDateTime/1000,
      description: this.data.scheduleDescription,
      location: this.data.scheduleLocation,
      alarm: this.data.scheduleAlarmOffset != -1,
      alarmOffset: this.data.scheduleAlarmOffset,
      success:()=>{
        wx.request({
          url: getApp().globalData.ADMIN_HOST+'/schedules',
          method: 'POST',
          header:{
            'x-api-key': getApp().globalData.API_KEY
          },
          data: {
            "title": this.data.scheduleTitle,
            "location":this.data.scheduleLocation,
            "openid": getApp().globalData.openid,
            "startTime": this.data.scheduleFromDateTime,
            "description": this.data.scheduleDescription,
            "alarmOffset": this.data.scheduleAlarmOffset 
          },
          success: (res)=>{
            console.log("请求成功:"+res)
          },
          fail: (res)=>{
            console.log("请求失败:"+res)
          }
        });
        Notify({ type: 'success', message: '日程创建成功' });
        getApp().logOperation(operationLogType, true, "");
        if(!getApp().globalData.inviteComment){
          wx.navigateBack();
          return;
        }
        wx.showModal({
          title: '喜欢我们的小程序吗？',
          content: '请留下您的宝贵意见和建议吧！您的评价对我们很重要，能让我们走的更长更远！',
          confirmText: '愿意推荐',
          cancelText: '不好用',
          success(res) {
            if (res.confirm) {
              plugin.openComment({
                success: (res)=>{
                  getApp().commentInvited();
                },
                fail: (res) =>{
                  getApp().commentInvited();
                }
              })
              
            } else if (res.cancel) {
              getApp().commentInvited();
            }
          }
        })
      },
      fail:(e)=>{
        //只有返回errMsg
        this.handleAddCalendarFail(e, operationLogType);
      }
    })
  
    
  },

  handleAddCalendarFail(e, operationLogType) {

    const errMsg = e.errMsg;
    let userWarnTip, operationLogMsg;
    const scheduleInfoStr = `title:${this.data.scheduleTitle}, startTime:${this.data.scheduleFromDateTime}, startTimeStr:${this.data.scheduleFromDateTimeStr},location:${this.data.scheduleLocation}`;
    if (errMsg === 'addPhoneCalendar:fail cancel') {
        userWarnTip = "取消创建日程";
        operationLogMsg = "用户取消创建日程"
    } else if (errMsg === 'addPhoneCalendar:fail need startTime') {
        userWarnTip = "需要填写开始时间，请重新选择正确的开始时间";
        operationLogMsg = "开始时间未填"
    } else if (errMsg === 'addPhoneCalendar:fail:wrong format:title or startTime') {
        userWarnTip = "请检查日程标题和开始时间是否正确填写"
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


    Notify({ type: 'warning', message: userWarnTip , duration: 5000});
    getApp().logOperation(operationLogType, false, operationLogMsg+scheduleInfoStr);
},
  
  onScheduleDateFromDisplay() {
    this.setData({scheduleDateFromShow: true})
  },
  onScheduleDateFromClose(event) {
    this.setData({
      scheduleDateFromShow: false,
      scheduleDateFrom: formatDate(event.detail)
    })
  },
  formatDate(date) {
    date = new Date(date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedDate;
  },
 
  
  getAccessToken() {

    
    return new Promise((resolve, reject) => {
      
        wx.request({
          'method': 'POST',
          'url': 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=' + this.data.AK + '&client_secret=' + this.data.SK,
          fail: (error)=>{
            console.log("token request fail:" + error);
          },
          success: (res) => {
            resolve(res.data.access_token);
          }
        });
        
    })
},

});