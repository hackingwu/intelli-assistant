// pages/index.js
const txtExample = require('./txtExample');
const app = getApp();
const config = require('../../utils/config');
const { fetchSchedules, groupSchedulesByTime, recognizeSchedule } = require('../../utils/scheduleService');
const { md5, base64, ocr } = require('../../utils/utils');  // 修改这一行，添加 ocr

const { formatDate, formatTime } = require('../../utils/dateUtils');
const { loadSchedules } = require('../../utils/scheduleListService');

Page({
  data: {
    txt: "",
    txtDialogShow: false,
    scheduleInfo: {},
    lastScheduleText: "",
    lastScheduleType: 0,
    justTryTimes: 0,
    showPrivacy: false,
    hasSchedules: true,
    showOptions: false,
    showTextInput: false,
    inputText: '',
    showAddButton: true,
    textareaFocus: false,
    keyboardHeight: 0,
    popupTransform: 'translateY(0)',
    showDetails: false,
    isRefreshing: false,
    isLoading: false,
    showSidebar: false,
    userInfo: {},
    loadingDetails: false,
    isNewSchedule: false,
    isHistoryView: false // 新增：控制是否显示历史视图
  },

  onLoad(options) {
    wx.getPrivacySetting({
      success: res => {
        console.log('Privacy setting:', res);
        if (res.needAuthorization) {
          this.setData({ showPrivacy: true });
        }
      }
    });

    wx.login({
      success: res => {
        console.log('wx.login success:', res);
        if (res.code) {
          wx.request({
            url: `${config.ADMIN_HOST}/accounts/login`,
            data: { code: res.code },
            header: { 'x-api-key': config.API_KEY },
            success: res => {
              console.log('Login request success:', res);
              const resData = res.data;
              this.data.access_token = resData.baiduToken;
              app.afterLogin(resData);
              setTimeout(() => {
                this.loadSchedules();
              }, 500); // 添加500ms的延迟
            },
            fail: err => {
              console.error('Login request failed:', err);
              wx.showToast({
                title: '登录失败！' + err.errMsg,
                icon: 'none',
                duration: 2000
              });
            }
          });
        } else {
          console.error('wx.login failed:', res.errMsg);
          wx.showToast({
            title: '登录失败！' + res.errMsg,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('wx.login failed:', err);
        wx.showToast({
          title: '登录失败！' + err.errMsg,
          icon: 'none',
          duration: 2000
        });
      }
    });

    // 添加键盘高度变化监听
    wx.onKeyboardHeightChange(res => {
      const keyboardHeight = res.height;
      this.setData({ keyboardHeight: keyboardHeight });
    });
  },

  onUnload() {
    wx.offKeyboardHeightChange();
  },

  async loadSchedules() {
    try {
      const timeSections = await loadSchedules(this.data.isHistoryView);
      const hasSchedules = timeSections.some(section => section.schedules.length > 0);
      this.setData({ 
        timeSections, 
        hasSchedules,
        showAddButton: !this.data.isHistoryView
      });
    } catch (error) {
      console.error('loadSchedules failed:', error);
      wx.showToast({
        title: '加载日程失败',
        icon: 'none'
      });
    }
  },

  justTryText() {
    const randomIndex = this.data.justTryTimes++ % txtExample.length;
    this.setData({ inputText: txtExample[randomIndex] });
  },

  addFromText() {
    this.setData({
      showTextInput: true,
      showOptions: false,
      showAddButton: false,
      textareaFocus: true,
      textInputBottom: this.data.keyboardHeight
    }, () => {
      wx.nextTick(() => {
        this.setData({ textareaFocus: true });
      });
    });
  },

  hideTextInput() {
    this.setData({
      showTextInput: false,
      inputText: '',
      showAddButton: true,
      textareaFocus: false,
      textInputBottom: 0
    });
  },

  onTextInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendText() {
    console.log('sendText called, inputText:', this.data.inputText);
    if (this.data.inputText.trim()) {
      const textToSend = this.data.inputText;
      this.setData({
        showTextInput: false,
        showAddButton: false,
        loadingDetails: true,
        showDetails: true
      }, () => {
        console.log('After setData in sendText, this.data:', this.data);
        this.createSchedule(textToSend);
      });
    } else {
      wx.showToast({ title: '请输入文字', icon: 'none' });
    }
  },

  toggleAddOptions() {
    this.setData({
      showOptions: !this.data.showOptions,
      showAddButton: true
    });
  },

  hideAddOptions() {
    this.setData({ showOptions: false });
  },

  addFromImage() {
    this.hideAddOptions();
    this.onScanImgBtnClick();
  },

  addFromPDF() {
    this.hideAddOptions();
    this.onScanPdfBtnClick();
  },

  onScanImgBtnClick() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择', '导入微信聊天图片'],
      success: res => {
        if (res.cancel) return;
        if (res.tapIndex === 0) {
          this.onCameraImg();
        } else if (res.tapIndex === 1) {
          this.onAlbumImg();
        } else if (res.tapIndex === 2) {
          this.onMsgFile();
        }
      }
    });
  },

  onCameraImg() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: res => {
        this.createScheduleFrom('image', res.tempFiles[0].tempFilePath);
      }
    });
  },

  onAlbumImg() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: res => {
        this.createScheduleFrom('image', res.tempFiles[0].tempFilePath);
      }
    });
  },

  onMsgFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success: res => {
        this.createScheduleFrom('image', res.tempFiles[0].path);
      }
    });
  },

  onScanPdfBtnClick() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: res => {
        this.createScheduleFrom('pdf_file', res.tempFiles[0].path);
      }
    });
  },

  async createScheduleFrom(type, filePath) {
    const loadingMsg = `从${type === 'image' ? '图片' : 'PDF文件'}中提取文本信息`;
    this.setData({
      showAddButton: false,
      loadingDetails: true,
      showDetails: true
      
    });

    try {
      const base64Data = await base64(filePath);
      const ocrResult = await ocr(type, base64Data, this.data.access_token);
      
      if (!ocrResult.words_result) {
        throw new Error('OCR 识别失败');
      }

      const words = ocrResult.words_result.map(item => item.words);
      const concatenatedWords = words.join('');
      
      this.setData({
        lastScheduleType: type === 'image' ? 1 : 2
      });
      
      await this.createSchedule(concatenatedWords);
    } catch (err) {
      console.error('Error in createScheduleFrom:', err);
      this.recognize_fail("OCR识别内容失败");
    } finally {
      this.setData({
        loadingShow: false
      });
    }
  },
  // 拍摄照片
  onCameraImg: function() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success(res) {
        console.log(res.tempFiles[0].tempFilePath);
        that.createScheduleFrom('image', res.tempFiles[0].tempFilePath)
      },
      complete() {
        
      }
    })
  },

  createSchedule(text, fromCache = true) {
    console.log('createSchedule called, text:', text, 'fromCache:', fromCache);
    const start = Date.now();
    this.setData({ 
      loadingDetails: true, 
      showDetails: true,
      showAddButton: false,  // 隐藏加号按钮
    });
    recognizeSchedule(text, fromCache).then(scheduleInfo => {
      console.log('recognizeSchedule success, scheduleInfo:', scheduleInfo);
      this.setData({
        loadingDetails: false,
        scheduleInfo: scheduleInfo,
        lastScheduleType: this.data.lastScheduleType,
        lastScheduleText: text,
        isNewSchedule: true  // 设置为新日程
      });
      app.logOperation(this.data.lastScheduleType, true, `耗时: ${Date.now() - start}`);
    }).catch(error => {
      console.error('recognizeSchedule error:', error);
      this.setData({
        loadingDetails: false,
        showDetails: false, 
      });
      app.logOperation(this.data.lastScheduleType, false, `原因:${error}, 耗时: ${Date.now() - start}`);
      this.recognize_fail(error.message);
    })
  },

  recognize_fail(errMsg) {
    if (errMsg.startsWith("未识别到日程")) {
      wx.showModal({
        title: '创建日程失败',
        content: errMsg,
        cancelTitle: "取消",
        confirmText: "重新识别",
        success: res => {
          if (res.confirm) {
            this.createSchedule(this.data.inputText, false);
          }
        }
      });
    } else {
      wx.showModal({
        title: '建日程失败',
        content: errMsg,
        showCancel: false
      });
    }
  },

  hideDetails() {
    this.setData({ showDetails: false });
  },


  onDetailsClose() {
    this.setData({
      showDetails: false,
      showAddButton: true,
      showOverlay: false,
      showTextInput: false
    });
  },

  onPullDownRefresh() {
    console.log('用户下拉刷新');
    this.setData({ isRefreshing: true });
    this.loadSchedules().then(() => {
      setTimeout(() => {
        this.setData({ isRefreshing: false });
        wx.stopPullDownRefresh();
      }, 1000); // 延迟1秒，让用户看到刷新动画
    }).catch(error => {
      console.error('刷新日程失败:', error);
      this.setData({ isRefreshing: false });
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新失败，请重试',
        icon: 'none'
      });
    });
  },

  onReady() {
    const that = this;
    wx.getSystemInfo({
      success: function(res) {
        const statusBarHeight = res.statusBarHeight;
        const headerHeight = 44; // 假设自定义头部的高度是44px
        const topPadding = statusBarHeight + headerHeight + 40; // 40 是额外的空间
        that.setData({
          containerPadding: topPadding
        });
      }
    });
    console.log('Page ready, data:', this.data);
    // 检查是否有日程数据
    if (this.data.timeSections && this.data.timeSections.length > 0) {
      console.log('Schedules loaded:', this.data.timeSections);
    } else {
      console.log('No schedules loaded');
    }
    // 检查加号按钮状态
    console.log('Add button visible:', this.data.showAddButton);
  },

  showScheduleDetails(event) {
    console.log('Schedule clicked:', event.currentTarget.dataset.schedule);
    const schedule = event.currentTarget.dataset.schedule;
    this.setData({
      showDetails: true,
      scheduleInfo: schedule,
      loadingDetails: false,
      isNewSchedule: false
    });
  },

  toggleSidebar() {
    console.log('toggleSidebar called, current state:', this.data.showSidebar); // 添加日志
    this.setData({
      showSidebar: !this.data.showSidebar
    }, () => {
      console.log('Sidebar toggled, new state:', this.data.showSidebar); // 添加日志
    });
  },

  closeSidebar() {
    this.setData({
      showSidebar: false
    });
    console.log('Sidebar closed111'); // 添加日志
  },

  onScheduleRefresh() {
    console.log('Refreshing schedules from home page');
    this.loadSchedules();
  },

  toggleView() {
    this.setData({
      isHistoryView: !this.data.isHistoryView
    }, () => {
      this.loadSchedules();
    });
  },
});
