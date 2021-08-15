#pragma once
#include "zoom_native_sdk_wrap_core_def.h"

class ZSettingShareWrap
{
public:
	ZSettingShareWrap();
	virtual ~ZSettingShareWrap();
	void Init();
	void Uninit();

	ZNSDKError EnableAutoFitToWindowWhenViewSharing(bool bEnable);
	bool IsAutoFitToWindowWhenViewSharingEnabled();
	bool IsCurrentOSSupportAccelerateGPUWhenShare();
	ZNSDKError EnableAccelerateGPUWhenShare(bool bEnable);
	ZNSDKError IsAccelerateGPUWhenShareEnabled(bool& bEnable);
	ZNSDKError EnableRemoteControlAllApplications(bool bEnable);
	bool IsRemoteControlAllApplicationsEnabled();
};
