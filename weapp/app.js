App({
  onLaunch: function () {
    // 全局分享配置
    Page = (function (Page) {
        return function (pageConfig) {
            pageConfig.onShareAppMessage = function () {
                return {
                    title: '日程小帮手',
                    path: '/pages/home/index',
                    imageUrl: '/static/relax12.png'
                };
            };
            pageConfig.onShareTimeline = function () {
                return {
                    title: '日程小帮手',
                    path: '/pages/home/index',
                    imageUrl: '/static/relax12.png'
                };
            };
            return Page(pageConfig);
        };
    })(Page);
},
"shareTimeline": true,
  globalData: {
    needRetry: false,
    API_KEY:'d8y4XLDphC1W9dtDgt68d9toAi7HXT1P7KCH25b4',
    ADMIN_HOST: 'https://lawyertools.cn/admin',
    // ADMIN_HOST:"http://www.localhost:8080/admin",
    openid:'',
    inviteComment: false,
  },

  // 可以定义全局方法
  resetRetry: function () {
    this.globalData.needRetry=false;
  },
  commentInvited: function(){
    this.globalData.inviteComment = false;
    wx.request({
      url:`${this.globalData.ADMIN_HOST}/accounts/${this.globalData.openid}/commentInvited`,
      method:'POST',
      header:{
        'x-api-key': this.globalData.API_KEY
      },
      complete:()=>wx.navigateBack()
    })
  },
  needRetry:function(){
    return this.globalData.needRetry;
  },
  retry: function() {
    this.globalData.needRetry=true;
  },
  
  afterLogin: function(data){
    this.globalData.openid = data.openid;
    //1. 判断是否需要要求评价
    this.globalData.inviteComment = data.needInviteComment;
    
  },

  requestAdmin(options){

    // 在请求的 options.header 中添加自定义头部
    options.header = {
      ...options.header,
      'openid': this.globalData.openid,
      'x-api-key': this.globalData.API_KEY
    };
    if (!options.url.startsWith("https")) {
      options.url=this.globalData.ADMIN_HOST+options.url
    }
    
    // 调用原始的 wx.request 方法
    wx.request(options);
  },
  formatTimestamp: function (timestamp) {
    const date = new Date(timestamp);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
    
    return formattedDate;
  },
  logOperation: function(type, success, content) {
    wx.request({
      url: this.globalData.ADMIN_HOST+"/operation_logs",
      method:'POST',
      header:{
        'x-api-key': this.globalData.API_KEY
      },
      data: {
        openid: this.globalData.openid,
        type: success ? type : 0 - type,
        content: (content).substring(0, 255)
      }
    })
  },
  onError(error) {
    console.error('App onError:', error);
    wx.showToast({
      title: '发生错误，请重试',
      icon: 'none'
    });
  },
  // 其他全局方法
  // ...
});