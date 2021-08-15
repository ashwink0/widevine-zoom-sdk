#include "meeting_chat_wrap.h"
#include "../meeting_service_wrap.h"
BEGIN_ZOOM_SDK_NAMESPACE
IMeetingChatController* InitIMeetingChatControllerFunc(IMeetingChatCtrlEvent* pEvent, IMeetingServiceWrap* pOwner)
{
	if (pOwner && pOwner->GetSDKObj())
	{
		ZOOM_SDK_NAMESPACE::IMeetingChatController* pObj = pOwner->GetSDKObj()->GetMeetingChatController();
		if (pObj)
		{
			pObj->SetEvent(pEvent);
		}
		return pObj;
	}

	return NULL;
}

void UninitIMeetingChatControllerFunc(IMeetingChatController* obj)
{
	if (obj)
	{
		obj->SetEvent(NULL);
	}
}

//virtual SDKError SendChatMsgTo(wchar_t* content, unsigned int receiver, SDKChatMessageType type) = 0;
IMPL_FUNC_3(IMeetingChatController, SendChatMsgTo, SDKError, wchar_t*, content, unsigned int, receiver, SDKChatMessageType, type, SDKERR_UNINITIALIZE)
//virtual const ChatStatus* GetChatStatus() = 0;
IMPL_FUNC_0(IMeetingChatController, GetChatStatus, const ChatStatus*, NULL)
//virtual bool IsMeetingChatLegalNoticeAvailable() = 0;
IMPL_FUNC_0(IMeetingChatController, IsMeetingChatLegalNoticeAvailable, bool, false)
//virtual const wchar_t* getChatLegalNoticesPrompt() = 0;
IMPL_FUNC_0(IMeetingChatController, getChatLegalNoticesPrompt, const wchar_t*, NULL)
//virtual const wchar_t* getChatLegalNoticesExplained() = 0;
IMPL_FUNC_0(IMeetingChatController, getChatLegalNoticesExplained, const wchar_t*, NULL)
END_ZOOM_SDK_NAMESPACE