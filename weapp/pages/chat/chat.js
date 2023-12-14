const { sha256 } = require("../../utils/sha256");
const Question = require( './Question.js');
// pages/chat.js
// import {sha256} from  '../../utils/sha256';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    botAvatarUrl: './resources/chatgpt_.png',
    
    msg:[],
    inputValue: '',
    scrollTop: 600,
    sendMsgBtnClass: 'send-btn',
    sendMsgBtnTxt: '发送',
    sendMsgBtnDisabled: false,
    textareaHeight: 30, //输入框高度
    maxHeight: 100 //最大高度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    var that = this;
    // 获取用户信息
    wx.getUserInfo({
      success: function(res) {
        // 获取用户头像URL地址
        var avatarUrl = res.userInfo.avatarUrl;
        // 将头像地址设置到页面上
        that.setData({
          avatarUrl: avatarUrl
        })
      }
    })
    this.data.msg = [];
  },
  msgContent: function (e) {
    var value = e.detail.value;
  var len = value.length + 1;
  var lineHeight = 30; //每行高度
  var maxLine = Math.floor(this.data.maxHeight / lineHeight); //最大行数
  var estimateLine = Math.ceil(len / 30);//假设一行30个字符
  var height = Math.min( estimateLine * lineHeight, maxLine * lineHeight); //计算高度，取小值
  console.log(height);
    this.setData({
      textareaHeight: height,
        inputValue: e.detail.value
    })
  },
  resetSendBtn: function() {
    this.setData({
      sendMsgBtnTxt: '发送',
      sendMsgBtnDisabled: false,
      sendMsgBtnLoading: false,
    })
  },
  /**
   * 
   */
  sendMsg: function () {
    var that = this;
    if (this.data.inputValue.length == 0) {
      return;
    }
    const inputValue = this.data.inputValue;
    let newMsg = this.data.msg;
    newMsg.push({
        'role': 'user',
        'content': inputValue
    })
    this.setData({
        inputValue: '',
        msg: newMsg,
        scrollTop: this.data.scrollTop + 10,
        sendMsgBtnLoading: true,
        sendMsgBtnTxt: '思考中...',
        sendMsgBtnDisabled: true
    })
    this.sendRequest(inputValue);

  },
  generateSignature(timestamp, lastmessage){
    // if (crypto && crypto.subtle && crypto.subtle.digest) {
      // const msgUint8 = new TextEncoder().encode(message)
      // const hashBuffer = crypto.subtle.digest('SHA-256', msgUint8)
      // const hashArray = Array.from(new Uint8Array(hashBuffer))
      // return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    // }
    
    return sha256(timestamp+':'+lastmessage+":undefined");
  },
  shuffle(){
    this.setData({
      msg:[],

    })
    this.msgContent({detail:{value:  Question[Math.floor(Math.random() * Question.length)]}})    
  },
  sendRequest(inputValue) {
    var that = this;
    const timestamp = Date.now()
    var decoder = new TextDecoder()
    const requestMessageList = this.data.msg;
    lastMessage = requestMessageList.length > 0 ? requestMessageList[requestMessageList.length - 1]: undefined;
    requestTask = wx.request({
      url: 'https://www.hichat.click/api/generate',
      method: 'POST',
      dataType: 'json',
      timeout:600000,
      data: {
        messages: requestMessageList,
        time: timestamp,
        sign: that.generateSignature(timestamp, inputValue),
      },
      success(res){
        // debugger
        // console.log('success:'+res.data);
        requestMessageList.push({
          role: 'assistant',
            content: res.data
        });
        that.setData({msg: requestMessageList, scrollTop: that.data.scrollTop + 10,})
        that.resetSendBtn();
      },
      error(res) {
        that.resetSendBtn();
        console.log('error:'+res.data);
      }
    });
    
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