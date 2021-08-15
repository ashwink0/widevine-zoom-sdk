const { ZoomSDK_LANGUAGE_ID, ZoomSDKError, ZNCustomizedLanguageType, ZoomAPPLocale, ZoomSDKVideoRenderMode, SDKRawDataMemoryMode
  , ZoomSDKVideoCaptureMethod, ZoomSDKRenderPostProcessing } = require('./settings.js');
const ZOOMAUTHMOD = require('./zoom_auth.js');
const ZOOMMEETINGMOD = require('./zoom_meeting.js');
const ZOOMSETTINGMOD = require('./zoom_setting.js');
const ZOOMRESOURCE = require('./zoom_customized_resource.js');
const ZOOMRAWDATA = require('./zoom_rawdata.js');
const ZOOMSMS = require('./zoom_sms_helper.js');
const os = require('os');
const platform = os.platform();
const arch = os.arch();
const messages = require('./electron_sdk_pb.js');

const ZoomSDK = (() => {
  let instance;
  /**
   * Zoom Electron Sdk
   * @module zoom_electron_sdk
   * @param {String} path zoomsdk.node path on win os or mac os
   * @return {ZoomSDK}
   */
  function init(opts) {
    // Private methods and variables
    let clientOpts = opts || {};
    let _path = clientOpts.path || (platform == 'darwin' ? './../sdk/mac/' : arch == 'x64' ? './../sdk/win64/' : './../sdk/win32/');
    let zoomnodepath = _path + 'zoomsdk.node';
    let requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
    let addon = requireFunc(zoomnodepath).exports();
    let _isSDKInitialized = false;

    return {
      // Public methods and variables
      /**
       * Initialize Zoom SDK.
       * @method InitSDK
       * @param {String} path [Required] sdk.dll path on win os or mac os.
       * @param {String} domain [Required]
       * @param {String} langname [Optional]
       * @param {String} langinfo [Optional]
       * @param {Number} langtype [Optional] ZNCustomizedLanguageType
       * @param {String} strSupportUrl [Optional]
       * @param {Number} langid [Optional] ZoomSDK_LANGUAGE_ID,
       * @param {Boolean} enable_log [Optional]
       * @param {Number} locale [Optional] see ZoomAPPLocale in setings.js
       * @param {Number} logfilesize [Optional] Size of a log file in M(megabyte). The default size is 5M. There are 5 log files in total and the file size varies from 1M to 50M.
       * @param {Boolean} enableGenerateDump [Optional]
       * @param {Boolean} permonitorAwarenessMode [Optional]
       * @param {Number} videoRenderMode [Optional]
       * @param {Number} videoRawdataMemoryMode [Optional]
       * @param {Number} shareRawdataMemoryMode [Optional]
       * @param {Number} audioRawdataMemoryMode [Optional]
       * @param {Boolean} enableRawdataIntermediateMode [Optional]
       * @param {Number} renderPostProcessing [Optional]
       * @param {Number} videoCaptureMethod [Optional]
       * @param {String} identifier [Optional] After you re-sign the SDK, you should set the team identifier of your certificate, Zoom will verify the certificate when loading. _teamIdentifier is subject.OU value of the signing certificate.
          only support for MAC platform
       * @param {String} customLocalizationFilePath [Optional] Set custom localizable string file path. only support for MAC platform
       * @return {Number} If the function succeed, the return value is SDKERR_SUCCESS.
	        Otherwise failed. To get extended error information, Defined in: {@link ZoomSDKError}
       */
      InitSDK: function (opts) {
        let clientOpts = opts || {};
        let path = clientOpts.path || '';
        let domain = clientOpts.domain || 'https://www.zoom.us';
        let langname = clientOpts.langname || '';
        let langinfo = clientOpts.langinfo || '';
        let langtype = Number(clientOpts.langtype) || ZNCustomizedLanguageType.ZN_CustomizedLanguage_None;
        let strSupportUrl = clientOpts.strSupportUrl || 'https://zoom.us';
        let langid = clientOpts.langid || ZoomSDK_LANGUAGE_ID.LANGUAGE_English;
        let enable_log = clientOpts.enable_log == undefined ? true: clientOpts.enable_log;
        let locale = Number(clientOpts.locale) || ZoomAPPLocale.ZNSDK_APP_Locale_Default;
        let logfilesize = Number(clientOpts.logfilesize) || 5;
        let enableGenerateDump = clientOpts.enableGenerateDump == undefined ? false : clientOpts.enableGenerateDump;
        let permonitorAwarenessMode = clientOpts.permonitorAwarenessMode == undefined ? true :clientOpts.permonitorAwarenessMode;
        let videoRenderMode = clientOpts.videoRenderMode || ZoomSDKVideoRenderMode.SDKVideoRenderMode_None;
        let videoRawdataMemoryMode = clientOpts.videoRawdataMemoryMode || SDKRawDataMemoryMode.SDKRawDataMemoryModeStack;
        let shareRawdataMemoryMode = clientOpts.shareRawdataMemoryMode || SDKRawDataMemoryMode.SDKRawDataMemoryModeStack;
        let audioRawdataMemoryMode = clientOpts.audioRawdataMemoryMode || SDKRawDataMemoryMode.SDKRawDataMemoryModeStack;
        let enableRawdataIntermediateMode = clientOpts.enableRawdataIntermediateMode || platform == 'darwin' ? false : true;
        let renderPostProcessing = clientOpts.renderPostProcessing || ZoomSDKVideoCaptureMethod.ZoomSDKVideoCaptureMethod_Auto;
        let videoCaptureMethod = clientOpts.videoCaptureMethod || ZoomSDKRenderPostProcessing.ZoomSDKRenderPostProcessing_Auto;
        let identifier = clientOpts.identifier;
        let customLocalizationFilePath = clientOpts.customLocalizationFilePath
        try {
          let InitSDKParams = new messages.InitSDKParams();
          InitSDKParams.setPath(path);
          InitSDKParams.setDomain(domain);
          InitSDKParams.setCustomizedlanguagename(langname);
          InitSDKParams.setCustomizedlanguageinfo(langinfo);
          InitSDKParams.setCustomizedlanguagetype(langtype);
          InitSDKParams.setStrsupporturl(strSupportUrl);
          InitSDKParams.setLangid(langid);
          InitSDKParams.setEnablelog(enable_log);
          InitSDKParams.setApplocale(locale);
          InitSDKParams.setLogfilesize(logfilesize);
          InitSDKParams.setEnablegeneraldump(enableGenerateDump);
          InitSDKParams.setPermonitorawarenessmode(permonitorAwarenessMode);
          InitSDKParams.setVideorendermode(videoRenderMode);
          InitSDKParams.setVideorawdatamemorymode(videoRawdataMemoryMode);
          InitSDKParams.setSharerawdatamemorymode(shareRawdataMemoryMode);
          InitSDKParams.setAudiorawdatamemorymode(audioRawdataMemoryMode);
          InitSDKParams.setEnablerawdataintermediatemode(enableRawdataIntermediateMode);
          InitSDKParams.setRenderpostprocessing(renderPostProcessing);
          InitSDKParams.setVideocapturemethod(videoCaptureMethod);
          InitSDKParams.setTeamidentifier(identifier);
          InitSDKParams.setCustomlocalizationfilepath(customLocalizationFilePath);
          let bytes = InitSDKParams.serializeBinary();
          let ret = addon.InitSDK(bytes);
          if (ZoomSDKError.SDKERR_SUCCESS == ret){
            _isSDKInitialized = true;
          } else {
            _isSDKInitialized = false;
          }
          return ret
        } catch (error) {
          return ZoomSDKError.SDKERR_INVALID_PARAMETER;
        }
      },
      /**
      * Get the version of Zoom SDK
      * @method GetZoomSDKVersion
      * @return {String} The version of Zoom SDK
      */
      GetZoomSDKVersion: () => {
        return addon.GetZoomSDKVersion();
      },
      /**
       * Clean up Zoom SDK.
       * @method CleanUPSDK
       * @return {Number} If the function succeed, the return value is SDKERR_SUCCESS.
	        Otherwise failed. To get extended error information, Defined in: {@link ZoomSDKError}
       */
      CleanUPSDK: function () {
        return addon.CleanUPSDK();
      },
      GetAuth: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMAUTHMOD.ZoomAuth.getInstance(clientOpts);
        }
        return null;
      },
      GetMeeting: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMMEETINGMOD.ZoomMeeting.getInstance(clientOpts);
        }
        return null;
      },
      GetSetting: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMSETTINGMOD.ZoomSetting.getInstance(clientOpts);
        }
        return null;
      },
      GetCustomizedResource: (opts) => {
        let clientOpts = opts || {};
        clientOpts.addon = addon;
        return ZOOMRESOURCE.ZoomCustomizedResource.getInstance(clientOpts);
      },
      RawData: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMRAWDATA.ZoomRawData.getInstance(clientOpts);
        }
        return null;
      },
      SMSHelper: (opts) => {
        if (_isSDKInitialized) {
          let clientOpts = opts || {};
          clientOpts.addon = addon;
          return ZOOMSMS.ZoomSMSHelper.getInstance(clientOpts);
        }
        return null;
      }
    };
  };

  return {
    getInstance: (opts) => {
      if (!instance) {
        instance = init(opts);
      }
      return instance;
    }
  };
})();

module.exports = {
  ZoomSDK: ZoomSDK
}
