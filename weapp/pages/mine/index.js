// pages/mine/index.js

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isScheduleListEmpty: true,
    scheduleList:[],
    tabActive: 'pending',
    tenYearMills: 10*365*24*60*60*1000,
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    
  },

  listSchedules(){
    wx.showLoading({
        title: '加载中...',
        mask: false // Set mask to true to prevent user interaction during loading
      });

      const now = new Date().getTime();
      let timeFrom = now, timeTo = now;
      const tabActive = this.data.tabActive;
      if (tabActive == 'pending') {
        timeTo = now + this.data.tenYearMills;
      } else if (tabActive == 'done') {
        timeFrom = now - this.data.tenYearMills;
      }
      console.log(`openid:${getApp().globalData.openid}, timeFrom:${timeFrom}, timeTo:${timeTo}`)
      wx.request({
        url: getApp().globalData.ADMIN_HOST+'/schedules',
        header:{
          'x-api-key': getApp().globalData.API_KEY
        },
        data: {
          openid: getApp().globalData.openid,
          timeFrom: timeFrom,
          timeTo: timeTo
        },
        success: (res)=>{
            const scheduleList = res.data;
            if (tabActive === 'pending') {
              scheduleList.sort((a,b)=>a.startTime-b.startTime);
            }
            scheduleList.forEach(item=>{
                item.time = this.formatDate(item.startTime);
            })
          this.setData({
            scheduleList: scheduleList,
            isScheduleListEmpty: scheduleList.length == 0
          })
          wx.hideLoading();
        },
        fail: (res) => {
            wx.hideLoading();
            wx.showToast({
                title: res.errMsg,
                icon: 'none'
              })
        }
      })
    
  },
  performDeleteSchedule(scheduleId) {
    // 根据日程ID执行删除操作
    // 这里可以调用后端接口或更新本地数据等
    // 示例中直接从列表中移除该日程
    getApp().requestAdmin({
      url:'/schedules/' + scheduleId,
      method:'DELETE',
      success: (res)=>{
        const updatedSchedules = this.data.scheduleList.filter(schedule => schedule.id !== scheduleId);

        this.setData({ 
          scheduleList: updatedSchedules, 
          isScheduleListEmpty: updatedSchedules.length == 0
         });
         console.log("删除成功")
         // 显示删除成功的提示消息
        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 2000
        });
      }
    })
    
  },
  deleteSchedule(e) {
    const index = e.currentTarget.dataset.index;
    const schedule = this.data.scheduleList[index];
    const scheduleId = schedule.id;

    wx.showModal({
      title: '确定要删除该日程吗？',
      content: '此操作不会删除已经在系统日历中创建的日程，确定要删除该日程吗？',
      confirmColor: '#FF4136',
      success: (res) => {
        if (res.confirm) {
          // 用户点击了确定按钮，执行删除操作
          this.performDeleteSchedule(scheduleId);
        } else if (res.cancel) {
          // 用户点击了取消按钮，不执行任何操作
        }
      }
    });
    
  },
  createScheduleAgain(event){

    const index = event.currentTarget.dataset.index;
    const schedule = this.data.scheduleList[index];

      schedule.scheduleType = 3;
      schedule.scheduleFromCache = false;
      
      if (schedule.startTime) {
        schedule.timeFromStr = getApp().formatTimestamp(schedule.startTime)
        schedule.timeFrom = schedule.startTime
      }


    wx.navigateTo({
      url: '../schedule/index',
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', schedule )
        
      },
      fail: (e) => {
        Notify({type:'warning', message: "跳转失败"+e.errMsg})
      }
    });
  },
  formatDate(startTime){
    const date = new Date(startTime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${year}年${month}月${day}日 星期${week} ${hours}:${minutes}`;
    return timeStr;
  },
  onTabChange(event){
    this.data.tabActive = event.detail.index == 0 ? 'pending': 'done';
    console.log(this.data.tabActive)
    this.listSchedules();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.listSchedules();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})