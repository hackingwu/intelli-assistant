Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    userInfo: {
      type: Object,
      value: {}
    },
    isHistoryView: {
      type: Boolean,
      value: false
    }
  },
  data: {
    statusBarHeight: 0,
    headerHeight: 44 // 假设 custom-header 的高度是 44px
  },
  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight
      });
    }
  },
  methods: {
    closeSidebar() {
      this.triggerEvent('close');
    },
    onSwitchToWelcome() {
      if (this.properties.isHistoryView) {
        this.triggerEvent('toggleView');
      }
      this.closeSidebar();
    },
    onSwitchToHistory() {
      if (!this.properties.isHistoryView) {
        this.triggerEvent('toggleView');
      }
      this.closeSidebar();
    }
  }
});
