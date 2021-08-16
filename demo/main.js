const { app, BrowserWindow, ipcMain, nativeTheme, shell, session } = require('electron');
const { ZOOM_TYPE_OS_TYPE, ZoomSDK_LANGUAGE_ID, ZoomSDKError, ZoomAuthResult, ZoomLoginStatus, ZoomMeetingStatus,
  ZoomMeetingUIFloatVideoType, SDKCustomizedStringType, SDKCustomizedURLType, ZoomAPPLocale } = require('../lib/settings.js');
try {
  require('../lib/electron_sdk_pb.js');
} catch (error) {
  console.log('Please execute npm install google-protobuf at root of the project \nRefer to README.md');
  app.exit();
  return
}

const ZOOMSDKMOD = require('../lib/zoom_sdk.js');
const os = require('os');
const platform = os.platform();
const arch = os.arch();
const showLog = false;

const initoptions = {
  apicallretcb: apicallresultcb,
  ostype: ZOOM_TYPE_OS_TYPE.WIN_OS,
};
initoptions.path = platform == 'darwin' ? './../sdk/mac/' : arch == 'x64' ? './../sdk/win64/' : './../sdk/win32/';

if (platform == 'darwin' && nativeTheme) {
  nativeTheme.themeSource = 'light';
}

const zoomsdk = ZOOMSDKMOD.ZoomSDK.getInstance(initoptions);
let zoomauth = null;
let mainWindow = null;
let loginWindow = null;
let startjoinWindow = null;
let waitingWindow = null;
let inmeetingWindow = null;
let startjoinUnLoginWindow = null;
let domainWindow = null;
let YUVWindow = null;
let zoommeeting;
let zoominfomod;
let zoomuicontroller;
let zoomannotation;
let zoomaudio;
let zoomshare;
let zoomdirectshare;
let zoomconfiguration;
let zoomupdateaccount;
let zoomrecording;
let zoomparticipantsctrl;
let zoomcustomizedresource;
let zoomrawdata;
let zoomsms;
let zoomsetshare;
let zoomsetui;
let zoomsetstatistic;
let zoomsetaccessibility;
let hasRDLicense;
let autoCloseYUV = false;
let hasLogin = false;
let startOrJoinWithRawdata;

function sdkauthCB(status) {
  if (ZoomAuthResult.AUTHRET_SUCCESS == status) {
    let opts = {
      meetingstatuscb: meetingstatuscb,
      meetinguserjoincb: meetinguserjoincb,
      meetinguserleftcb: meetinguserleftcb,
      meetinghostchangecb: meetinghostchangecb
    };
    zoommeeting = zoomsdk.GetMeeting(opts);
    app.zoommeeting = zoommeeting;
    zoomparticipantsctrl = zoommeeting.GetMeetingParticipantsCtrl(opts);
    app.zoomparticipantsctrl = zoomparticipantsctrl;
    zoomrawdata = zoomsdk.RawData();
    hasRDLicense = hasRawDataLicense();
    global.hasRDLicense = hasRDLicense;
    app.zoomrawdata = zoomrawdata;
    zoominfomod = zoommeeting.GetMeetingInfo();
    zoomuicontroller = zoommeeting.GetMeetingUICtrl();
    zoomannotation = zoommeeting.GetAnnotationCtrl();
    zoomshare = zoommeeting.GetMeetingShare();
    app.zoomshare = zoomshare;
    zoomh323 = zoommeeting.GetMeetingH323();
    zoomconfiguration = zoommeeting.GetMeetingConfiguration();
    zoomupdateaccount = zoommeeting.GetUpdateAccount();
    zoomrecording = zoommeeting.GetMeetingRecording();
    let optsaudio = {
      onUserAudioStatusChange: onUserAudioStatusChange
    };
    zoomaudio = zoommeeting.GetMeetingAudio(optsaudio);
    let optsvideo = {
      onUserVideoStatusChange: onUserVideoStatusChange
    };
    zoomvideo = zoommeeting.GetMeetingVideo(optsvideo);
    app.zoomvideo = zoomvideo;
    zoomsetting = zoomsdk.GetSetting();
    zoomsetgeneral = zoomsetting.GetGeneralSetting();
    zoomsetrecord = zoomsetting.GetRecordingSetting();
    zoomsetvideo = zoomsetting.GetVideoSetting();
    zoomsetaudio = zoomsetting.GetAudioSetting();
    zoomsetshare = zoomsetting.GetShareSetting();
    zoomsetui = zoomsetting.GetSettingUICtrl();
    zoomsetstatistic = zoomsetting.GetSettingStatisticCtrl();
    zoomsetaccessibility = zoomsetting.GetSettingAccessibilityCtrl();
    zoomcustomizedresource = zoomsdk.GetCustomizedResource();
    zoomsms = zoomsdk.SMSHelper();
    zoomdirectshare = zoomauth.GetDirectShare();
    showLoginWindow();
  } else {
    showAuthwindow();
  }
}

function onLoginReturnWithReason(loginStatus, loginFailReason) {
  hasLogin = false;
  switch (loginStatus) {
    case ZoomLoginStatus.LOGIN_SUCCESS:
      hasLogin = true;
      showStartJoinWindow();
      break;
    case ZoomLoginStatus.LOGIN_PROCESSING:
      showWaitingWindow();
      break;
    case ZoomLoginStatus.LOGIN_FAILED:
      showLoginWindow();
      break;
    default:
      break;
  }
}

function meetinguserjoincb(useritem) {
}

function meetinguserleftcb(userList) {
}

function meetinghostchangecb(userList) {
}

function onUserAudioStatusChange(result) {
}

function onUserVideoStatusChange(result) {
}

function meetingstatuscb(status, result) {
  switch (status) {
    case ZoomMeetingStatus.MEETING_STATUS_CONNECTING:
      if (startOrJoinWithRawdata) {
        showYUVWindow();
      }
      YUVWindow ? YUVWindow.webContents.send('main-process-meetingstatus', 'connecting') : null;
      break;
    case ZoomMeetingStatus.MEETING_STATUS_DISCONNECTING:
    case ZoomMeetingStatus.MEETING_STATUS_RECONNECTING:
      if (startOrJoinWithRawdata) {
        YUVWindow ? YUVWindow.webContents.send('main-process-stopclient') : null;
      }
      showWaitingWindow();
      break;
    case ZoomMeetingStatus.MEETING_STATUS_INMEETING:
      showInMeetingWindow();
      YUVWindow ? YUVWindow.webContents.send('main-process-meetingstatus', 'inmeeting') : null;
      break;
    case ZoomMeetingStatus.MEETING_STATUS_FAILED:
    case ZoomMeetingStatus.MEETING_STATUS_ENDED:
      startOrJoinWithRawdata = false;
      if (hasLogin) {
        showStartJoinWindow();
      } else {
        showLoginWindow();
      }
      break;
    case ZoomMeetingStatus.MEETING_STATUS_IN_WAITING_ROOM:
      break;
    default:
      break;
  }
}

class AppWindow extends BrowserWindow {
  constructor(config) {
    const basicConfig = {
      width: 700,
      height: 400,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      }
    };
    const finalConfig = { ...basicConfig, ...config };
    super(finalConfig)
  }
}

function showWaitingWindow() {
  if (!waitingWindow) {
    waitingWindow = new AppWindow();
    waitingWindow.loadURL('file://' + __dirname + '/pages/waiting.html');
  }
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }
  if (startjoinWindow) {
    startjoinWindow.close();
    startjoinWindow = null;
  }
  if (inmeetingWindow) {
    inmeetingWindow.close();
    inmeetingWindow = null;
  }
  if (startjoinUnLoginWindow) {
    startjoinUnLoginWindow.close();
    startjoinUnLoginWindow = null;
  }
  if (domainWindow) {
    domainWindow.close();
    domainWindow = null;
  }
  if (YUVWindow) {
    autoCloseYUV = true;
    YUVWindow.close();
    YUVWindow = null;
  }
}

function showInMeetingWindow() {
  if (!inmeetingWindow) {
    inmeetingWindow = new AppWindow({
      x: YUVWindow ? 10 : null, y: YUVWindow ? 10 : null
    });
    inmeetingWindow.on('close', () => {
      inmeetingWindow = null;
    });
    inmeetingWindow.loadURL('file://' + __dirname + '/pages/inmeeting.html');
  }
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }
  if (startjoinWindow) {
    startjoinWindow.close();
    startjoinWindow = null;
  }
  if (waitingWindow) {
    waitingWindow.close();
    waitingWindow = null;
  }
  if (startjoinUnLoginWindow) {
    startjoinUnLoginWindow.close();
    startjoinUnLoginWindow = null;
  }
  if (domainWindow) {
    domainWindow.close();
    domainWindow = null;
  }
}

function clearSetCallBack() {
  zoomparticipantsctrl.SetMeetingUserJoinCB(null);
  zoomparticipantsctrl.SetMeetingUserLeftCB(null);
  zoomparticipantsctrl.SetMeetingHostChangeCB(null);
  zoomvideo.MeetingVideo_SetMeetingVideoStatusCB(null);
  zoomshare.MeetingShare_SetOnSharingStatusCB(null);
}

function showYUVWindow() {
  if (!YUVWindow) {
    YUVWindow = new AppWindow({
      width: 1920, height: 1080
    });
    YUVWindow.on('close', (flag) => {
      YUVWindow.webContents.send('main-process-meetingstatus', 'ended');
      clearSetCallBack();
      let opt = {
        endMeeting: false
      };
      if (!autoCloseYUV) {
        zoommeeting.LeaveMeeting(opt);
      }
      YUVWindow = null;
      if (startjoinWindow) {
        startjoinWindow.close();
        startjoinWindow = null;
      }
      showStartJoinWindow();
    });
    YUVWindow.loadURL('file://' + __dirname + '/pages/yuv.html');
    autoCloseYUV = false
  }
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }
  if (startjoinWindow) {
    startjoinWindow.close();
    startjoinWindow = null;
  }
  if (waitingWindow) {
    waitingWindow.close();
    waitingWindow = null;
  }
  if (startjoinUnLoginWindow) {
    startjoinUnLoginWindow.close();
    startjoinUnLoginWindow = null;
  }
  if (domainWindow) {
    domainWindow.close();
    domainWindow = null;
  }
}

function showDomainwindow() {
  if (!domainWindow) {
    domainWindow = new AppWindow();
    domainWindow.loadURL('file://' + __dirname + '/pages/domain.html');
  }
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }
  if (startjoinWindow) {
    startjoinWindow.close();
    startjoinWindow = null;
  }
  if (waitingWindow) {
    waitingWindow.close();
    waitingWindow = null;
  }
  if (inmeetingWindow) {
    inmeetingWindow.close();
    inmeetingWindow = null;
  }
  if (startjoinUnLoginWindow) {
    startjoinUnLoginWindow.close();
    startjoinUnLoginWindow = null;
  }
  if (YUVWindow) {
    autoCloseYUV = true;
    YUVWindow.close();
    YUVWindow = null;
  }
}

function showAuthwindow() {
  if (!mainWindow) {
    mainWindow = new AppWindow();
    mainWindow.loadURL('file://' + __dirname + '/pages/index.html');
  }
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }
  if (startjoinWindow) {
    startjoinWindow.close();
    startjoinWindow = null;
  }
  if (waitingWindow) {
    waitingWindow.close();
    waitingWindow = null;
  }
  if (inmeetingWindow) {
    inmeetingWindow.close();
    inmeetingWindow = null;
  }
  if (startjoinUnLoginWindow) {
    startjoinUnLoginWindow.close();
    startjoinUnLoginWindow = null;
  }
  if (domainWindow) {
    domainWindow.close();
    domainWindow = null;
  }
  if (YUVWindow) {
    autoCloseYUV = true;
    YUVWindow.close();
    YUVWindow = null;
  }
}

function showLoginWindow() {
  if (!loginWindow) {
    loginWindow = new AppWindow({
      height: 500,
    });
    loginWindow.loadURL('file://' + __dirname + '/pages/login.html');
  }
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (startjoinWindow) {
    startjoinWindow.close();
    startjoinWindow = null;
  }
  if (waitingWindow) {
    waitingWindow.close();
    waitingWindow = null;
  }
  if (inmeetingWindow) {
    inmeetingWindow.close();
    inmeetingWindow = null;
  }
  if (startjoinUnLoginWindow) {
    startjoinUnLoginWindow.close();
    startjoinUnLoginWindow = null;
  }
  if (domainWindow) {
    domainWindow.close();
    domainWindow = null;
  }
  if (YUVWindow) {
    autoCloseYUV = true;
    YUVWindow.close();
    YUVWindow = null;
  }
}

function showStartJoinWindow() {
  if (!startjoinWindow) {
    startjoinWindow = new AppWindow();
    startjoinWindow.loadURL('file://' + __dirname + '/pages/start_join.html');
  }
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (loginWindow) {
    loginWindow.close();
    loginWindow = null;
  }
  if (waitingWindow) {
    waitingWindow.close();
    waitingWindow = null;
  }
  if (inmeetingWindow) {
    inmeetingWindow.close();
    inmeetingWindow = null;
  }
  if (startjoinUnLoginWindow) {
    startjoinUnLoginWindow.close();
    startjoinUnLoginWindow = null;
  }
  if (domainWindow) {
    domainWindow.close();
    domainWindow = null;
  }
  if (YUVWindow) {
    autoCloseYUV = true;
    YUVWindow.close();
    YUVWindow = null;
  }
}

function ProcSDKReady() {
  showAuthwindow();
  var options = {
    authcb: sdkauthCB,
    onLoginReturnWithReason: onLoginReturnWithReason,
    logoutcb: null
  };
  zoomauth = zoomsdk.GetAuth(options);
}

function apicallresultcb(apiname, ret) {
  if ('InitSDK' == apiname && ZoomSDKError.SDKERR_SUCCESS == ret) {
    ProcSDKReady()
  } else if ('CleanUPSDK' == apiname) {
    app.quit();
  }
}

function OnDirectShareStatusUpdate(status) {
  startjoinWindow ? startjoinWindow.webContents.send('main-process-onDirectShareStatusUpdate', status) : null;
}

function hasRawDataLicense() {
  return zoomrawdata.HasRawDataLicense();
}

function customizedresource() {
  zoomcustomizedresource = zoomsdk.GetCustomizedResource();
  const optCustomizedResouce = {
    CustomizedStringType: SDKCustomizedStringType.SDK_Customized_Title_App,
    strCustomizedString: 'zoom demo'
  };
  const optCustomizedURLResouce = {
    CustomizedURLType: SDKCustomizedURLType.ZN_SDKCustomizedURL_SUPPORTURL,
    strCustomizeURL: 'https://www.baidu.com/'
  };
  const optCustomizedPictureResouce = {
    strPNGID: 'ZOOMAPPICON.PNG',
    strPNGPath: 'D:\\emoticons.png'
  };
  if (zoomcustomizedresource) {
    zoomcustomizedresource.Resource_AddCustomizedStringResource(optCustomizedResouce);
    zoomcustomizedresource.Resource_AddCustomizedURLResource(optCustomizedURLResouce);
    zoomcustomizedresource.Resource_AddCustomizedPictureResource(optCustomizedPictureResouce);
  }
}

let functionObj = {
  showSatrtJoinUnLoginWindow: function () {
    if (!startjoinUnLoginWindow) {
      startjoinUnLoginWindow = new AppWindow();
      startjoinUnLoginWindow.loadURL('file://' + __dirname + '/pages/start_join_without_login.html');
    }
    if (startjoinWindow) {
      startjoinWindow.close();
      startjoinWindow = null;
    }
    if (mainWindow) {
      mainWindow.close();
      mainWindow = null;
    }
    if (loginWindow) {
      loginWindow.close();
      loginWindow = null;
    }
    if (waitingWindow) {
      waitingWindow.close();
      waitingWindow = null;
    }
    if (inmeetingWindow) {
      inmeetingWindow.close();
      inmeetingWindow = null;
    }
    if (domainWindow) {
      domainWindow.close();
      domainWindow = null;
    }
  },
  setDomain: function (domain, enable_log) {
    const opts = {
      path: '', // win require absolute path, mac require ''
      domain: domain,
      enable_log: enable_log,
      langid: ZoomSDK_LANGUAGE_ID.LANGUAGE_English,
      locale: ZoomAPPLocale.ZNSDK_APP_Locale_Default,
      logfilesize: 5
    };
    if (platform == 'win32') {
      customizedresource(); // CustomizedResource only support windows, should call before initSDK
    }
    var ret = zoomsdk.InitSDK(opts);
    if (ZoomSDKError.SDKERR_SUCCESS == ret) {
      ProcSDKReady();
    }
    return ret;
  },
  getZoomSDKVersion: function () {
    return zoomsdk.GetZoomSDKVersion()
  },
  login: function (username, psw) {
    if (username && psw) {
      showWaitingWindow();
    }
    return zoomauth.Login(username, psw, false);
  },
  generateSSOLoginWebURL: function (prefixOfVanityUrl) {
    let obj = {
      prefixOfVanityUrl: prefixOfVanityUrl
    };
    let url = zoomauth.GenerateSSOLoginWebURL(obj);
    shell.openExternal(url);
    loginWindow.webContents.send('main-process-generateSSOLoginWebURL');
    return url;
  },
  sSOLoginWithWebUriProtocol: function (uriProtocol) {
    let obj = {
      uriProtocol: uriProtocol
    };
    return zoomauth.SSOLoginWithWebUriProtocol(obj);
  },
  logout: function () {
    let ret = zoomauth.Logout();
    showLoginWindow();
    return ret;
  },
  authWithJwtToken: function (sdk_context) {
    let ret = zoomauth.AuthWithJwtToken(sdk_context);
    if (ret == 0) {
      showWaitingWindow();
    }
    return ret;
  },
  getWebinalLegalNoticesPrompt: function () {
    return zoomauth.GetWebinalLegalNoticesPrompt();
  },
  getWebinalLegalNoticesExplained: function () {
    return zoomauth.GetWebinalLegalNoticesExplained();
  },
  start: function (meetingnum, withRawdata) {
    startOrJoinWithRawdata = withRawdata;
    var opt = {
      meetingnum: meetingnum,
      withRawdata: withRawdata
    };
    return zoommeeting.StartMeeting(opt);
  },
  join: function (meetingnum, username, withRawdata) {
    startOrJoinWithRawdata = withRawdata;
    var opt = {
      meetingnum: meetingnum,
      username: username,
      withRawdata: withRawdata
    };
    return zoommeeting.JoinMeeting(opt);
  },
  startunlogin: function (meetingnum, zoomaccesstoken, username) {
    var opt = {
      meetingnum: meetingnum,
      zoomaccesstoken: zoomaccesstoken,
      username: username
    };
    return zoommeeting.StartMeetingWithOutLogin(opt);
  },
  joinunlogin: function (meetingnum, vanityid, username) {
    var opt = {
      meetingnum: meetingnum,
      vanityid: vanityid,
      username: username
    };
    return zoommeeting.JoinMeetingWithoutLogin(opt);
  },
  leave: function (endMeeting) {
    var opt = {
      endMeeting: endMeeting
    };
    return zoommeeting.LeaveMeeting(opt);
  },
  end: function (endMeeting) {
    var opt = {
      endMeeting: endMeeting
    };
    return zoommeeting.LeaveMeeting(opt);
  },
  lock: function () {
    return zoommeeting.Lock_Meeting();
  },
  unlock: function () {
    return zoommeeting.Un_lock_Meeting();
  },
  getSharingConnQuality: function () {
    return zoommeeting.GetSharingConnQuality();
  },
  getVideoConnQuality: function () {
    return zoommeeting.GetVideoConnQuality();
  },
  getAudioConnQuality: function () {
    return zoommeeting.GetAudioConnQuality();
  },
  getParticipantsList: function () {
    return zoomparticipantsctrl.GetParticipantsList();
  },
  getUserInfoByUserID: function (userid) {
    return zoomparticipantsctrl.GetUserInfoByUserID(userid);
  },
  handleZoomWebUriProtocolAction: function (protocol_action) {
    let opt = {
      protocol_action: protocol_action
    };
    return zoommeeting.HandleZoomWebUriProtocolAction(opt);
  },
  getMeetingTopic: function () {
    return zoominfomod.GetMeetingTopic();
  },
  getMeetingType: function () {
    return zoominfomod.GetMeetingType();
  },
  getMeetingNumber: function () {
    return zoominfomod.GetMeetingNumber();
  },
  getMeetingID: function () {
    return zoominfomod.GetMeetingID();
  },
  getInviteEmailTeamplate: function () {
    return zoominfomod.GetInviteEmailTeamplate();
  },
  getInviteEmailTitle: function () {
    return zoominfomod.GetInviteEmailTitle();
  },
  getJoinMeetingUrl: function () {
    return zoominfomod.GetJoinMeetingUrl();
  },
  getMeetingHostTag: function () {
    return zoominfomod.GetMeetingHostTag();
  },
  checkingIsInternalMeeting: function () {
    return zoominfomod.CheckingIsInternalMeeting();
  },
  showChat: function () {
    let opts = {
      left: '200',
      top: '200'
    };
    return zoomuicontroller.MeetingUI_ShowChatDlg(opts);
  },
  hideChat: function () {
    return zoomuicontroller.MeetingUI_HideChatDlg();
  },
  enterFullscreen: function () {
    var opts = {
      bFirstView: '1',
      bSecView: '0'
    };
    return zoomuicontroller.MeetingUI_EnterFullScreen(opts);
  },
  exitFullScreen: function () {
    var opts = {
      bFirstView: '1',
      bSecView: '0'
    };
    return zoomuicontroller.MeetingUI_ExitFullScreen(opts);
  },
  switchToVideoWall: function () {
    return zoomuicontroller.MeetingUI_SwitchToVideoWall();
  },
  swtichToAcitveSpeaker: function () {
    return zoomuicontroller.MeetingUI_SwtichToAcitveSpeaker();
  },
  moveFloatVideoWnd: function () {
    let opts = {
      left: '200',
      top: '200'
    };
    return zoomuicontroller.MeetingUI_MoveFloatVideoWnd(opts);
  },
  showSharingToolbar: function (show) {
    let opts = {
      show: show
    };
    return zoomuicontroller.MeetingUI_ShowSharingToolbar(opts);
  },
  switchFloatVideoToActiveSpkMod: function () {
    return zoomuicontroller.MeetingUI_SwitchFloatVideoToActiveSpkMod();
  },
  changeFloatoActiveSpkVideoSize: function () {
    let obj = {
      floatvideotype: ZoomMeetingUIFloatVideoType.FLOATVIDEO_Large
    };
    return zoomuicontroller.MeetingUI_ChangeFloatoActiveSpkVideoSize(obj);
  },
  switchFloatVideoToGalleryMod: function () {
    return zoomuicontroller.MeetingUI_SwitchFloatVideoToGalleryMod();
  },
  showParticipantsListWnd: function (show) {
    let opts = {
      show: show
    };
    return zoomuicontroller.MeetingUI_ShowParticipantsListWnd(opts);
  },
  showBottomFloatToolbarWnd: function (show) {
    let opts = {
      show: show
    };
    return zoomuicontroller.MeetingUI_ShowBottomFloatToolbarWnd(opts);
  },
  showJoinAudioDlg: function () {
    return zoomuicontroller.MeetingUI_ShowJoinAudioDlg();
  },
  hideJoinAudioDlg: function () {
    return zoomuicontroller.MeetingUI_HideJoinAudioDlg();
  },
  getWallViewPageInfo: function (arg2, arg3) {
    let opts = {
      currentPage: arg2,
      totalPages: arg3
    };
    return zoomuicontroller.MeetingUI_GetWallViewPageInfo(opts);
  },
  showPreOrNextPageVideo: function (show) {
    let opts = {
      show: show
    };
    return zoomuicontroller.MeetingUI_ShowPreOrNextPageVideo(opts);
  },
  showSharingFrameWindows: function (show) {
    let opts = {
      show: show
    };
    return zoomuicontroller.MeetingUI_ShowSharingFrameWindows(opts);
  },
  switchSplitScreenMode: function (isSwitch) {
    let opts = {
      isSwitch: isSwitch
    };
    return zoomuicontroller.MeetingUI_SwitchSplitScreenMode(opts);
  },
  getCurrentSplitScreenModeInfo: function (arg2, arg3) {
    let opts = {
      bZNSupportSplitScreen: arg2,
      bZNInSplitScreenMode: arg3
    };
    return zoomuicontroller.MeetingUI_GetCurrentSplitScreenModeInfo(opts);
  },
  isAnnotaionDisable: function () {
    return zoomannotation.Annotaion_IsAnnotaionDisable();
  },
  startAnnotation: function (viewtype, left, top) {
    let opts = {
      viewtype: viewtype,
      left: '300',
      top: '300'
    };
    return zoomannotation.Annotaion_StartAnnotation(opts);
  },
  stopAnnotation: function (viewtype) {
    let opts = {
      viewtype: viewtype
    };
    return zoomannotation.Annotaion_StopAnnotation(opts);
  },
  setTool: function (viewtype, tooltype) {
    let opts = {
      viewtype: viewtype,
      tooltype: tooltype
    };
    return zoomannotation.Annotaion_SetTool(opts);
  },
  setClear: function (viewtype, cleartype) {
    let opts = {
      viewtype: viewtype,
      cleartype: cleartype
    };
    return zoomannotation.Annotaion_Clear(opts);
  },
  setColor: function (viewtype, color) {
    let opts = {
      viewtype: viewtype,
      color: color
    };
    return zoomannotation.Annotaion_SetColor(opts);
  },
  SetLineWidth: function (viewtype, lineWidth) {
    let opts = {
      viewtype: viewtype,
      lineWidth: lineWidth
    };
    return zoomannotation.Annotaion_SetLineWidth(opts);
  },
  undo: function (viewtype) {
    let opts = {
      viewtype: viewtype
    };
    return zoomannotation.Annotaion_Undo(opts)
  },
  redo: function (viewtype) {
    let opts = {
      viewtype: viewtype
    };
    return zoomannotation.Annotaion_Redo(opts)
  },
  isAnnotationLegalNoticeAvailable: function () {
    return zoomannotation.Annotaion_IsAnnotationLegalNoticeAvailable()
  },
  getAnnotationLegalNoticesPrompt: function () {
    return zoomannotation.Annotaion_GetAnnotationLegalNoticesPrompt()
  },
  getAnnotationLegalNoticesExplained: function () {
    return zoomannotation.Annotaion_GetAnnotationLegalNoticesExplained()
  },
  muteAudio: function (userid, allowunmutebyself) {
    let opts = {
      userid: userid,
      allowunmutebyself: allowunmutebyself
    };
    return zoomaudio.MeetingAudio_MuteAudio(opts);
  },
  unMuteAudio: function (userid) {
    let opts = {
      userid: userid
    };
    return zoomaudio.MeetingAudio_UnMuteAudio(opts);
  },
  joinVoip: function () {
    return zoomaudio.MeetingAudio_JoinVoip();
  },
  leaveVoip: function () {
    return zoomaudio.MeetingAudio_LeaveVoip();
  },
  enablePlayChimeWhenEnterOrExit: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomaudio.MeetingAudio_EnablePlayChimeWhenEnterOrExit(opts);
  },
  muteVideo: function (userid) {
    let opts = {
      userid: userid
    };
    return zoomvideo.MeetingVideo_MuteVideo(opts);
  },
  unMuteVideo: function (userid) {
    let opts = {
      userid: userid
    };
    return zoomvideo.MeetingVideo_UnMuteVideo(opts);
  },
  pinVideo: function (userid) {
    let opts = {
      bPin: true,
      bFirstView: true,
      userid: userid
    };
    return zoomvideo.MeetingVideo_PinVideo(opts);
  },
  spotlightVideo: function (userid) {
    let opts = {
      bSpotlight: true,
      userid: userid
    };
    return zoomvideo.MeetingVideo_SpotlightVideo(opts);
  },
  hideOrShowNoVideoUserOnVideoWall: function (bHide) {
    let opts = {
      bHide: bHide
    };
    return zoomvideo.MeetingVideo_HideOrShowNoVideoUserOnVideoWall(opts);
  },
  selectCamera: function (zn_deviceId) {
    let opts = {
      zn_deviceId: zn_deviceId
    };
    return zoomsetvideo.Setting_SelectVideoCamera(opts);
  },
  getCameraList: function () {
    return zoomsetvideo.Setting_GetCameraList();
  },
  enableVideoMirrorEffect: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetvideo.Setting_EnableVideoMirrorEffect(opts);
  },
  enableFaceBeautyEffect: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetvideo.Setting_EnableFaceBeautyEffect(opts);
  },
  isMirrorEffectEnabled: function () {
    return zoomsetvideo.Checking_IsMirrorEffectEnabled();
  },
  isFaceBeautyEffectEnabled: function () {
    return zoomsetvideo.Checking_IsFaceBeautyEffectEnabled();
  },
  enableStereoAudio: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_EnableStereoAudio(opts);
  },
  isStereoAudioEnable: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_IsStereoAudioEnable(opts);
  },
  enableMicOriginalInput: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_EnableMicOriginalInput(opts);
  },
  enableHoldSpaceKeyToSpeak: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_EnableHoldSpaceKeyToSpeak(opts);
  },
  isHoldSpaceKeyToSpeakEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_IsHoldSpaceKeyToSpeakEnabled(opts);
  },
  enableAlwaysMuteMicWhenJoinVoip: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_EnableAlwaysMuteMicWhenJoinVoip(opts);
  },
  isAlwaysMuteMicWhenJoinVoipEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_IsAlwaysMuteMicWhenJoinVoipEnabled(opts);
  },
  enableSuppressAudioNotify: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_EnableSuppressAudioNotify(opts);
  },
  isSuppressAudioNotifyEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_IsSuppressAudioNotifyEnabled(opts);
  },
  enableEchoCancellation: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_EnableEchoCancellation(opts);
  },
  isEchoCancellationEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_IsEchoCancellationEnabled(opts);
  },
  setMicVol: function (value) {
    let opts = {
      value: value
    };
    return zoomsetaudio.Setting_SetMicVol(opts);
  },
  getMicVol: function (value) {
    let opts = {
      value: value
    };
    return zoomsetaudio.Setting_GetMicVol(opts);
  },
  setSpeakerVol: function (value) {
    let opts = {
      value: value
    };
    return zoomsetaudio.Setting_SetSpeakerVol(opts);
  },
  getSpeakerVol: function (value) {
    let opts = {
      value: value
    };
    return zoomsetaudio.Setting_GetSpeakerVol(opts);
  },
  isMicOriginalInputEnable: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaudio.Setting_IsMicOriginalInputEnable(opts);
  },
  enableHDVideo: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_EnableHDVideo(opts);
  },
  isHDVideoEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_IsHDVideoEnabled(opts);
  },
  enableAlwaysShowNameOnVideo: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_EnableAlwaysShowNameOnVideo(opts);
  },
  isAlwaysShowNameOnVideoEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_IsAlwaysShowNameOnVideoEnabled(opts);
  },
  enableAutoTurnOffVideoWhenJoinMeeting: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_EnableAutoTurnOffVideoWhenJoinMeeting(opts);
  },
  isAutoTurnOffVideoWhenJoinMeetingEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_IsAutoTurnOffVideoWhenJoinMeetingEnabled(opts);
  },
  enableAlwaysUse16v9: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_EnableAlwaysUse16v9(opts);
  },
  isAlwaysUse16v9: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_IsAlwaysUse16v9(opts);
  },
  enableSpotlightSelf: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_EnableSpotlightSelf(opts);
  },
  isSpotlightSelfEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_IsSpotlightSelfEnabled(opts);
  },
  enableHardwareEncode: function (bEnable, encodeType) {
    let opts = {
      bEnable: bEnable,
      encodeType: encodeType
    };
    return zoomsetvideo.Setting_EnableHardwareEncode(opts);
  },
  isHardwareEncodeEnabled: function (bEnable, encodeType) {
    let opts = {
      bEnable: bEnable,
      encodeType: encodeType
    };
    return zoomsetvideo.Setting_IsHardwareEncodeEnabled(opts);
  },
  enable49VideoesInGallaryView: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_Enable49VideoesInGallaryView(opts);
  },
  is49VideoesInGallaryViewEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_Is49VideoesInGallaryViewEnabled(opts);
  },
  enableHideNoVideoUsersOnWallView: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_EnableHideNoVideoUsersOnWallView(opts);
  },
  isHideNoVideoUsersOnWallViewEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_IsHideNoVideoUsersOnWallViewEnabled(opts);
  },
  enableVideoPreviewDialog: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetvideo.Setting_EnableVideoPreviewDialog(opts);
  },
  isVideoPreviewDialogEnabled: function () {
    return zoomsetvideo.Setting_IsVideoPreviewDialogEnabled();
  },
  getMicList: function () {
    zoomsetaudio.Setting_GetMicList();
  },
  selectMic: function (zn_deviceId, zn_deviceName) {
    let opts = {
      zn_deviceId: zn_deviceId,
      zn_deviceName: zn_deviceName
    };
    return zoomsetaudio.Setting_SelectMic(opts);
  },
  selectSpeaker: function (zn_deviceId, zn_deviceName) {
    let opts = {
      zn_deviceId: zn_deviceId,
      zn_deviceName: zn_deviceName
    };
    return zoomsetaudio.Setting_SelectSpeaker(opts);
  },
  getSpeakerList: function () {
    zoomsetaudio.Setting_GetSpeakerList();
  },
  isAutoJoinAudioEnabled: function () {
    return zoomsetaudio.Checking_IsAutoJoinAudioEnabled();
  },
  isAutoAdjustMicEnabled: function () {
    return zoomsetaudio.Checking_IsAutoAdjustMicEnabled();
  },
  enableAutoJoinAudio: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetaudio.Setting_EnableAutoJoinAudio(opts);
  },
  enableAutoAdjustMic: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetaudio.Setting_EnableAutoAdjustMic(opts);
  },
  enableAutoFitToWindowWhenViewSharing: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetshare.Setting_EnableAutoFitToWindowWhenViewSharing(opts);
  },
  isAutoFitToWindowWhenViewSharingEnabled: function () {
    return zoomsetshare.Setting_IsAutoFitToWindowWhenViewSharingEnabled();
  },
  isCurrentOSSupportAccelerateGPUWhenShare: function () {
    return zoomsetshare.Setting_IsCurrentOSSupportAccelerateGPUWhenShare();
  },
  enableAccelerateGPUWhenShare: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetshare.Setting_EnableAccelerateGPUWhenShare(opts);
  },
  isAccelerateGPUWhenShareEnabled: function () {
    return zoomsetshare.Setting_IsAccelerateGPUWhenShareEnabled();
  },
  enableRemoteControlAllApplications: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetshare.Setting_EnableRemoteControlAllApplications(opts);
  },
  isRemoteControlAllApplicationsEnabled: function () {
    return zoomsetshare.Setting_IsRemoteControlAllApplicationsEnabled();
  },
  showSettingDlg: function () {
    return zoomsetting.SettingUI_ShowTheSettingDlg();
  },
  hideSettingDlg: function () {
    return zoomsetting.SettingUI_HideSettingDlg();
  },
  enableDualScreenMode: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetgeneral.Setting_EnableDualScreenMode(opts);
  },
  turnOffAeroModeInSharing: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetgeneral.Setting_TurnOffAeroModeInSharing(opts);
  },
  enableAutoFullScreenVideoWhenJoinMeeting: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetgeneral.Setting_EnableAutoFullScreenVideoWhenJoinMeeting(opts);
  },
  enableSplitScreenMode: function (zn_bEnable) {
    let opts = {
      zn_bEnable: zn_bEnable
    };
    return zoomsetgeneral.Setting_EnableSplitScreenMode(opts);
  },
  isDualScreenModeEnabled: function () {
    return zoomsetgeneral.Checking_IsDualScreenModeEnabled();
  },
  isAeroModeInSharingTurnOff: function () {
    return zoomsetgeneral.Checking_IsAeroModeInSharingTurnOff();
  },
  isAutoFullScreenVideoWhenJoinMeetingEnabled: function () {
    return zoomsetgeneral.Checking_IsAutoFullScreenVideoWhenJoinMeetingEnabled();
  },
  isSplitScreenModeEnabled: function () {
    return zoomsetgeneral.Checking_IsSplitScreenModeEnabled();
  },
  enableDisplayReminderWindowWhenExit: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetgeneral.Setting_EnableDisplayReminderWindowWhenExit(opts);
  },
  isDisplayReminderWindowWhenExitEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetgeneral.Setting_IsDisplayReminderWindowWhenExitEnabled(opts);
  },
  enableShowMyMeetingElapseTime: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetgeneral.Setting_EnableShowMyMeetingElapseTime(opts);
  },
  isShowMyMeetingElapseTimeEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetgeneral.Setting_IsShowMyMeetingElapseTimeEnabled(opts);
  },
  setRecordingPath: function (zn_szPath) {
    let opts = {
      zn_szPath: zn_szPath
    };
    return zoomsetrecord.Setting_SetRecordingPath(opts);
  },
  getRecordingPath: function () {
    return zoomsetrecord.Getting_GetRecordingPath();
  },
  canGetCloudRecordingStorageInfo: function (bCan) {
    let opts = {
      bCan: bCan
    };
    return zoomsetrecord.Setting_CanGetCloudRecordingStorageInfo(opts);
  },
  getCloudRecordingStorageInfo: function () {
    return zoomsetrecord.Getting_GetCloudRecordingStorageInfo();
  },
  getRecordingManagementURL: function () {
    return zoomsetrecord.Getting_GetRecordingManagementURL();
  },
  canGetRecordingManagementURL: function (bCan) {
    let opts = {
      bCan: bCan
    };
    return zoomsetrecord.Setting_CanGetRecordingManagementURL(opts);
  },
  enableSelectRecordFileLocationAfterMeeting: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_EnableSelectRecordFileLocationAfterMeeting(opts);
  },
  isSelectRecordFileLocationAfterMeetingEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_IsSelectRecordFileLocationAfterMeetingEnabled(opts);
  },
  enableMultiAudioStreamRecord: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_EnableMultiAudioStreamRecord(opts);
  },
  isMultiAudioStreamRecordEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_IsMultiAudioStreamRecordEnabled(opts);
  },
  enableAddTimestampWatermark: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_EnableAddTimestampWatermark(opts);
  },
  isAddTimestampWatermarkEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_IsAddTimestampWatermarkEnabled(opts);
  },
  enableOptimizeFor3rdPartyVideoEditor: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_EnableOptimizeFor3rdPartyVideoEditor(opts);
  },
  isOptimizeFor3rdPartyVideoEditorEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_IsOptimizeFor3rdPartyVideoEditorEnabled(opts);
  },
  enableShowVideoThumbnailWhenShare: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_EnableShowVideoThumbnailWhenShare(opts);
  },
  isShowVideoThumbnailWhenShareEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_IsShowVideoThumbnailWhenShareEnabled(opts);
  },
  enablePlaceVideoNextToShareInRecord: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_EnablePlaceVideoNextToShareInRecord(opts);
  },
  isPlaceVideoNextToShareInRecordEnabled: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetrecord.Setting_IsPlaceVideoNextToShareInRecordEnabled(opts);
  },
  startAppShare: function (zn_hShare_app) {
    let opts = {
      zn_hShare_app: zn_hShare_app
    };
    return zoomshare.MeetingShare_StartAppShare(opts);
  },
  startMonitorShare: function (zn_monitorID) {
    let opts = {
      zn_monitorID: zn_monitorID
    };
    return zoomshare.MeetingShare_StartMonitorShare(opts);
  },
  stopShare: function () {
    return zoomshare.MeetingShare_StopShare();
  },
  isWhiteboardLegalNoticeAvailable: function () {
    return zoomshare.MeetingShare_IsWhiteboardLegalNoticeAvailable();
  },
  getWhiteboardLegalNoticesPrompt: function () {
    return zoomshare.MeetingShare_GetWhiteboardLegalNoticesPrompt();
  },
  getWhiteboardLegalNoticesExplained: function () {
    return zoomshare.MeetingShare_GetWhiteboardLegalNoticesExplained();
  },
  callOutH323: function () {
    let opts = {
      'deviceName': 'xxx',
      'deviceIP': '1234',
      'deviceE164num': '1234',
      'type': 1
    };
    return zoomh323.H323_CallOutH323(opts);
  },
  cancelCallOutH323: function () {
    return zoomh323.H323_CancelCallOutH323();
  },
  getH323Address: function () {
    return zoomh323.H323_GetH323Address();
  },
  getH323Password: function () {
    return zoomh323.H323_GetH323Password();
  },
  getCalloutH323DeviceList: function () {
    return zoomh323.H323_GetCalloutH323DeviceList();
  },
  enableInviteButtonOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableInviteButtonOnMeetingUI(opts);
  },
  setFloatVideoPos: function () {
    let opts = {
      left: '10',
      top: '10'
    };
    return zoomconfiguration.MeetingConfig_SetFloatVideoPos(opts);
  },
  setBottomFloatToolbarWndVisibility: function (bShow) {
    let opts = {
      bShow: bShow
    };
    return zoomconfiguration.MeetingConfig_SetBottomFloatToolbarWndVisibility(opts);
  },
  setSharingToolbarVisibility: function (bShow) {
    let opts = {
      bShow: bShow
    };
    return zoomconfiguration.MeetingConfig_SetSharingToolbarVisibility(opts);
  },
  setDirectShareMonitorID: function (monitorID) {
    let opts = {
      monitorID: monitorID
    };
    return zoomconfiguration.MeetingConfig_SetDirectShareMonitorID(opts);
  },
  setMeetingUIPos: function () {
    let opts = {
      left: '10',
      top: '10'
    };
    return zoomconfiguration.MeetingConfig_SetMeetingUIPos(opts);
  },
  disableWaitingForHostDialog: function (bDisable) {
    let opts = {
      bDisable: bDisable
    };
    return zoomconfiguration.MeetingConfig_DisableWaitingForHostDialog(opts);
  },
  disablePopupMeetingWrongPSWDlg: function (bDisable) {
    let opts = {
      bDisable: bDisable
    };
    return zoomconfiguration.MeetingConfig_DisablePopupMeetingWrongPSWDlg(opts);
  },
  enableAutoEndOtherMeetingWhenStartMeeting: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableAutoEndOtherMeetingWhenStartMeeting(opts);
  },
  enableLButtonDBClick4SwitchFullScreenMode: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableLButtonDBClick4SwitchFullScreenMode(opts);
  },
  setFloatVideoWndVisibility: function (bShow) {
    let opts = {
      bShow: bShow
    };
    return zoomconfiguration.MeetingConfig_SetFloatVideoWndVisibility(opts);
  },
  prePopulateWebinarRegistrationInfo: function (email, userName) {
    let opts = {
      email: email,
      userName: userName
    };
    return zoomconfiguration.MeetingConfig_PrePopulateWebinarRegistrationInfo(opts);
  },
  redirectClickAudioBTNEvent: function (bRedirect) {
    let opts = {
      bRedirect: bRedirect
    };
    return zoomconfiguration.MeetingConfig_RedirectClickAudioBTNEvent(opts);
  },
  redirectClickAudioMenuBTNEvent: function (bRedirect) {
    let opts = {
      bRedirect: bRedirect
    };
    return zoomconfiguration.MeetingConfig_RedirectClickAudioMenuBTNEvent(opts);
  },
  enableAudioButtonOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableAudioButtonOnMeetingUI(opts);
  },
  disableShowJoinMeetingWnd: function (bDisable) {
    let opts = {
      bDisable: bDisable
    };
    return zoomconfiguration.MeetingConfig_DisableShowJoinMeetingWnd(opts);
  },
  setFreeMeetingNeedToUpgradeCB: function () {
    return zoomupdateaccount.MeetingConfig_SetFreeMeetingNeedToUpgradeCB();
  },
  setFreeMeetingUpgradeToGiftFreeTrialStartCB: function () {
    return zoomupdateaccount.MeetingConfig_SetFreeMeetingUpgradeToGiftFreeTrialStartCB();
  },
  setFreeMeetingUpgradeToGiftFreeTrialStopCB: function () {
    return zoomupdateaccount.MeetingConfig_SetFreeMeetingUpgradeToGiftFreeTrialStopCB();
  },
  setFreeMeetingUpgradeToProMeetingCB: function () {
    return zoomupdateaccount.MeetingConfig_SetFreeMeetingUpgradeToProMeetingCB();
  },
  setFreeMeetingUpgradeToProMeetingCB: function () {
    return zoomupdateaccount.MeetingConfig_SetFreeMeetingUpgradeToProMeetingCB();
  },
  addCustomizedPictureResource: function (strPNGID, strPNGPath) {
    let opts = {
      strPNGID: strPNGID,
      strPNGPath: strPNGPath
    };
    return zoomcustomizedresource.Resource_AddCustomizedPictureResource(opts);
  },
  addCustomizedStringResource: function (CustomizedStringType, strCustomizedString) {
    let opts = {
      CustomizedStringType: CustomizedStringType,
      strCustomizedString: strCustomizedString
    };
    return zoomcustomizedresource.Resource_AddCustomizedStringResource(opts);
  },
  addCustomizedURLResource: function (CustomizedURLType, strCustomizeURL) {
    let opts = {
      CustomizedURLType: CustomizedURLType,
      strCustomizeURL: strCustomizeURL
    };
    return zoomcustomizedresource.Resource_AddCustomizedURLResource(opts);
  },
  setFreeMeetingUpgradeToProMeetingCB: function () {
    return zoomupdateaccount.MeetingConfig_SetFreeMeetingUpgradeToProMeetingCB();
  },
  canStartDirectShare: function () {
    let ret = zoomdirectshare.CanStartDirectShare();
    if (ZoomSDKError.SDKERR_SUCCESS == ret) {
      startjoinWindow.webContents.send('canStartDirectShareSuccess', ret)
    }
    return ret
  },
  isDirectShareInProgress: function () {
    return zoomdirectshare.IsDirectShareInProgress();
  },
  startDirectShare: function () {
    return zoomdirectshare.StartDirectShare();
  },
  stopDirectShare: function () {
    return zoomdirectshare.StopDirectShare();
  },
  setDirectShareStatusUpdateCB: function () {
    return zoomdirectshare.SetDirectShareStatusUpdateCB(OnDirectShareStatusUpdate);
  },
  tryWithMeetingNumber: function (meetingNumber) {
    let opts = {
      meetingNumber: meetingNumber
    };
    return zoomdirectshare.TryWithMeetingNumber(opts);
  },
  tryWithPairingCode: function (pairingCode) {
    let opts = {
      pairingCode: pairingCode
    };
    return zoomdirectshare.TryWithPairingCode(opts);
  },
  cancel: function () {
    return zoomdirectshare.Cancel();
  },
  backToMeeting: function () {
    return zoomuicontroller.MeetingUI_BackToMeeting();
  },
  getMeetingUIWnd: function () {
    return zoomuicontroller.MeetingUI_GetMeetingUIWnd();
  },
  switchMinimizeUIMode4FristScreenMeetingUIWnd: function (mode) {
    let opts = {
      mode: mode
    };
    return zoomuicontroller.MeetingUI_SwitchMinimizeUIMode4FristScreenMeetingUIWnd(opts);
  },
  isMinimizeModeOfFristScreenMeetingUIWnd: function () {
    return zoomuicontroller.MeetingUI_IsMinimizeModeOfFristScreenMeetingUIWnd();
  },
  swapToShowShareViewOrVideo: function (bToDisplayShare) {
    let opts = {
      bToDisplayShare: bToDisplayShare
    };
    return zoomuicontroller.MeetingUI_SwapToShowShareViewOrVideo(opts);
  },
  isDisplayingShareViewOrVideo: function () {
    return zoomuicontroller.MeetingUI_IsDisplayingShareViewOrVideo();
  },
  canSwapToShowShareViewOrVideo: function () {
    return zoomuicontroller.MeetingUI_CanSwapToShowShareViewOrVideo();
  },
  reset: function () {
    return zoomconfiguration.MeetingConfig_Reset();
  },
  enableAutoAdjustSpeakerVolumeWhenJoinAudio: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableAutoAdjustSpeakerVolumeWhenJoinAudio(opts);
  },
  enableAutoAdjustMicVolumeWhenJoinAudio: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableAutoAdjustMicVolumeWhenJoinAudio(opts);
  },
  configDSCP: function (dscpAudio, dscpVideo, bReset) {
    let opts = {
      dscpAudio: dscpAudio,
      dscpVideo: dscpVideo,
      bReset: bReset
    };
    return zoomconfiguration.MeetingConfig_ConfigDSCP(opts);
  },
  enableLengthLimitationOfMeetingNumber: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableLengthLimitationOfMeetingNumber(opts);
  },
  enableShareIOSDevice: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableShareIOSDevice(opts);
  },
  enableShareWhiteBoard: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableShareWhiteBoard(opts);
  },
  forceDisableMultiShare: function (bDisable) {
    let opts = {
      bDisable: bDisable
    };
    return zoomconfiguration.MeetingConfig_ForceDisableMultiShare(opts);
  },
  setMaxDurationForOnlyHostInMeeting: function (nDuration) {
    let opts = {
      nDuration: nDuration
    };
    return zoomconfiguration.MeetingConfig_SetMaxDurationForOnlyHostInMeeting(opts);
  },
  enableLocalRecordingConvertProgressBarDialog: function (bShow) {
    let opts = {
      bShow: bShow
    };
    return zoomconfiguration.MeetingConfig_EnableLocalRecordingConvertProgressBarDialog(opts);
  },
  enableApproveRemoteControlDlg: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableApproveRemoteControlDlg(opts);
  },
  enableDeclineRemoteControlResponseDlg: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableDeclineRemoteControlResponseDlg(opts);
  },
  enableLeaveMeetingOptionForHost: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableLeaveMeetingOptionForHost(opts);
  },
  enableVideoButtonOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableVideoButtonOnMeetingUI(opts);
  },
  enableEnterAndExitFullScreenButtonOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableEnterAndExitFullScreenButtonOnMeetingUI(opts);
  },
  redirectClickShareBTNEvent: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectClickShareBTNEvent(opts);
  },
  redirectClickEndMeetingBTNEvent: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectClickEndMeetingBTNEvent(opts);
  },
  redirectFreeMeetingEndingReminderDlg: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectFreeMeetingEndingReminderDlg(opts);
  },
  redirectClickCustomLiveStreamMenuEvent: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectClickCustomLiveStreamMenuEvent(opts);
  },
  redirectClickParticipantListBTNEvent: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectClickParticipantListBTNEvent(opts);
  },
  redirectClickCCBTNEvent: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectClickCCBTNEvent(opts);
  },
  redirectMeetingWarningMsg: function (bRedirectBadNetwork, bRedirectWarnHighCPU) {
    let opts = {
      bRedirectBadNetwork: bRedirectBadNetwork,
      bRedirectWarnHighCPU: bRedirectWarnHighCPU
    };
    return zoomconfiguration.MeetingConfig_RedirectMeetingWarningMsg(opts);
  },
  enableToolTipsShow: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableToolTipsShow(opts);
  },
  enableClaimHostFeature: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableClaimHostFeature(opts);
  },
  enableAutoHideJoinAudioDialog: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableAutoHideJoinAudioDialog(opts);
  },
  alwaysShowIconOnTaskBar: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_AlwaysShowIconOnTaskBar(opts);
  },
  disableSplitScreenModeUIElements: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_DisableSplitScreenModeUIElements(opts);
  },
  setShowAudioUseComputerSoundChkbox: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_SetShowAudioUseComputerSoundChkbox(opts);
  },
  setShowCallInTab: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_SetShowCallInTab(opts);
  },
  setShowCallMeTab: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_SetShowCallMeTab(opts);
  },
  disableTopMostAttr4SettingDialog: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_DisableTopMostAttr4SettingDialog(opts);
  },
  enableGrabShareWithoutReminder: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableGrabShareWithoutReminder(opts);
  },
  enableShowShareSwitchMultiToSingleConfirmDlg: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableShowShareSwitchMultiToSingleConfirmDlg(opts);
  },
  disableFreeMeetingRemainTimeNotify: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_DisableFreeMeetingRemainTimeNotify(opts);
  },
  disableFreeMeetingRemainTimeNotify: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_DisableFreeMeetingRemainTimeNotify(opts);
  },
  hideChatItemOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideChatItemOnMeetingUI(opts);
  },
  hideRecordItemOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideRecordItemOnMeetingUI(opts);
  },
  hideUpgradeFreeMeetingButton: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideUpgradeFreeMeetingButton(opts);
  },
  setShowInviteDlgTabPage: function (tabPage, bShow) {
    let opts = {
      tabPage: tabPage,
      bShow: bShow
    };
    return zoomconfiguration.MeetingConfig_SetShowInviteDlgTabPage(opts);
  },
  setShowH323SubTabPage: function (tabPage, bShow) {
    let opts = {
      tabPage: tabPage,
      bShow: bShow
    };
    return zoomconfiguration.MeetingConfig_SetShowH323SubTabPage(opts);
  },
  hideUpgradeWarningMsgForFreeUserWhenSchedule: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideUpgradeWarningMsgForFreeUserWhenSchedule(opts);
  },
  hideSwitchCameraButton: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideSwitchCameraButton(opts);
  },
  hideCopyUrlOnInviteWindow: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideCopyUrlOnInviteWindow(opts);
  },
  hideCopyInvitationOnInviteWindow: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideCopyInvitationOnInviteWindow(opts);
  },
  hideKeypadButtonOnMeetingWindow: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideKeypadButtonOnMeetingWindow(opts);
  },
  hideRemoteControlOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideRemoteControlOnMeetingUI(opts);
  },
  hideQAOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HideQAOnMeetingUI(opts);
  },
  hidePollOnMeetingUI: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_HidePollOnMeetingUI(opts);
  },
  enableInputMeetingPasswordDlg: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableInputMeetingPasswordDlg(opts);
  },
  enableInputMeetingScreenNameDlg: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableInputMeetingScreenNameDlg(opts);
  },
  redirectWebinarNeedRegister: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectWebinarNeedRegister(opts);
  },
  redirectEndOtherMeeting: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_RedirectEndOtherMeeting(opts);
  },
  enableForceAutoStartMyVideoWhenJoinMeeting: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableForceAutoStartMyVideoWhenJoinMeeting(opts);
  },
  enableForceAutoStopMyVideoWhenJoinMeeting: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_EnableForceAutoStopMyVideoWhenJoinMeeting(opts);
  },
  disableAutoShowSelectJoinAudioDlgWhenJoinMeeting: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_DisableAutoShowSelectJoinAudioDlgWhenJoinMeeting(opts);
  },
  disableRemoteCtrlCopyPasteFeature: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomconfiguration.MeetingConfig_DisableRemoteCtrlCopyPasteFeature(opts);
  },
  setShowVideoOptimizeChkbox: function (bShow) {
    let opts = {
      bShow: bShow
    };
    return zoomconfiguration.MeetingConfig_SetShowVideoOptimizeChkbox(opts);
  },
  getRequiredInfoType: function () {
    return zoomconfiguration.MeetingConfig_GetRequiredInfoType();
  },
  inputMeetingPasswordAndScreenName: function (meeting_Password, screenName) {
    let opts = {
      meeting_Password: meeting_Password,
      screenName: screenName
    };
    return zoomconfiguration.MeetingConfig_InputMeetingPasswordAndScreenName(opts);
  },
  inputMeetingIDAndScreenName: function (meetingID, screenName) {
    let opts = {
      meetingID: meetingID,
      screenName: screenName
    };
    return zoomconfiguration.MeetingConfig_InputMeetingIDAndScreenName(opts);
  },
  inputMeetingScreenName: function (screenName) {
    let opts = {
      screenName: screenName
    };
    return zoomconfiguration.MeetingConfig_InputMeetingScreenName(opts);
  },
  meetingPasswordAndScreenNameHandler_Cancel: function () {
    return zoomconfiguration.MeetingConfig_MeetingPasswordAndScreenNameHandler_Cancel();
  },
  getWebinarNeedRegisterType: function () {
    return zoomconfiguration.MeetingConfig_GetWebinarNeedRegisterType();
  },
  getWebinarRegisterUrl: function () {
    return zoomconfiguration.MeetingConfig_GetWebinarRegisterUrl();
  },
  releaseRegisterWebinarByUrl: function () {
    return zoomconfiguration.MeetingConfig_ReleaseRegisterWebinarByUrl();
  },
  inputWebinarRegisterEmailAndScreenName: function (email, screenName) {
    let opts = {
      email: email,
      screenName: screenName
    };
    return zoomconfiguration.MeetingConfig_InputWebinarRegisterEmailAndScreenName(opts);
  },
  cancelRegisterWebinarByEmail: function () {
    return zoomconfiguration.MeetingConfig_CancelRegisterWebinarByEmail();
  },
  disableConfidentialWatermark: function (bDisable) {
    let opts = {
      bDisable: bDisable
    };
    return zoomconfiguration.MeetingConfig_DisableConfidentialWatermark(opts);
  },
  disableAdvancedFeatures4GeneralSetting: function (bDisable) {
    let opts = {
      bDisable: bDisable
    };
    return zoomsetui.SettingUI_DisableAdvancedFeatures4GeneralSetting(opts);
  },
  disableAccountSettingTabPage: function (bDisable) {
    let opts = {
      bDisable: bDisable
    };
    return zoomsetui.SettingUI_DisableAccountSettingTabPage(opts);
  },
  confSettingDialogShownTabPage: function (number) {
    let opts = {
      number: number
    };
    return zoomsetui.SettingUI_ConfSettingDialogShownTabPage(opts);
  },
  queryOverallStatisticInfo: function () {
    return zoomsetstatistic.Setting_QueryOverallStatisticInfo();
  },
  queryAudioStatisticInfo: function () {
    return zoomsetstatistic.Setting_QueryAudioStatisticInfo();
  },
  queryVideoStatisticInfo: function () {
    return zoomsetstatistic.Setting_QueryVideoStatisticInfo();
  },
  queryShareStatisticInfo: function () {
    return zoomsetstatistic.Setting_QueryShareStatisticInfo();
  },
  enableAlwaysShowMeetingControls: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaccessibility.Setting_EnableAlwaysShowMeetingControls(opts);
  },
  isAlwaysShowMeetingControlsEnable: function (bEnable) {
    let opts = {
      bEnable: bEnable
    };
    return zoomsetaccessibility.Setting_IsAlwaysShowMeetingControlsEnable(opts);
  },
  enableZoomAuthRealNameMeetingUIShown: function (b_enable) {
    let opts = {
      b_enable: b_enable
    };
    return zoomsms.EnableZoomAuthRealNameMeetingUIShown(opts);
  },
  getResendSMSVerificationCodeHandler: function () {
    return zoomsms.GetResendSMSVerificationCodeHandler();
  },
  retrieve: function (country_code, phone_number) {
    let opts = {
      country_code: country_code,
      phone_number: phone_number
    };
    return zoomsms.Retrieve(opts);
  },
  retrieve_CancelAndLeaveMeeting: function () {
    return zoomsms.Retrieve_CancelAndLeaveMeeting();
  },
  getReVerifySMSVerificationCodeHandler: function () {
    return zoomsms.GetReVerifySMSVerificationCodeHandler();
  },
  verify: function (country_code, phone_number, verification_code) {
    let opts = {
      country_code: country_code,
      phone_number: phone_number,
      verification_code: verification_code
    };
    return zoomsms.Verify(opts);
  },
  verify_CancelAndLeaveMeeting: function () {
    return zoomsms.Verify_CancelAndLeaveMeeting();
  },
  getSupportPhoneNumberCountryList: function () {
    return zoomsms.GetSupportPhoneNumberCountryList();
  },
  setDefaultCellPhoneInfo: function (country_code, phone_number) {
    let opts = {
      country_code: country_code,
      phone_number: phone_number
    };
    return zoomsms.SetDefaultCellPhoneInfo(opts);
  },
  canStartRecording: function (cloud_recording, userid) {
    let opts = {
      cloud_recording: cloud_recording,
      userid: userid
    };
    return zoomrecording.CanStartRecording(opts);
    return ret;
  },
  startRecording: function () {
    if (this.canStartRecording(false, 0) == ZoomSDKError.SDKERR_SUCCESS) {
      return zoomrecording.StartRecording();
    }
  },
  stopRecording: function () {
    return zoomrecording.StopRecording();
  },
  canAllowDisAllowLocalRecording: function () {
    return zoomrecording.CanAllowDisAllowLocalRecording();
  },
  startCloudRecording: function () {
    if (this.canStartRecording(true, 0) == ZoomSDKError.SDKERR_SUCCESS) {
      return zoomrecording.StartCloudRecording();
    }
  },
  stopCloudRecording: function () {
    return zoomrecording.StopCloudRecording();
  },
  isSupportLocalRecording: function (userid) {
    let opts = {
      userid: userid
    };
    return zoomrecording.IsSupportLocalRecording(opts);
  },
  allowLocalRecording: function (userid) {
    let opts = {
      userid: userid
    };
    return zoomrecording.AllowLocalRecording(opts);
  },
  disAllowLocalRecording: function (userid) {
    let opts = {
      userid: userid
    };
    return zoomrecording.DisAllowLocalRecording(opts);
  }
};

ipcMain.on('asynchronous-message', (event, arg1, arg2, arg3, arg4, arg5) => {
  let ret = functionObj[arg1](arg2, arg3, arg4, arg5);
  if (showLog) {
     console.log(arg1, ret)
  }
});

app.on('will-quit', function () {
  zoomsdk.CleanUPSDK();
  app.quit();
});

function createWindow() {
  // Create the browser window.
  showDomainwindow();
}

app.on('ready', createWindow);
