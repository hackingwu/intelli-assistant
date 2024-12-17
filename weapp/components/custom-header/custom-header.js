Component({
  properties: {
    title: {
      type: String,
      value: '👋 欢迎'
    }
  },
  data: {
    statusBarHeight: 0
  },
  lifetimes: {
    attached() {
      this.setStatusBarHeight();
    }
  },
  methods: {
    setStatusBarHeight() {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight
      });
    },
    onLeftTap() {
      console.log('Left tap triggered'); // 添加日志
      this.triggerEvent('toggleSidebar');
    }
  }
})
