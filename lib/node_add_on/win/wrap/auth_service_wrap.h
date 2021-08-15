#pragma once
#include "common_include.h"
#include "directshare_helper_wrap.h"
BEGIN_ZOOM_SDK_NAMESPACE
ZOOM_SDK_NAMESPACE::IAuthService* InitIAuthServiceFunc(ZOOM_SDK_NAMESPACE::IAuthServiceEvent* pEvent);
void UninitIAuthServiceFunc(ZOOM_SDK_NAMESPACE::IAuthService* obj);

BEGIN_CLASS_DEFINE_WITHCALLBACK(IAuthService, IAuthServiceEvent)
STAITC_CLASS(IAuthService)
INIT_UNINIT_WITHEVENT(IAuthService)
//virtual SDKError SetEvent(IAuthServiceEvent* pEvent) = 0;
//DEFINE_FUNC_1(SetEvent, SDKError, IAuthServiceEvent*, pEvent)
virtual SDKError SetEvent(IAuthServiceEvent* pEvent)
{
	external_cb = pEvent;
	return SDKERR_SUCCESS;
}
//virtual SDKError SDKAuth(AuthParam& authParam) = 0;
DEFINE_FUNC_1(SDKAuth, SDKError, AuthParam&, authParam)

//virtual SDKError SDKAuth(AuthContext& authContext) = 0;
DEFINE_FUNC_1(SDKAuth, SDKError, AuthContext&, authContext)

//virtual AuthResult GetAuthResult() = 0;
DEFINE_FUNC_0(GetAuthResult, AuthResult)

//virtual const wchar_t* GetSDKIdentity() = 0;
DEFINE_FUNC_0(GetSDKIdentity, const wchar_t*)

//virtual SDKError Login(LoginParam& param) = 0;
DEFINE_FUNC_1(Login, SDKError, LoginParam&, param)

//virtual const wchar_t* GenerateSSOLoginWebURL(const wchar_t* prefix_of_vanity_url) = 0;
DEFINE_FUNC_1(GenerateSSOLoginWebURL, const wchar_t*, const wchar_t*, prefix_of_vanity_url)

//virtual SDKError SSOLoginWithWebUriProtocol(const wchar_t* uri_protocol) = 0;
DEFINE_FUNC_1(SSOLoginWithWebUriProtocol, SDKError, const wchar_t*, uri_protocol)

//virtual SDKError LogOut() = 0;
DEFINE_FUNC_0(LogOut, SDKError)

//virtual IAccountInfo* GetAccountInfo() = 0;
DEFINE_FUNC_0(GetAccountInfo, IAccountInfo*)

//virtual LOGINSTATUS GetLoginStatus() = 0;
DEFINE_FUNC_0(GetLoginStatus, LOGINSTATUS)
#if (defined UserInterfaceClass)
private:
	//virtual IDirectShareServiceHelper* GetDirectShareServiceHeler() = 0;
	DEFINE_FUNC_0(GetDirectShareServiceHeler, IDirectShareServiceHelper*)
public:
#define T_GetDirectShareServiceHeler _GetDirectShareServiceHeler
#else
#define T_GetDirectShareServiceHeler GetDirectShareServiceHeler
#endif

//virtual IDirectShareServiceHelper* GetDirectShareServiceHeler() = 0;
DEFINE_FUNC_AND_MEMBER(T_GetDirectShareServiceHeler, IDirectShareServiceHelperWrap)

//virtual const wchar_t* getWebinalLegalNoticesPrompt() = 0;
DEFINE_FUNC_0(getWebinalLegalNoticesPrompt, const wchar_t*)
//virtual bool getWebinalLegalNoticesExplained(WebinarLegalNoticesExplainedInfo& explained_info) = 0;
DEFINE_FUNC_1(getWebinalLegalNoticesExplained, bool, WebinarLegalNoticesExplainedInfo&, explained_info)

//virtual void onAuthenticationReturn(AuthResult ret)
CallBack_FUNC_1(onAuthenticationReturn, AuthResult,ret)
//virtual void onLogout() = 0;
CallBack_FUNC_0(onLogout)
//virtual void onZoomIdentityExpired() = 0;
CallBack_FUNC_0(onZoomIdentityExpired)
//virtual void onZoomAuthIdentityExpired() = 0;
CallBack_FUNC_0(onZoomAuthIdentityExpired)
//virtual void onLoginReturnWithReason(LOGINSTATUS ret, IAccountInfo* pAccountInfo, LoginFailReason reason) = 0;
CallBack_FUNC_3(onLoginReturnWithReason, LOGINSTATUS, ret, IAccountInfo*,pAccountInfo, LoginFailReason, reason)

END_CLASS_DEFINE(IAuthService)
END_ZOOM_SDK_NAMESPACE