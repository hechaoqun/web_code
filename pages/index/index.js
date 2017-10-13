//index.js

//获取应用实例
const app = getApp();
const totp = require('../../utils/js/totp');
const Base64 = require('../../utils/js/common');
Page({
  data: {
    actionSheetHidden: true,
    actionSheetItems: ['扫描二维码', '手动添加', '数据备份', '数据恢复'],
    icon: ['/images/scanning_copy.png','/images/Group_Copy.png','/images/backUp.png','/images/Shape.png'],
    //logo 的显示
    logoHidden:false,
    //可以通过hidden是否掩藏弹出框的属性，来指定那个弹出框
    hiddenmodalput: true,
    //code 的生成数据
    servers: [],
    //扇形倒计时pre1 的度数
    pie1Data:0,
    //扇形倒计时pre2 的度数
    pie2Data: 0,
    //pie2的背景颜色
    pieBackground:'#B3D4F9',
    //pie1的背景颜色
    pie1Background:'#B3D4F9',
    //code 的颜色
    codeColor:'#353535',
    //edit 的位置
    editTop: 0,
    //edit 的显示隐藏
    editHidder:true,
    //edit 当前选中的数据
    editData: { code: '', issuer: '', username: '', secret:''},
    //edit 验证码文字
    editCodeTitle:'复制验证码',
    editCodeColor:'#353535',
    //弹窗
    drawerTitle:'网站'
  },
  onLoad: function (option) {
    var that = this;
    if (wx.getStorageSync('servers') == '[]'){
      that.gameTime(0, 30, function () {
        that.refreshData();
      });
    }
  },
  onReady: function () {
    var that = this;
    /**
     * 每秒执行一次
     */
    if (wx.getStorageSync('servers') != '[]' && wx.getStorageSync('servers') != ''){
      that.gameTime(0, 30, function () {
        that.refreshData();
      });
    }

    setInterval(function () {
      /**
       * 如果当前数据的长度和本地存储中数据长度不同。强制刷新一次数据
       */
      var mem_server = wx.getStorageSync('servers');
      if (mem_server != '') {
        if (JSON.parse(mem_server).length != that.data.servers.length) {
          that.refreshData();
        }
      }
      
      var timestamp = (new Date()).getTime().toString().substr(0, 10);
      var timeHook = timestamp % 30;
      /**
       * 如果不是30S整点，不更新数据，只更新进度条
       */
      if (timeHook != 0) {
        
      } else {
        // that.refreshData();
      }

    }, 1000)
  },
  chooseSetting:function(){
    wx.showActionSheet({
      itemList: ['扫描二维码', '手动添加', '数据备份','数据恢复'],
      success: function (res) {
        console.log(res.tapIndex)
      },
      fail: function (res) {
        console.log(res.errMsg)
      }
    })
  },
  //选择栏显示隐藏
  actionSheetTap: function (e) {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    })
  },
  actionSheetChange: function (e) {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    })
  },
  //扫描二维码
  bind0: function (e){
    var that = this;
    that.setData({
      actionSheetHidden: !that.data.actionSheetHidden
    })
    wx.scanCode({
      success: function(res){
        /*
          扫描获取的信息
         */
        var source = decodeURIComponent(res.result);
        var data = source.split("otpauth://totp/")[1];
        /*数据解析*/
        var isHaveIssuer = data.split("?")[0].indexOf(":") != -1 && data.split("?")[0].indexOf(":") != 0;
        if (isHaveIssuer) {
          var username = data.split("?")[0].split(":")[1];
        } else {
          var username = data.split("?")[0];
        }
        var issuerData = data.split("issuer=")[1];
        if (issuerData != undefined){
          var issuer = issuerData;
        }else{
          var issuer = username.split('@')[1];
        }

        var secret = data.split("?")[1].split("&")[0].split("=")[1];
        if (that.judgment(secret)){
          wx.showModal({
            title: '该认证信息已添加过',
            content: '请重新扫描添加！',
            showCancel: false,
            success: function (res) {
              wx.switchTab({
                url: '../index/index'
              })
            }
          })
        }else{
          var old_servers = wx.getStorageSync('servers');
          console.log(old_servers);
          that.setCodeData({ 'secret': secret, 'issuer': issuer, 'username': username });
          that.refreshData();
          if (JSON.parse(wx.getStorageSync('servers')).length == 1 && old_servers!='[]') {
            that.gameTime(0, 30, function () {
              that.refreshData();
            });
          }
        }
      },
      fail: function (res) {
        if (res.errMsg == 'scanCode:fail cancel') {

        } else {
          wx.showModal({
            "title": "扫描失败",
            "content": "您可能扫描了的二维码有误，请重新扫描！",
            "showCancel": false,
            "success": function (e) {
            }
          })
        }
      }
    })  
  },
  //手动添加
  bind1: function () {
    var that = this;
    wx.navigateTo({
      url: '../view/edit'
    });
    that.setData({
      actionSheetHidden: !that.data.actionSheetHidden
    })
  },
  //数据备份
  bind2: function () {
    var that = this;
    wx.navigateTo({
      url: '../backup/qrcode'
    });
    that.setData({
      actionSheetHidden: !that.data.actionSheetHidden
    })
  },
  //数据恢复
  bind3: function () {
    var that = this;
    that.setData({
      actionSheetHidden: !that.data.actionSheetHidden
    })
    wx.scanCode({
      success: function (res) {
        /*
          扫描获取的信息
         */
          var new_servers = JSON.parse(Base64.base64.decode(JSON.parse(res.result).key)).s;//通过扫码获取的备份信息

          var oldservers = wx.getStorageSync('servers');
          if (oldservers == '') {
            var old_servers = '';
          } else {
            var old_servers = JSON.parse(oldservers);//本地已有的信息
          }

          if (old_servers != '[]' && old_servers != '') {
            var arr = old_servers;
            new_servers.forEach(function (NewVal, NewInd, NewArr) {
              arr.push({
                secret: NewVal.s,
                username: NewVal.u,
                issuer: NewVal.i
              })
            })
            var servers = that.arrayDistinct(arr).reverse();

          } else {
            var servers = [];
            new_servers.forEach(function (NewVal, NewInd, NewArr) {
              servers.push({
                secret: NewVal.s,
                username: NewVal.u,
                issuer: NewVal.i
              })
            })
          }

          wx.setStorageSync('servers', JSON.stringify(servers));
          wx.showToast({
            "title": "成功恢复数据",
            "icon": "success",
            complete: function (e) {
              //添加验证码到列表
              
              if (typeof (old_servers) == 'string'){
                that.gameTime(0, 30, function () {
                  that.refreshData();
                });
              }else{
                that.refreshData();
              }

            }
          })
      },
      fail: function (res) {
        if (res.errMsg == 'scanCode:fail cancel') {
          // wx.showToast({
          //   "title": "扫码失败",
          //   "icon": "loading",
          //   duration: 2000
          // })
        } else {
          wx.showModal({
            "title": "扫描失败",
            "content": "您可能扫描了的二维码有误，请重新扫描！",
            "showCancel": false,
            "success": function (e) {
            }
          })
        }
      }
    })  
  },
  //验证码数组去重
  arrayDistinct:function(arrData){
    var arr = arrData,
      i,
      j,
      len = arr.length;
    for (i = 0; i < len; i++) {
      for (j = i + 1; j < len; j++) {
        if (arr[i].secret == arr[j].secret) {
          arr.splice(j, 1);
          len--;
          j--;
        }
      }
    }
    return arr;
  },
  //取消按钮  
  cancel: function () {
    this.setData({
      hiddenmodalput: true
    });
  },
  //确认  
  confirm: function () {
    this.setData({
      hiddenmodalput: true
    })
  } ,
  //生成code函数
  refreshData: function (e) {
    var that = this;
    var raw_servers = wx.getStorageSync('servers');

    if (raw_servers == '') {
      return;
    }
    var servers = JSON.parse(raw_servers);
    if (servers.length == 0) {
      that.setData({
        servers: []
      })
      return;
    }

    var server = [];
    servers.forEach(function (value, index, array) {
      value.code = totp.getCode(value.secret);
      server.push(value);
    });
    that.setData({
      servers: server
    })

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
    servers.push({
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
      var servers_str = JSON.stringify(servers.reverse());
      wx.setStorageSync('servers', servers_str);
      wx.showToast({
        "title": "添加成功",
        "icon": "success",
        complete: function (e) {
          console.log('添加成功')
        }
      })
    }
  },
  // 判断添加的是否重复 server : 为新添加的密钥
  judgment: function (secret){
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
    if (jutype){
      return true;
    }else{
      return false;
    }
  },
  //扇形倒计时动画
  gameTime: function (pieData, gameTime,callback){
    var that = this;
    clearInterval(t1);    
    var totle = gameTime * 10;
    var i = pieData;
    var count = 0;
    var t1 = setInterval(function(){
      i = i + 360 / ((gameTime) * 10);  //旋转的角度  90s 为 0.4  60s为0.6
      count = count + 1;
      if (count <= (gameTime / 2 * 10)) {  // 一半的角度  90s 为 450
        that.setData({
          pie1Data: i
        })
      } else {
        that.setData({
          pie2Data: i,
          pieBackground: '#fff'
        })
      }
      //到时间后关闭
      totle = totle - 1;
      if (totle == 0) {
        clearInterval(t1);
        that.setData({
          pie1Data: 0,
          pie2Data: 0,
          pieBackground: '#B3D4F9',
          pie1Background: '#B3D4F9',
          codeColor: '#353535'
        })
        that.gameTime(0, 30, function () {
          that.refreshData();
        });
        callback();
      } else if (totle<=50){
        if (totle%5==0){
          that.setData({
            codeColor: '#353535',
            pie1Background:'#B3D4F9'
          })
        }else{
          that.setData({
            codeColor: '#E57066',
            pie1Background: '#E57066'
          })
        }
      }
    },100)
  },
  //长按事件
  longtap: function (e) {
    var that = this;
    console.log(e)
    if (e.currentTarget.offsetTop<=20){
      that.setData({
        editHidder:false,
        editTop: e.currentTarget.offsetTop,
        editData: { 'code': e.currentTarget.dataset.code, 'issuer': e.currentTarget.dataset.issuer, 'username': e.currentTarget.dataset.username, 'secret': e.currentTarget.dataset.secret},
        editCodeTitle: '复制验证码',
        editCodeColor: '#353535'
      })
    }else{
      that.setData({
        editHidder: false,
        editTop: e.currentTarget.offsetTop * 2 - e.currentTarget.dataset.index*30-98,
        editData: { 'code': e.currentTarget.dataset.code, 'issuer': e.currentTarget.dataset.issuer, 'username': e.currentTarget.dataset.username, 'secret': e.currentTarget.dataset.secret},
        editCodeTitle: '复制验证码',
        editCodeColor: '#353535'
      })
    }
  },
  tap:function(){
    this.setData({
      editHidder:true
    });
  },
  //复制验证码
  copyCode:function(){
    var that = this;
    wx.setClipboardData({
      data: that.data.editData.code,
      success: function (res) {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 2000,
          success:function(){
            that.setData({
              editCodeTitle: '已复制验证码',
              editCodeColor: '#368AE5'
            })
            setTimeout(function(){
              that.setData({
                editHidder: true
              })
            },1000)
          }
        })
      }
    })
  },
  //编辑账号
  editUser:function(e){
    this.setData({
      hiddenmodalput: !this.data.hiddenmodalput,
      editHidder: true,
      drawerTitle:'账号'
    })
  },
  //账号名称获取
  inputUser: function (e) {
    var that = this;
    that.setData({
      editData: { 'secret': that.data.editData.secret, 'username': e.detail.value,'issuer': that.data.editData.issuer}
    })
  },
  //账号保存
  openUser:function(){
    this.edit(this.data.editData);
  },
  //编辑网站
  editIssuer: function (e) {
    this.setData({
      hiddenmodalput: !this.data.hiddenmodalput,
      editHidder: true,
      drawerTitle: '网站'
    })
  },
  //网站名称获取
  inputIssuer:function(e){
    var that = this;
    that.setData({
      editData: { 'secret': that.data.editData.secret, 'username': that.data.editData.username, 'issuer': e.detail.value }
    })
  },
  //账号保存
  openIssuer: function () {
    this.edit(this.data.editData);
  },
  //编辑取消
  powerClose: function(){
    this.setData({
      hiddenmodalput: !this.data.hiddenmodalput
    });
  },
  //编辑信息函数 isType 为编辑那个 0 为账号 1 为 网站 value:修改内容
  edit:function(valuer){
    var that = this;
    var old_data = wx.getStorageSync('servers');
    if (old_data == '') {
      old_data = '[]'
    }
    var servers = JSON.parse(old_data);
    var server = [];//存储新的信息
    var old_length = servers.length;
    servers.forEach(function (value, index, array) {
      if (value.secret != that.data.editData.secret) {
        server.push(value);
      }else{
        server.push(valuer)
      }
    });
    var serverCode=[];//展示新的信息
    that.data.servers.forEach(function (value, index, array){
      if (value.secret != that.data.editData.secret) {
        serverCode.push(value);
      } else {
        valuer.code = value.code;
        serverCode.push(valuer);
      }
    })
    var new_length = server.length;
    if (new_length != old_length) {
      wx.showModal({
        title: '数据存储出错！',
        content: '数据存储出错！请联系管理员！',
        success: function (res) {
          if (res.confirm) {
            wx.switchTab({
              url: '../index/index'
            })
          }
        }
      })
    } else {
      var servers_str = JSON.stringify(server);
      wx.setStorageSync('servers', servers_str);
      wx.showToast({
        "title": "编辑成功！",
        "icon": "success",
        complete: function (e) {
          that.setData({
            hiddenmodalput: !that.data.hiddenmodalput,
            servers: serverCode
          });
        }
      })
    }
  },
  //删除当前数据
  deleteCode: function (e) {
    var that = this;
    this.setData({
      editHidder: true
    })
    wx.showModal({
      title: "注意！",
      content: "你是否要删除网站为“" + that.data.editData.issuer + "”，用户名为 " + that.data.editData.username + " 的密码吗？此操作不可恢复！",
      success: function (res) {
        if (res.confirm) {
          var servers = wx.getStorageSync('servers');
          servers = JSON.parse(servers);
          var server = [];
          servers.forEach(function (value, index, array) {
            if (value.secret != that.data.editData.secret) {
              server.push(value);
            }
          });
          server = JSON.stringify(server);
          wx.setStorage({
            key: 'servers',
            data: server,
            success: function (res) {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 2000,
                success: function () {
                  wx.switchTab({
                    url: '../index/index'
                  })
                }
              })
            }
          })
        } else {

        }
      }
    })

  }
})

