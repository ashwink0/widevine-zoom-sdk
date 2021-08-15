const { ZoomSDKError } = require('./settings.js');

var ZoomPaymentReminder = (function () {
  let instance;

  /**
   * Zoom Upgrade Account
   * @module zoom_upgrade_account
   * @param {Function} onVerifySMSVerificationCodeResultNotification The callback of upgrading the free meeting.
   * @param {Function} onFreeMeetingUpgradeToGiftFreeTrialStart Callback function of starting to upgrade the free meeting by the gift link.
   * @param {Function} onFreeMeetingUpgradeToGiftFreeTrialStop Callback function of ending upgrade the free meeting by the gift link.
   * @param {Function} onFreeMeetingUpgradeToProMeeting Callback function of free meting upgrades successfully.
   * @return {zoomUpgradeAccount}
   */
  function init(opts) {
    var clientOpts = opts || {};
    // Private methods and variables
    var _addon = clientOpts.addon.GetMeetingConfigCtrl() || null;
    let _onFreeMeetingNeedToUpgrade = clientOpts.onFreeMeetingNeedToUpgrade || null;
    let _onFreeMeetingUpgradeToGiftFreeTrialStart = clientOpts.onFreeMeetingUpgradeToGiftFreeTrialStart || null;
    let _onFreeMeetingUpgradeToGiftFreeTrialStop = clientOpts.onFreeMeetingUpgradeToGiftFreeTrialStop || null;
    let _onFreeMeetingUpgradeToProMeeting = clientOpts.onFreeMeetingUpgradeToProMeeting || null;

    /**
      The callback of upgrading the free meeting.
      @event onFreeMeetingNeedToUpgrade
      @param {String} type Type of upgrading the free meeting, {@link FreeMeetingNeedUpgradeType}
      @param {String} gift_url Upgrade the free meeting by the gift link. When and only when the value of type_ is FreeMeetingNeedUpgradeType_BY_GIFTURL, this parameter is meaningful.
    */
    function onFreeMeetingNeedToUpgrade (type, gift_url) {
      if (_onFreeMeetingNeedToUpgrade) {
        _onFreeMeetingNeedToUpgrade(type, gift_url)
      }
    }

    /**
      Callback function of starting to upgrade the free meeting by the gift link.
      @event onFreeMeetingUpgradeToGiftFreeTrialStart
    */
    function onFreeMeetingUpgradeToGiftFreeTrialStart () {
      if (_onFreeMeetingUpgradeToGiftFreeTrialStart) {
        _onFreeMeetingUpgradeToGiftFreeTrialStart()
      }
    }

    /**
      Callback function of ending upgrade the free meeting by the gift link.
      @event onFreeMeetingUpgradeToGiftFreeTrialStop
    */
    function onFreeMeetingUpgradeToGiftFreeTrialStop () {
      if (_onFreeMeetingUpgradeToGiftFreeTrialStop) {
        _onFreeMeetingUpgradeToGiftFreeTrialStop()
      }
    }

    /**
      Callback function of free meting upgrades successfully.
      @event onFreeMeetingUpgradeToProMeeting
    */
    function onFreeMeetingUpgradeToProMeeting () {
      if (_onFreeMeetingUpgradeToProMeeting) {
        _onFreeMeetingUpgradeToProMeeting()
      }
    }

    if (_addon) {
      _addon.SetFreeMeetingNeedToUpgradeCB(onFreeMeetingNeedToUpgrade);
      _addon.SetFreeMeetingUpgradeToGiftFreeTrialStartCB(onFreeMeetingUpgradeToGiftFreeTrialStart);
      _addon.SetFreeMeetingUpgradeToGiftFreeTrialStopCB(onFreeMeetingUpgradeToGiftFreeTrialStop);
      _addon.SetFreeMeetingUpgradeToProMeetingCB(onFreeMeetingUpgradeToProMeeting);
    }

    return {
      /**
       * Set Free Meeting Need T oUpgrade Callback
       * @method MeetingConfig_SetFreeMeetingNeedToUpgradeCB
       * @param {Function} MeetingConfig_SetFreeMeetingNeedToUpgradeCB
       * @return {Boolean}
       */
      MeetingConfig_SetFreeMeetingNeedToUpgradeCB: function (onFreeMeetingNeedToUpgrade) {
        if (_addon && onFreeMeetingNeedToUpgrade && onFreeMeetingNeedToUpgrade instanceof Function) {
          _onFreeMeetingNeedToUpgrade = onFreeMeetingNeedToUpgrade;
          return true;
        }
        return false;
      },
      /**
       * Set Free Meeting Upgrade To Gift Free TrialStop Callback
       * @method MeetingConfig_SetFreeMeetingUpgradeToGiftFreeTrialStartCB
       * @param {Function} onFreeMeetingUpgradeToGiftFreeTrialStart
       * @return {Boolean}
       */
      MeetingConfig_SetFreeMeetingUpgradeToGiftFreeTrialStartCB: function (onFreeMeetingUpgradeToGiftFreeTrialStart) {
        if (_addon && onFreeMeetingUpgradeToGiftFreeTrialStart && onFreeMeetingUpgradeToGiftFreeTrialStart instanceof Function) {
          _onFreeMeetingUpgradeToGiftFreeTrialStart = onFreeMeetingUpgradeToGiftFreeTrialStart;
          return true;
        }
        return false;
      },
      /**
       * Set Free Meeting Upgrade To Gift Free TrialStop Callback
       * @method MeetingConfig_SetFreeMeetingUpgradeToGiftFreeTrialStopCB
       * @param {Function} onFreeMeetingUpgradeToGiftFreeTrialStop
       * @return {Boolean}
       */
      MeetingConfig_SetFreeMeetingUpgradeToGiftFreeTrialStopCB: function (onFreeMeetingUpgradeToGiftFreeTrialStop) {
        if (_addon && onFreeMeetingUpgradeToGiftFreeTrialStop && onFreeMeetingUpgradeToGiftFreeTrialStop instanceof Function) {
          _onFreeMeetingUpgradeToGiftFreeTrialStop = onFreeMeetingUpgradeToGiftFreeTrialStop;
          return true;
        }
        return false;
      },
      /**
       * Set Free Meeting Upgrade To ProMeeting Callback
       * @method MeetingConfig_SetFreeMeetingUpgradeToProMeetingCB
       * @param {Function} onFreeMeetingUpgradeToProMeeting
       * @return {Boolean}
       */
      MeetingConfig_SetFreeMeetingUpgradeToProMeetingCB: function (onFreeMeetingUpgradeToProMeeting) {
        if (_addon && onFreeMeetingUpgradeToProMeeting && onFreeMeetingUpgradeToProMeeting instanceof Function) {
          _onFreeMeetingUpgradeToProMeeting = onFreeMeetingUpgradeToProMeeting;
          return true;
        }
        return false;
      }
    }
  }
    return {
    getInstance: function (opts) {
      if (!instance) {
        instance = init(opts);
      }
      return instance;
    }
  }
 })();

module.exports = {
  ZoomPaymentReminder: ZoomPaymentReminder
};
