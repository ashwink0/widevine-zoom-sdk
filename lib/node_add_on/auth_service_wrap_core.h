#pragma once
#include "zoom_native_sdk_wrap_core_def.h"
#include "directshare_helper_wrap_core.h"
#include "zoom_sinks_wrap_class.h"

class ZAuthServiceWrap
{
public:
	ZAuthServiceWrap();
	virtual ~ZAuthServiceWrap();
	void Init();
	void Uninit();
	//
	void SetSink(ZNativeSDKAuthWrapSink* pSink);
	ZNSDKError AuthSDK(ZNAuthParam& authParam);
	ZNSDKError AuthSDK(ZNAuthContext& authContext);
	ZNSDKError Login(ZNLoginParam& loginParam);
	ZNSDKError Logout();
	ZNAuthResult GetAuthResult();
	ZNLOGINSTATUS GetLoginStatus();
	ZoomSTRING GenerateSSOLoginWebURL(ZoomSTRING prefix_of_vanity_url);
	ZNSDKError SSOLoginWithWebUriProtocol(ZoomSTRING uri_protocol);
	ZoomSTRING GetWebinalLegalNoticesPrompt();
	ZNWebinarLegalNoticesExplainedInfo GetWebinalLegalNoticesExplained();
	

	ZDirectShareHelperWrap& GetDirectShareHelper();

	void onAuthenticationReturn(ZNAuthResult authResult);
	void onLogout();
	void onZoomIdentityExpired();
	void onZoomAuthIdentityExpired();
	void onLoginReturnWithReason(ZNLOGINSTATUS ret, ZNLoginFailReason reason);
	
private:
	ZNativeSDKAuthWrapSink* m_pSink;
	ZDirectShareHelperWrap m_direct_share_helper;
};
