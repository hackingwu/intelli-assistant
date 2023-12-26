// pages/index.js
import Notify from '@vant/weapp/notify/notify';
const txtExample = require( './txtExample')
const app = getApp()
const md5 = require('blueimp-md5');


Page({

  /**
   * 页面的初始数据
   */
  data: {
    txt:"",
    txtDialogShow: false,
    scheduleInfo:{},
    intervalId: null,
    loadingShow:false,
    loadingText:"加载中...",
    textInputStyle:{maxHeight:200, minHeight:50},
    // scheduleCache:{},
    lastScheduleText:"",
    lastScheduleType:0,
    justTryTimes:0,
    processLoadingTexts: ["开始解析...", "提取日程标题...", "提取日程地点...", "提取日程开始时间...", "提取日程描述...", "合并信息，请稍后..."],
    showPrivacy: false,
  },
  justTryText(){
    const randomIndex = this.data.justTryTimes++ % txtExample.length;
    this.setData({
      txt: txtExample[randomIndex]
    })
// 取出随机的数字

  },
  test(){
    const scheduleInfo = {};
          const respData = {
            "title": "传票案号(2023)闽0102民初9960号",
            "dateTimeFrom": "2023-09-15 09:0o",
            "timestampFrom": 1694932200000,
            "location": "中国（上海）自由贸易试验区银城中路200号14楼1409-1410室",
            "description": "福州市鼓楼区人民法院发出传票案号为(2023)闽0102民初9960号，涉及金融借款合同纠纷，被传唤人为中银消费金融有限公司；开庭应到时间2023年9月15日09时00分，应到处所在‘第七法庭’；被传唤人必须携带身份证原件准时到达法庭，并且在回证上签名或盖章。"
          };
          scheduleInfo.title=respData.title
          const timeFrom = respData.dateTimeFrom;
          scheduleInfo.timeFromStr = timeFrom;
          scheduleInfo.timeFrom = respData.timestampFrom;
          
          scheduleInfo.description = respData.description
          scheduleInfo.location = respData.location

          this.data.scheduleInfo = scheduleInfo;
    wx.navigateTo({
      url: '../schedule/index',
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', scheduleInfo )
        
      },
      fail: (e) => {
        Notify({type:'warning', message: "跳转失败"+e.errMsg})
      }
    });
  },
  onAppShow() {
    const that = this;
    wx.onAppShow(options => {
        
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    wx.getPrivacySetting({
      success: res => {
        console.log(res) // 返回结果为: res = { needAuthorization: true/false, privacyContractName: '《xxx隐私保护指引》' }
        if (res.needAuthorization) {
          // 需要弹出隐私协议
          this.setData({
            showPrivacy: true
          })
        } else {
          // 用户已经同意过隐私协议，所以不需要再弹出隐私协议，也能调用已声明过的隐私接口
          // wx.getUserProfile()
          // wx.chooseMedia()
          // wx.getClipboardData()
          // wx.startRecord()
        }
      }
    })
    

    wx.showLoading({'title':'登录中'})
    const that = this;
    wx.login({
      success (res) {
        if (res.code) {
          //发起网络请求
          wx.request({
            url: getApp().globalData.ADMIN_HOST+'/accounts/login',
            data: {
              code: res.code
            },
            header:{
              'x-api-key': getApp().globalData.API_KEY
            },
            success: (res)=>{
              const resData = res.data;
              that.data.access_token = resData.baiduToken;
              getApp().afterLogin(resData)
              wx.hideLoading();
              
              
              
            }
          })
        } else {
          Notify({type:'warning', message: '登录失败！' + res.errMsg})
        }
      }
    })

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
    console.log("onShow")
    if (app.needRetry()){
      console.log("重新识别："+this.data.lastScheduleText)
      this.createSchedule(this.data.lastScheduleText, false);
    } else {
      const lauchOptions=wx.getLaunchOptionsSync()
              if (lauchOptions.scene === 1173) {
                const forwardMaterial = lauchOptions.forwardMaterials[0];
                that.createScheduleFrom(forwardMaterial.type==="application/pdf" ? "pdf_file" : "image", forwardMaterial.path);
              }
    }
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log("onHide")
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log("onUnload")
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

  },
  onScanTxtBtnClick() {
    // Notify({ type: 'success', message: '日程创建成功' });
    this.setData({txtDialogShow: true})
    // this.test();
  },
  onTxtDialogClose(){
    this.setData({txtDialogShow: false})
  },
  md5(inputString) {
    return md5(inputString);
  },
  onTxtDialogConfirm() {
    if (!this.data.txt || this.data.txt.trim().length == 0) {
      return;
    }
    this.data.lastScheduleType = 0;
    this.createSchedule(this.data.txt);
  },
  stopLoadingTextInterval(){
    clearInterval(this.data.intervalId);
    this.setData({
      intervalId: null,
      
    });
  },
  showLoading(defaultLoadingText) {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < this.data.processLoadingTexts.length) {
        // wx.showLoading({
        //   title: this.data.processLoadingTexts[currentIndex],
        //   mask: true
        // })
        this.setData({loadingText: this.data.processLoadingTexts[currentIndex]})
        
        currentIndex++;
      } else {
        // 更新内容已经全部展示，停止更新
        this.stopLoadingTextInterval();
      }
    }, 2000); // 每隔2秒更新一次

    // 保存定时器的 ID
    this.setData({
      intervalId: intervalId,
      loadingShow:true, 
      loadingText:"加载中..."
    });
    console.log(this.data.loadingShow+":"+this.data.loadingText)
  },
  createSchedule(text, fromCache=true) {

    this.showLoading()
    const that = this;
    this.data.lastScheduleText = text;
    app.resetRetry()
    const start = Date.now();
    this.recognize_schedule(text, fromCache).then((scheduleInfo)=>{
      this.stopLoadingTextInterval()
      this.setData({loadingShow:false})
      scheduleInfo.scheduleType = this.data.lastScheduleType

      if (!scheduleInfo.isCache) {
        getApp().logOperation(this.data.lastScheduleType, true, "耗时:"+(Date.now()-start))
      }
      
      // 请求完成后跳转到第二个页面
      wx.navigateTo({
        url: '../schedule/index',
        success: function(res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('acceptDataFromOpenerPage', scheduleInfo )
          
        },
        fail: (e) => {
          Notify({type:'warning', message: "跳转失败"+e.errMsg})
        }
      });
    }).catch((error)=>{
      getApp().logOperation(this.data.lastScheduleType, false, `原因:${error}, 耗时: ${Date.now()-start}`)
      that.recognize_fail(error.message);
    })
  },
  createScheduleFrom(type, filePath) {
    const loadingMsg = `从${type=='image'?'图片':'PDF文件'}中提取文本信息`
    this.setData({
      loadingShow: true,
      loadingText: loadingMsg
    })
    
      this.base64(filePath).then(res=>{
        return this.ocr(type, res)
      }).catch(err=>{
        this.recognize_fail("OCR识别内容失败");
        return Promise.reject(err);
      }).then(res=>{
        const words = res.words_result.map(item => item.words);
  
        const concatenatedWords = words.join('');
        return concatenatedWords;
      }).then(res=>{
        this.data.lastScheduleType = type=='image' ? 1 : 2;
        this.createSchedule(res)
      })
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
  // 从相册选取
  onAlbumImg() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success(res) {
        console.log(res.tempFiles[0].tempFilePath);
        that.createScheduleFrom('image', res.tempFiles[0].tempFilePath)
      },
      complete() {
        
      }
    })
  },
  // 从微信聊天中选取
  onMsgFile() {
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'image',
      success(res) {
        console.log(res.tempFiles[0].path)
        that.createScheduleFrom('image', res.tempFiles[0].path)
      },
      complete() {
        
      }
    })
  },
  onScanPdfBtnClick: function() {
    const that = this;

    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success(res) {
        console.log(res.tempFiles[0].path)
        that.createScheduleFrom('pdf_file', res.tempFiles[0].path)
      },
      complete() {
        
      }
    })
  },
  onScanImgBtnClick: function () {
    const that = this;
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择', '导入微信聊天图片'], // ActionSheet中的选项
      success: function (res) {
        // 用户点击了选项后的回调函数
        if (res.cancel) {
          return
        }
        // 用户没有点击取消按钮
        if (res.tapIndex === 0) {
          // 用户点击了拍照选项
          console.log('用户点击了拍照');
          that.onCameraImg()
        } else if (res.tapIndex === 1) {
          // 用户点击了从相册选择选项
          console.log('用户点击了从相册选择');
          that.onAlbumImg();
        } else if (res.tapIndex === 2) {
          // 用户点击了从微信聊天选择选项
          console.log('用户点击了从微信聊天选择');
          that.onMsgFile();
        }
      },
    });
  },
  //从图片或者PDF中识别出文字
  async ocr(type, file_base64) {//type in ['image', 'pdf_file']
    const fetchDataFromServer = ()=>new Promise((resolve, reject) => {
      wx.request(  {
        'method': 'POST',
        'url': 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=' + this.data.access_token,
        'header': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
        },
        'data': {
            [type]: file_base64
        },
        success: (res) =>{
          console.log("识别结果:" + JSON.stringify(res.data))

          resolve(res.data);
        },
        fail: reject
      });
    });
    const md5Value = md5(file_base64);
    

    return new Promise((resolve, reject)=>{

      wx.getStorage({
        key:md5Value,
        success: res => resolve(res.data),
        fail: () => {
          
          fetchDataFromServer().then((fetchedData) => {
            
            // Save the fetched data to storage for future use
            wx.setStorage({
              key: md5Value,
              data: fetchedData
            });
            return resolve(fetchedData);
          }).catch(reject)
        }
      })
    })
    
    

  },
  base64(file) {
    return new Promise((resolve, reject)=>{

      wx.getFileSystemManager().readFile({
        filePath: file,
        encoding: 'base64',
        success: (res)=>resolve(res.data),
        faile: reject
      });
    });
  },
  recognize_fail(errMsg){
    this.setData({loadingShow:false})
    const that = this;
    if (errMsg.startsWith("未识别到日程")) {
      wx.showModal({
        title: '创建日程失败',
        content: errMsg,
        cancelTitle: "取消",
        confirmText: "重新识别",
        success(res) {
          if (res.confirm) {
            // 用户点击了确定按钮
            that.createSchedule(that.data.lastScheduleText, false);
          }  else {
          }
        }
      });
    } else {
      wx.showModal({
        title: '创建日程失败',
        content: errMsg,
        showCancel: false
      });
    }
    
    
  },
  recognize_schedule(text, fromCache=true) {
    // return new Promise((resolve, reject)=>{})
    const md5Value = md5(text);
    const fetchDataFromServer = ()=>new Promise((resolve, reject) => {
      wx.request({
        url: getApp().globalData.ADMIN_HOST+'/help_remember',
        method: 'POST',
        header:{
          'x-api-key': getApp().globalData.API_KEY,
          'Content-Type': 'application/json'
        },
        data:{
          'text':text
        },
        success: (resp)=>{
          const scheduleInfo = {};
          const respData = resp.data;
          scheduleInfo.title=respData.title
          const timeFrom = respData.dateTimeFrom;
          scheduleInfo.timeFromStr = timeFrom;
          scheduleInfo.timeFrom = respData.timestampFrom;
          
          scheduleInfo.description = respData.description
          scheduleInfo.location = respData.location

          this.data.scheduleInfo = scheduleInfo;
          if (timeFrom && scheduleInfo.title && scheduleInfo.title != "") {
            wx.setStorageSync(md5Value, scheduleInfo)
            resolve(scheduleInfo);
          } else {
            reject(new Error("未识别到日程，请重试或更换内容"));
          }
          
          
        },
        fail: (err)=> {
          reject(new Error(err.errMsg));
        }
      })

    });
    if (!fromCache) {
      return fetchDataFromServer();
    }

    return new Promise((resolve, reject)=>{
    
      wx.getStorage({
        key: md5Value,
        success: res=>{
          console.log("从storage中获取:"+JSON.stringify(res.data))
          res.data["isCache"] = true;
          resolve(res.data)
        }, 
        fail: () =>{
          fetchDataFromServer().then(res=>{
            res["isCache"] = false;
            resolve(res)
          }).catch(err=>reject(err))
        }
      })
    });
    

    
  }
})