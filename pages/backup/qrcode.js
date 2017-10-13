// pages/backup/qrcode.js
const QR = require('../../utils/js/qrcode');
const Base64 = require('../../utils/js/common');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    imagePath:'',
    qrcodeTitle:'点击保存或截图保存',
    qrcodeColor:'#368AE5',
    qrcord:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.getServers();
  },
  //获取信息
  getServers:function(){
    var that = this;
    var servers = wx.getStorageSync('servers');
    servers = JSON.parse(servers);
    var server = [];
    servers.forEach(function (value, index, array) {
      var obj = new Object();
      obj.s = value.secret;
      obj.u = encodeURI(value.username);
      obj.i = encodeURI(value.issuer);;
      server.push(obj);
    });
    var strObj = new Object();
    var date = new Date();
    wx.getSystemInfo({
      success: function (res) {
        strObj.d = date.toLocaleDateString(),
        strObj.m = res.model,
        strObj.l = servers.length,
        strObj.i = res,
        strObj.s = server
      }
    });
    var text = JSON.stringify(strObj);
    var size = that.setCanvasSize();
    console.log(size)
    //图片的信息
    that.createQrCode(JSON.stringify({ source: 'shuzibi', key: Base64.base64.encode(text) }), "mycanvas", size.w, size.h);

  },
  //生成二维码
  createQrCode: function (text, canvasId, cavW, cavH) {
    //绘制二维码图片
    QR.qrApi.draw(text, canvasId, cavW, cavH);
    var that = this;
    //二维码生成之后调用canvasToTempImage();延迟3s，否则获取图片路径为空
    var st = setTimeout(function () {
      that.canvasToTempImage();
      clearTimeout(st);
    }, 3000);
  },
  //获取临时缓存照片路径，存入data中
  canvasToTempImage: function () {
    var that = this;
    wx.canvasToTempFilePath({
      canvasId: 'mycanvas',
      success: function (res) {
        var tempFilePath = res.tempFilePath;
        that.setData({
          imagePath: tempFilePath,
        });
      },
      fail: function (res) {
      }
    });
  },
  //点击图片预览保存
  clickImg:function(){
    var img = this.data.imagePath
    wx.previewImage({
      current: img, // 当前显示图片的http链接
      urls: [img] // 需要预览的图片http链接列表
    })
  },
  //点击保存
  previewImg: function (e) {
    var that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success() {
              // 用户已经同意小程序使用相册功能
              that.setImg();
            }
          })
        }
      }
    })
  },
  //保存图片到相册
  setImg:function(){
    var that = this;
    var img = this.data.imagePath;
    wx.saveImageToPhotosAlbum({
      filePath:img,
      success(res) {
        wx.showToast({
          "title": "已保存到相册",
          "icon": "success",
          duration: 2000,
          complete:function(e){
            that.setData({
              qrcodeTitle: '我已保存到相册',
              qrcodeColor:'#02BB00'
            });
          }
        })
      }
    })
  },
  //截图提示保存成功
  onShow: function () {
    var that = this;
    wx.onUserCaptureScreen(function (res) {
      wx.showToast({
        "title": "截屏已保存到相册",
        "icon": "success",
        duration: 2000,
        complete: function (e) {
          that.setData({
            qrcodeTitle: '我已截屏保存',
            qrcodeColor: '#02BB00'
          });
        }
      })
    })
  },
  //适配不同屏幕大小的canvas
  setCanvasSize: function () {
    var size = {};
    try {
      var res = wx.getSystemInfoSync();
      var scale = 750 / 686;//不同屏幕下canvas的适配比例；设计稿是750宽
      var width = res.windowWidth / scale;
      var height = width;//canvas画布为正方形
      size.w = width;
      size.h = height;
    } catch (e) {
      // Do something when catch error
    }
    return size;
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})