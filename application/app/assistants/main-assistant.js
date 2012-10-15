function MainAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

var _theController,
	_simpleViewScrollPosition,
	_rawViewScrollPosition;

MainAssistant.prototype.setup = function() {

// set up the raw view text box
	this.controller.setupWidget("txtWifiProfiles",
		this.attributes = {
			multiline: true
		},
		this.model = {
			value: "",
			disabled: true
		}
	);
	
//Setup the	simple view list - based on storedprofiles-assistant.js in com.palm.app.wifi
	this.controller.setupWidget('profileListWidget',
		this.dynamicListAttributes = { 
			itemTemplate: "main/profiles-item",
			swipeToDelete: false,
			fixedHeightItems: true
		}, 
		this.dynamicListModel = {
			listTitle: "Stored Profiles",
			items: []
		}
	);

	_theController = this.controller;
	
	//Setup the main menu - https://developer.palm.com/content/api/reference/mojo/classes/mojo-menu.html
	this.controller.setupWidget(Mojo.Menu.appMenu,
		this.attributes = {
		  omitDefaultItems: true
		},
		this.model = {
			visible: true,
			items: [
				{label: 'Email', command:'sendEmail'},
				{label: 'Send To Memo', command:'newMemo'},
				{label: 'Copy To Clipboard', command: 'copyToClipBoard'},
				{label: 'Preferences', command: 'do-myPrefs', disabled: true},
				{label: 'Help', command: 'do-myHelp', disabled: true}
		  ]
	}); 
	
// Set up the top (view) menu - based on lis-assistant.js from com.palm.app.contacts
	this.topMenuModel = {
		visible: true,
		items: [
			{
				label: "Simple / Raw",
				toggleCmd: "toggle-simple",
				items: [{
					label: "Simple",
					command: "toggle-simple",
					width: 160
				}, {
					label: "Raw",
					command: "toggle-raw",
					width: 160
				}]
			}
		]
	};
	this.controller.setupWidget(Mojo.Menu.viewMenu, undefined, this.topMenuModel);
	
	//Show simple view immediately - thats what we set above anyway
	showSimpleView();
	
//Setup the Command Menu - https://developer.palm.com/content/api/reference/mojo/classes/mojo-menu.html
	this.cmdMenuModel = {
		visible: true,
		items: [
			{icon: 'refresh', command:'reload'}
			//http://www.net-tech-group.com/pre/part_5.html
			//icons: stop,forward,refresh,search,new,attach,compose,conversation,delete,file,forward-email,info,priority,reply-all,reply,save,send,sync,edit-profile,make-vip,new-contact,remove-vip,down
		]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, undefined, this.cmdMenuModel); 
	
	//Load the profiles immediately
	getWifiProfileList();
}

MainAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


MainAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

MainAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}

MainAssistant.prototype.handleCommand = function(event) {
	if(event.type == Mojo.Event.command) {
		switch(event.command)
		{
			case 'copyToClipBoard':
				Utils.sendToClipBoard(getWidgetElement('txtWifiProfiles').mojo.getValue(), 'Profiles copied', 'wpe-profiles', _theController);
			break;

			case 'sendEmail':
				Utils.sendToEmail('Wifi Profiles', getWidgetElement('txtWifiProfiles').mojo.getValue());
			break;
			
			case 'newMemo':
				Utils.sendToMemo(getWidgetElement('txtWifiProfiles').mojo.getValue());
			break;
			
			case 'reload':
				getWifiProfileList();
			break;
			
			case 'toggle-simple':
				showSimpleView();
			break;
			
			case 'toggle-raw':
				showRawView();
			break;
		}
	}
}

function getWidgetElement(elementId){
	return _theController.get(elementId);
}

function showSimpleView(){
	_rawViewScrollPosition = _theController.sceneScroller.mojo.getState();
	swapControls('profileListWidget', 'txtWifiProfiles', true, _simpleViewScrollPosition);
}

function showRawView(){
	_simpleViewScrollPosition = _theController.sceneScroller.mojo.getState();
	swapControls('txtWifiProfiles', 'profileListWidget', true, _rawViewScrollPosition);
}

//Based on PersonListWidget.js in contacts.ui
function swapControls(elementIdToShow, elementIdToHide, useTransition, state) {
	var elementToShow = getWidgetElement(elementIdToShow),
		elementToHide = getWidgetElement(elementIdToHide),
		transition;
	
	if (useTransition) {
		transition = _theController.prepareTransition(Mojo.Transition.crossFade, false);
	}
	
	//Mojo.Dom.show(elementToShow);
	//Mojo.Dom.hide(elementToHide);
	//Mojo view.js just uses the show() and hide() functions
	elementToShow.show();
	elementToHide.hide();
	_theController.showWidgetContainer(elementToShow);
	_theController.hideWidgetContainer(elementToHide);

	if (state) {
		_theController.sceneScroller.mojo.setState(state);
	}
	
	if (transition) {
		transition.run();
	}
};

//Based on storedprofiles-assistant.js in com.palm.app.wifi
function getWifiProfileList(){
	var req = new Mojo.Service.Request("palm://com.palm.wifi/", {
			method: 'getprofilelist',
			parameters: {},
			onSuccess: function(response) {
				if (response) {
					populateList(response);
					populateTextBox(JSON.stringify(response, null, "\t"));
				} else {
					populateTextBox("Extract Wifi Profile failed. Why?!");
				}
			},
			onFailure: function(response) {
				populateTextBox("Extract Wifi Profile failed " + JSON.stringify(response, null, "\t") + "");
			}
		});
}

function populateTextBox(content){
	getWidgetElement('txtWifiProfiles').mojo.setValue(content);
}

//Based on storedprofiles-assistant.js in com.palm.app.wifi
function populateList(payload){
	var subset = [];
	var item, security;
	var list = getWidgetElement('profileListWidget');                                                                                              
              
	if (payload.returnValue === true)
	{
		var i = 0;
		for (i = 0; i < payload.profileList.length; i++)
		{
			if (payload.profileList[i].wifiProfile.security)
			{
				security = payload.profileList[i].wifiProfile.security.securityType;
					switch(security){
						case "enterprise":
						security = $L("Enterprise");
						break;
						case "wep":
						security = $L("WEP");
						break;
						case "wpa-psk":
						security = $L("WPA-personal");
						break;
						case "wapi-cert":
						security = $L("WAPI Enterprise");
						break;
						case "wapi-psk":
						security = $L("WAPI-personal");
						break;
					}
				item = {"ssid":payload.profileList[i].wifiProfile.ssid.replace(/</g,'&lt;').replace(/>/g,'&gt;'),
						"securityType":security,
						"passKey":payload.profileList[i].wifiProfile.security.simpleSecurity.passKey
						};
			} else {
				item = {"ssid":payload.profileList[i].wifiProfile.ssid.replace(/</g,'&lt;').replace(/>/g,'&gt;')
						};
			}
			subset.push(item);
		}
		list.mojo.noticeUpdatedItems(0, subset);
		list.mojo.setLength(subset.length);                                                                                      
		list.mojo.revealItem(0, false);                                        
	}
}

// INFO on controllers: http://webos101.com/Code_Snippets#Sense_a_press_on_the_gesture_area_.28meta_tap.29: