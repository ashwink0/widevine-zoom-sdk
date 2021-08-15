#pragma once
#include "../common_include.h"
BEGIN_ZOOM_SDK_NAMESPACE
class IMeetingServiceWrap;
IMeetingChatController* InitIMeetingChatControllerFunc(IMeetingChatCtrlEvent* pEvent, IMeetingServiceWrap* pOwner);
void UninitIMeetingChatControllerFunc(IMeetingChatController* obj);
BEGIN_CLASS_DEFINE_WITHCALLBACK(IMeetingChatController, IMeetingChatCtrlEvent)
NORMAL_CLASS(IMeetingChatController)
INIT_UNINIT_WITHEVENT_AND_OWNSERVICE(IMeetingChatController, IMeetingServiceWrap)
virtual SDKError SetEvent(IMeetingChatCtrlEvent* pEvent)
{
	external_cb = pEvent;
	return SDKERR_SUCCESS;
}

//virtual SDKError SendChatMsgTo(wchar_t* content, unsigned int receiver, SDKChatMessageType type) = 0;
DEFINE_FUNC_3(SendChatMsgTo, SDKError, wchar_t*, content, unsigned int, receiver, SDKChatMessageType, type)
//virtual const ChatStatus* GetChatStatus() = 0;
DEFINE_FUNC_0(GetChatStatus, const ChatStatus*)
//virtual bool IsMeetingChatLegalNoticeAvailable() = 0;
DEFINE_FUNC_0(IsMeetingChatLegalNoticeAvailable, bool)
//virtual const wchar_t* getChatLegalNoticesPrompt() = 0;
DEFINE_FUNC_0(getChatLegalNoticesPrompt, const wchar_t*)
//virtual const wchar_t* getChatLegalNoticesExplained() = 0;
DEFINE_FUNC_0(getChatLegalNoticesExplained, const wchar_t*)
 
//virtual void onChatMsgNotifcation(IChatMsgInfo* chatMsg, const wchar_t* content = NULL) = 0;
CallBack_FUNC_2(onChatMsgNotifcation, IChatMsgInfo*, chatMsg, const wchar_t*, content)
//virtual void onChatStautsChangedNotification(ChatStatus* status_) = 0;
CallBack_FUNC_1(onChatStautsChangedNotification, ChatStatus*, status_)
END_CLASS_DEFINE(IMeetingChatController)
END_ZOOM_SDK_NAMESPACE