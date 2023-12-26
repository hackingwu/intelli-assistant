 Component({
    data: {
        title: "用户隐私保护提示",
        desc1: "感谢您使用本程序，您使用本程序前应当阅读并同意",
        urlTitle: "《用户隐私保护指引》",
        desc2: "当您点击同意并开始时用产品服务时，即表示你已理解并同息该条款内容，该条款将对您产生法律约束力。如您拒绝，将无法使用本程序。",
        innerShow: false,
        height: 0,
    },
    lifetimes: {
      attached: function() {
        if (wx.getPrivacySetting) {
          wx.getPrivacySetting({
            success: res => {
                console.log("是否需要授权：", res.needAuthorization, "隐私协议的名称为：", res.privacyContractName)
                if (res.needAuthorization) {
                  this.popUp()
                } else{
                  this.triggerEvent("agree")
                }
            },
            fail: () => { },
            complete: () => { },
          })
        } else {
          // 低版本基础库不支持 wx.getPrivacySetting 接口，隐私接口可以直接调用
          this.triggerEvent("agree")
        }
      },
    },
    methods: {
        handleDisagree(e) {
            this.triggerEvent("disagree")
            this.disPopUp()
        },
        handleAgree(e) {
            this.triggerEvent("agree")
            this.disPopUp()
        },
        popUp() {
            this.setData({
                innerShow: true
            })
        },
        disPopUp() {
            this.setData({
                innerShow: false
            })
        },
        openPrivacyContract() {
          wx.openPrivacyContract({
            success: res => {
              console.log('openPrivacyContract success')
            },
            fail: res => {
              console.error('openPrivacyContract fail', res)
            }
          })
        }
    }
})