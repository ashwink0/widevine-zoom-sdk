
#include "../directshare_helper_wrap_core.h"
#import "Header_include.h"
#import "authServiceDelegate.h"


#pragma mark  DirectShare
ZDirectShareHelperWrap::ZDirectShareHelperWrap()
{
    m_pSink = 0;
}
ZDirectShareHelperWrap::~ZDirectShareHelperWrap()
{
    [[[[ZoomSDK sharedSDK] getPremeetingService] getDirectShareHelper] setDelegate:nil];
    m_pSink = 0;
}

void ZDirectShareHelperWrap::Init()
{
    
}

void ZDirectShareHelperWrap::Uninit()
{
    
}

void ZDirectShareHelperWrap::SetSink(ZNativeSDKDirectShareHelperWrapSink *pSink)
{

    [[[[ZoomSDK sharedSDK] getPremeetingService] getDirectShareHelper] setDelegate:[authServiceDelegate share]];
    m_pSink = pSink;
}

ZNSDKError ZDirectShareHelperWrap::CanStartDirectShare()
{
    ZoomSDKPremeetingService *pre = [[ZoomSDK sharedSDK] getPremeetingService];
    if (!pre) {
        return ZNSDKERR_SERVICE_FAILED;
    }
    ZoomSDKDirectShareHelper *handle = [pre getDirectShareHelper];
    if (!handle) {
        return ZNSDKERR_SERVICE_FAILED;
    }
    ZoomSDKError ret = [handle canDirectShare];
    nativeErrorTypeHelp  Help_type;
    return Help_type.ZoomSDKErrorType(ret);
}

ZNSDKError ZDirectShareHelperWrap::StartDirectShare()
{
    ZoomSDKPremeetingService *pre = [[ZoomSDK sharedSDK] getPremeetingService];
    if (!pre) {
        return ZNSDKERR_SERVICE_FAILED;
    }
    ZNSDKError  error = CanStartDirectShare();
    if (error != ZNSDKERR_SUCCESS) {
        return ZNSDKERR_WRONG_USEAGE;
    }
    ZoomSDKDirectShareHelper *handle = [pre getDirectShareHelper];
    if (!handle) {
        return ZNSDKERR_SERVICE_FAILED;
    }
    ZoomSDKError ret = [handle startDirectShare];
    nativeErrorTypeHelp  Help_type;
    return Help_type.ZoomSDKErrorType(ret);
}

ZNSDKError ZDirectShareHelperWrap::StopDirectShare()
{
    ZoomSDKPremeetingService *pre = [[ZoomSDK sharedSDK] getPremeetingService];
    if (!pre) {
        return ZNSDKERR_SERVICE_FAILED;
    }
    ZoomSDKDirectShareHelper *handle = [pre getDirectShareHelper];
    if (!handle) {
        return ZNSDKERR_SERVICE_FAILED;
    }
    ZoomSDKError ret = [handle stopDirectShare];
    nativeErrorTypeHelp  Help_type;
    return Help_type.ZoomSDKErrorType(ret);
}

bool ZDirectShareHelperWrap::IsDirectShareInProgress()
{
    DirectShareStatus status = [[authServiceDelegate share] getDirectShare];
    if (status == DirectShareStatus_InProgress) {
        return YES;
    }
    return NO;
}

ZNSDKError ZDirectShareHelperWrap::TryWithMeetingNumber(unsigned long long meetingNumber)
{
    DirectShareStatus status = [[authServiceDelegate share] getDirectShare];
    if (status == DirectShareStatus_WrongMeetingIDOrSharingKey || status == DirectShareStatus_NeedMeetingIDOrSharingKey || status == DirectShareStatus_NeedInputNewPairingCode) {

        ZoomSDKDirectShareHandler *handle = [[authServiceDelegate share] getDirectShareHandler];
        if (meetingNumber && handle != nil) {
            NSNumber *num = [NSNumber numberWithUnsignedLong:meetingNumber];
            NSString *number = [num stringValue];
            if (number != nil) {
                ZoomSDKError ret = [handle inputMeetingNumber:number];
                nativeErrorTypeHelp  Help_type;
                return Help_type.ZoomSDKErrorType(ret);
            }
        }
        return ZNSDKERR_INVALID_PARAMETER;
    }
    return ZNSDKERR_WRONG_USEAGE;
}

ZNSDKError ZDirectShareHelperWrap::TryWithPairingCode(ZoomSTRING pairingCode)
{
    DirectShareStatus status = [[authServiceDelegate share] getDirectShare];
    if (status == DirectShareStatus_WrongMeetingIDOrSharingKey || status == DirectShareStatus_NeedMeetingIDOrSharingKey || status == DirectShareStatus_NeedInputNewPairingCode) {
        
        ZoomSDKDirectShareHandler *handle = [[authServiceDelegate share] getDirectShareHandler];
        if (pairingCode.length() > 0 && handle != nil) {
            NSString *number = [NSString stringWithCString:pairingCode.c_str() encoding:NSUTF8StringEncoding];
            ZoomSDKError ret = [handle inputSharingKey:number];
            nativeErrorTypeHelp  Help_type;
            return Help_type.ZoomSDKErrorType(ret);
        }
        return ZNSDKERR_INVALID_PARAMETER;
    }
    return ZNSDKERR_WRONG_USEAGE;
    
}

ZNSDKError ZDirectShareHelperWrap::Cancel()
{
    ZoomSDKDirectShareHandler *handle = [[authServiceDelegate share] getDirectShareHandler];
    if (handle  == nil) {
        return  ZNSDKERR_SERVICE_FAILED;
    }
    ZoomSDKError ret = [handle cancel];
    nativeErrorTypeHelp  Help_type;
    return Help_type.ZoomSDKErrorType(ret);
    
}


void ZDirectShareHelperWrap::OnDirectShareStatusUpdate(ZNDirectShareStatus status)
{
    if (m_pSink) {
        m_pSink->OnDirectShareStatusUpdate(status);
    }
}

