#include "../auth_service_wrap_core.h"
#include "wrap/sdk_wrap.h"
#include "zoom_native_to_wrap.h"
#include "sdk_events_wrap_class.h"
#include "../zoom_native_sdk_wrap_core.h"

ZOOM_SDK_NAMESPACE::IAuthServiceWrap& g_auth_service_wrap = ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap();

ZAuthServiceWrap::ZAuthServiceWrap()
{
	SDKEventWrapMgr::GetInst().m_authServiceWrapEvent.SetOwner(this);
	m_pSink = 0;
}
ZAuthServiceWrap::~ZAuthServiceWrap()
{
	Uninit();
	m_pSink = 0;
	SDKEventWrapMgr::GetInst().m_authServiceWrapEvent.SetOwner(NULL);
}
void ZAuthServiceWrap::Init()
{
	ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().Init_Wrap();
	ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().SetEvent(&SDKEventWrapMgr::GetInst().m_authServiceWrapEvent);
}
void ZAuthServiceWrap::Uninit()
{
	ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().SetEvent(NULL);
	ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().Uninit_Wrap();
}
ZNSDKError ZAuthServiceWrap::AuthSDK(ZNAuthParam& authParam)
{
	ZOOM_SDK_NAMESPACE::AuthParam param;
	param.appKey = authParam.sdk_key.c_str();
	param.appSecret = authParam.sdk_secret.c_str();
	ZNSDKError err = Map2WrapDefine(ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().SDKAuth(param));
	return err;
}
ZNSDKError ZAuthServiceWrap::AuthSDK(ZNAuthContext& authContext)
{
	ZOOM_SDK_NAMESPACE::AuthContext context;
	if (!authContext.sdk_jwt_token.empty())
	{
		context.jwt_token = authContext.sdk_jwt_token.c_str();
		return Map2WrapDefine(ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().SDKAuth(context));
	}
	return ZNSDKERR_INVALID_PARAMETER;
}
ZNSDKError ZAuthServiceWrap::Login(ZNLoginParam& loginParam)
{
	ZOOM_SDK_NAMESPACE::LoginParam param;
	param.loginType = ZOOM_SDK_NAMESPACE::LoginType_Email;
	param.ut.emailLogin.userName = loginParam.user_name.c_str();
	param.ut.emailLogin.password = loginParam.psw.c_str();
	param.ut.emailLogin.bRememberMe = loginParam.remember_me;
	ZNSDKError err = Map2WrapDefine(ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().Login(param));
	return err;
}
void ZAuthServiceWrap::SetSink(ZNativeSDKAuthWrapSink* pSink)
{
	m_pSink = pSink;
}
void ZAuthServiceWrap::onAuthenticationReturn(ZNAuthResult authResult)
{
	if (m_pSink){
		m_pSink->onAuthenticationReturn(authResult);
	}
}

ZoomSTRING ZAuthServiceWrap::GenerateSSOLoginWebURL(ZoomSTRING prefix_of_vanity_url)
{
	ZoomSTRING ret = L"";
	const wchar_t* znWebUrl = ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().GenerateSSOLoginWebURL(prefix_of_vanity_url.c_str());
	if (znWebUrl)
	{
		ret = znWebUrl;
	}
	return ret;
}
ZNSDKError ZAuthServiceWrap::SSOLoginWithWebUriProtocol(ZoomSTRING uri_protocol)
{
	ZNSDKError err = Map2WrapDefine(ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().SSOLoginWithWebUriProtocol(uri_protocol.c_str()));
	return err;
}
void ZAuthServiceWrap::onLoginReturnWithReason(ZNLOGINSTATUS ret, ZNLoginFailReason reason)
{
	if (m_pSink)
	{
		m_pSink->onLoginReturnWithReason(ret, reason);
	}
}

ZNSDKError ZAuthServiceWrap::Logout()
{
	return Map2WrapDefine(ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().LogOut());
}
void ZAuthServiceWrap::onLogout()
{
	if (m_pSink)
	{
		m_pSink->onLogout();
	}
}
void ZAuthServiceWrap::onZoomIdentityExpired()
{
	if (m_pSink)
	{
		m_pSink->onZoomIdentityExpired();
	}
}
void ZAuthServiceWrap::onZoomAuthIdentityExpired()
{
	if (m_pSink)
	{
		m_pSink->onZoomAuthIdentityExpired();
	}
}
ZNAuthResult ZAuthServiceWrap::GetAuthResult()
{
	return Map2WrapDefine(ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().GetAuthResult());
}
ZNLOGINSTATUS ZAuthServiceWrap::GetLoginStatus()
{
	return  Map2WrapDefine(ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().GetLoginStatus());
}
ZDirectShareHelperWrap& ZAuthServiceWrap::GetDirectShareHelper()
{
	return m_direct_share_helper;
}
ZoomSTRING ZAuthServiceWrap::GetWebinalLegalNoticesPrompt()
{
	ZoomSTRING ret = L"";
	const wchar_t* znPrompt = ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().getWebinalLegalNoticesPrompt();
	if (znPrompt)
	{
		ret = znPrompt;
	}
	return ret;
}
ZNWebinarLegalNoticesExplainedInfo ZAuthServiceWrap::GetWebinalLegalNoticesExplained()
{
	ZNWebinarLegalNoticesExplainedInfo zn_explainedInfo;
	ZOOM_SDK_NAMESPACE::WebinarLegalNoticesExplainedInfo sdk_explainedInfo;
	bool bret = ZOOM_SDK_NAMESPACE::CSDKWrap::GetInst().GetAuthServiceWrap().getWebinalLegalNoticesExplained(sdk_explainedInfo);
	if (bret)
	{
		zn_explainedInfo.explained_content = sdk_explainedInfo.explained_content;
		zn_explainedInfo.url_register_account_owner = sdk_explainedInfo.url_register_account_owner;
		zn_explainedInfo.url_register_privacy_policy = sdk_explainedInfo.url_register_privacy_policy;
		zn_explainedInfo.url_register_terms = sdk_explainedInfo.url_register_terms;
	}
	return zn_explainedInfo;
}