// pages/view/edit.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    disabled: true,
    opacity: 0.4,
    issuerType:false,
    usernameType:false,
    serversType:false
  },
  /*input 聚焦下一步*/
  next1:function(){
    this.setData({
      focus01: true
    })
  },
  next2: function () {
    this.setData({
      focus02: true
    })
  },
  /*提交的数据*/
  submitData:function(e){
    var that =this;
    if (that.judgment(e.detail.value.servers)){
      wx.showModal({
        title: '该认证信息已添加过',
        content: '请重新扫描添加！',
        showCancel: false,
        success: function (res) {
          wx.navigateBack({
            delta: 2
          })
        }
      })
    }else{
      that.setCodeData({ 'secret': e.detail.value.servers, 'issuer': e.detail.value.issuer, 'username': e.detail.value.username });
    }
  },
  /*网站名称失去焦点*/
  issuerBlur:function(e){
      if(e.detail.value !=''){
        this.setData({
          issuerType: true
        })
      }else{
        this.setData({
          issuerType: false
        })
      }
      if (this.data.issuerType && this.data.usernameType && this.data.serversType){
        this.setData({
          disabled: false,
          opacity: 1
        })
      }else{
        this.setData({
          disabled: true,
          opacity: 0.4
        })
      }
  },
  /*账户名称失去焦点*/
  usernameBlur: function (e) {
    if (e.detail.value != '') {
      this.setData({
        usernameType: true
      })
    }else{
      this.setData({
        usernameType: false
      })
    }
    if (this.data.issuerType && this.data.usernameType && this.data.serversType) {
      this.setData({
        disabled: false,
        opacity: 1
      })
    } else {
      this.setData({
        disabled: true,
        opacity: 0.4
      })
    }
  },
  /*密钥失去焦点*/
  serversBlur: function (e) {
    if (e.detail.value != '') {
      this.setData({
        serversType: true
      })
    }else{
      this.setData({
        serversType: false
      })
    }
    if (this.data.issuerType && this.data.usernameType && this.data.serversType) {
      this.setData({
        disabled: false,
        opacity: 1
      })
    } else {
      this.setData({
        disabled: true,
        opacity: 0.4
      })
    }
  },
  //存数据
  setCodeData: function (data) {
    var that = this;
    var old_data = wx.getStorageSync('servers');
    
    if (old_data == '') {
      old_data = '[]'
    }
    var servers = JSON.parse(old_data);
    var old_length = servers.length;
    servers.unshift({
      secret: data.secret,
      username: data.username,
      issuer: data.issuer
    })

    var new_length = servers.length;
    if (new_length == old_length) {
      wx.showModal({
        title: '数据存储出错！',
        content: '数据存储出错！请联系管理员！',
        success: function (res) {
          console.log(res);
        }
      })
    } else {
      var servers_str = JSON.stringify(servers);
      wx.setStorageSync('servers', servers_str);
      wx.showToast({
        "title": "添加成功",
        "icon": "success",
        duration: 2000,
        complete: function (e) {
          if (JSON.parse(wx.getStorageSync('servers')).length == 1){
            wx.reLaunch({
              url: '../index/index'
            });
          }else{
            wx.navigateBack({
              delta: 2
            });
          }
        }
      })
    }
  },
  // 判断添加的是否重复 server : 为新添加的密钥
  judgment: function (secret) {
    var that = this;
    var jutype = false;
    var old_data = wx.getStorageSync('servers');
    if (old_data == '') {
      old_data = '[]';
    }
    var servers = JSON.parse(old_data);
    servers.forEach(function (value, index, array) {
      if (value.secret == secret) {
        jutype = true;
      }
    });
    if (jutype) {
      return true;
    } else {
      return false;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})