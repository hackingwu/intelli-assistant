// utils.js
const md5 = require('blueimp-md5');

const base64 = (file) => new Promise((resolve, reject) => {
  wx.getFileSystemManager().readFile({
    filePath: file,
    encoding: 'base64',
    success: (res) => resolve(res.data),
    fail: reject
  });
});

// 新增的 OCR 方法
const ocr = async (type, file_base64, access_token) => {
  const fetchDataFromServer = () => new Promise((resolve, reject) => {
    wx.request({
      method: 'POST',
      url: `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${access_token}`,
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: {
        [type]: file_base64
      },
      success: (res) => {
        console.log("识别结果:" + JSON.stringify(res.data));
        resolve(res.data);
      },
      fail: reject
    });
  });

  const md5Value = md5(file_base64);

  return new Promise((resolve, reject) => {
    wx.getStorage({
      key: md5Value,
      success: res => resolve(res.data),
      fail: () => {
        fetchDataFromServer().then((fetchedData) => {
          wx.setStorage({
            key: md5Value,
            data: fetchedData
          });
          return resolve(fetchedData);
        }).catch(reject);
      }
    });
  });
};

module.exports = {
  md5,
  base64,
  ocr
};
