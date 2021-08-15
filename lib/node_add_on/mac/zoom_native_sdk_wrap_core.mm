
#include "../zoom_native_sdk_wrap_core.h"
#include "../auth_service_wrap_core.h"
#include "Header_include.h"
#include "sdk_native_error.h"


ZNSDKError ZNativeSDKWrap::InitSDK(ZNInitParam &initParam)
{
    //set language
    nativeErrorTypeHelp help;
    
    ZoomSDKInitParams *params = [[[ZoomSDKInitParams alloc] init] autorelease];
    NSString *lanStr = help.ZNSDKLanaguageChange(initParam.langid);
    params.preferedLanguage = lanStr;
    
    params.enableLog = initParam.enable_log;
    params.logFileSize = initParam.logFileSize;
    ZoomSDKLocale local = help.ZNSDKAPPLocalType(initParam.locale);
    params.appLocale = local;
    params.needCustomizedUI = NO;
    
    if (!initParam.customLocalizationFilePath.empty() && initParam.customLocalizationFilePath.length() > 0) {
        params.customLocalizationFilePath = [NSString stringWithUTF8String:initParam.customLocalizationFilePath.c_str()];
    }

    if (!initParam.teamidentifier.empty() && initParam.teamidentifier.length() > 0) {
        params.teamIdentifier = [NSString stringWithUTF8String:initParam.teamidentifier.c_str()];
    }
    [[ZoomSDK sharedSDK] initSDKWithParams:params];
    
    if (initParam.domain.empty() || initParam.domain.length() <= 0)
        return ZNSDKERR_INVALID_PARAMETER;

    [[ZoomSDK sharedSDK] setZoomDomain:[NSString stringWithUTF8String:initParam.domain.c_str()]];
    
    [ZoomSDK sharedSDK].enableRawdataIntermediateMode = initParam.rawdataOpts.enableRawdataIntermediateMode;
    [ZoomSDK sharedSDK].shareRawDataMode = (ZoomSDKRawDataMemoryMode)initParam.rawdataOpts.shareRawdataMemoryMode;
    [ZoomSDK sharedSDK].audioRawDataMode = (ZoomSDKRawDataMemoryMode)initParam.rawdataOpts.audioRawdataMemoryMode;
    [ZoomSDK sharedSDK].videoRawDataMode = (ZoomSDKRawDataMemoryMode)initParam.rawdataOpts.videoRawdataMemoryMode;
    _z_auth_service_wrap.Init();
    _z_meeting_service_wrap.Init();
    _z_setting_service_wrap.Init();
    return ZNSDKERR_SUCCESS;
}

ZNSDKError ZNativeSDKWrap::CleanUPSDK()
{
    [[ZoomSDK sharedSDK] unInitSDK];
    return ZNSDKERR_SUCCESS;
}

ZoomSTRING ZNativeSDKWrap::GetVersion()
{
    NSString *versionNum = [[ZoomSDK sharedSDK] getSDKVersionNumber];
    if (!versionNum) {
        return "";
    }
    return versionNum.UTF8String;
}

ZAuthServiceWrap &ZNativeSDKWrap::GetAuthServiceWrap()
{
    return _z_auth_service_wrap;
}

ZMeetingServiceWrap &ZNativeSDKWrap::GetMeetingServiceWrap()
{
    return _z_meeting_service_wrap;
}


ZSettingServiceWrap &ZNativeSDKWrap::GetSettingServiceWrap()
{
    return _z_setting_service_wrap;
}

ZCustomizedResourceWrap &ZNativeSDKWrap::GetCustomizedResourceWrap()
{
    return _z_customized_resource_wrap;
}

ZDirectShareHelperWrap &ZAuthServiceWrap::GetDirectShareHelper()
{
    return m_direct_share_helper;
}

ZNativeRawAPIWrap& ZNativeSDKWrap::GetRawAPIWrap()
{
    return _z_raw_api_wrap;
}
ZNativeSDKWrap::ZNativeSDKWrap()
{
    
}

ZNativeSDKWrap::~ZNativeSDKWrap()
{
    _z_auth_service_wrap.Uninit();
    _z_meeting_service_wrap.Uninit();
    _z_setting_service_wrap.Uninit();
}

