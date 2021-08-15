
#import "authServiceDelegate.h"
#include "../zoom_node_addon.h"
#include "../auth_service_wrap_core.h"
extern  ZNativeSDKWrap _g_native_wrap;
@implementation authServiceDelegate

+(authServiceDelegate *)share
{
    static authServiceDelegate *delegate = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        delegate = [[authServiceDelegate alloc] init];
    });
    return delegate;
}

-(instancetype)init
{
    self = [super init];
    if (self) {
        _authResult = ZNAUTHRET_NONE;
        _loginStatus = ZNLOGIN_IDLE;
        _directStatus = DirectShareStatus_None;
        return self;
    }
    return nil;
}

-(void)dealloc
{
    _authResult = ZNAUTHRET_NONE;
    _loginStatus = ZNLOGIN_IDLE;
    _directStatus = DirectShareStatus_None;
    [super dealloc];
}
- (void)onZoomSDKAuthReturn:(ZoomSDKAuthError)returnValue
{
    nativeErrorTypeHelp native_help;
    ZNAuthResult result = native_help.ZoomSDKAuthErrorTpye(returnValue);
    self.authResult = result;
    _g_native_wrap.GetAuthServiceWrap().onAuthenticationReturn(result);
}

- (void)onZoomSDKLoginResult:(ZoomSDKLoginStatus)loginStatus failReason:(ZoomSDKLoginFailReason)reason
{
    nativeErrorTypeHelp native_login_help;
    ZNLOGINSTATUS result = native_login_help.ZoomSDKLoginStatusType(loginStatus);
    nativeErrorTypeHelp help;
    ZNLoginFailReason failReason = help.ZNLoginFailReasonMap(reason);
    _g_native_wrap.GetAuthServiceWrap().onLoginReturnWithReason(result,failReason);
}

-(void)onZoomSDKLogout
{
    _g_native_wrap.GetAuthServiceWrap().onLogout();
}

-(void)onZoomIdentityExpired
{
    _g_native_wrap.GetAuthServiceWrap().onZoomIdentityExpired();
}

-(ZNAuthResult)getAuthResult
{
    return self.authResult;
}

-(ZNLOGINSTATUS)getLoginStatus
{
    return self.loginStatus;
}

-(void)onZoomAuthIdentityExpired
{
    _g_native_wrap.GetAuthServiceWrap().onZoomAuthIdentityExpired();
}

#pragma direct share
-(void)onDirectShareStatusReceived:(DirectShareStatus)status DirectShareReceived:(ZoomSDKDirectShareHandler *)handler
{
    nativeErrorTypeHelp help;
    ZNDirectShareStatus  ZNStatus = help.ZNSDKDirectShareStatus(status);
    self.directStatus = status;
    self.DirectShareHandler = handler;
    _g_native_wrap.GetAuthServiceWrap().GetDirectShareHelper().OnDirectShareStatusUpdate(ZNStatus);
}


-(DirectShareStatus)getDirectShare
{
    return self.directStatus;
}

-(ZoomSDKDirectShareHandler *)getDirectShareHandler
{
    return self.DirectShareHandler;
}

@end
