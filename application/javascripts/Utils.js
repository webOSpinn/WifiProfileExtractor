//Date Last Modified: 7/22/2012
//Used In: WifiProfileExtractor

var Utils = {}

//https://developer.palm.com/content/content/api/reference/mojo/classes/mojo-controller-stagecontroller.html
//Modeled after utility.js in Lumberjack
Utils.sendToClipBoard = function(content, message, category, controller){
	//http://webos101.com/Code_Snippets#Copying_Text_to_the_Clipboard
	controller.stageController.setClipboard(content,false);
	Mojo.Controller.appController.removeBanner(category);
	Mojo.Controller.getAppController().showBanner({messageText: message, icon: 'icon.png'}, {source: category});
}

//https://developer.palm.com/content/api/reference/application-apis/email.html
Utils.sendToEmail = function (subject, message){
	var req = new Mojo.Service.Request('palm://com.palm.applicationManager/', {
		method: 'open',
		parameters: {
			"id": "com.palm.app.email", 
			"params": {
				"summary":subject,
				"text":message
				}
			},
			onSuccess : function (e){ Mojo.Log.info("Open success, results="+JSON.stringify(e)); },
			onFailure : function (e){ Mojo.Log.info("Open failure, results="+JSON.stringify(e)); }
	});
}

//Inferred from the universal search action in com.palm.app.notes' appinfo.json
Utils.sendToMemo = function(content){
	var req = new Mojo.Service.Request('palm://com.palm.applicationManager/', {
		method: 'open',
		parameters: {
			"id": "com.palm.app.notes", 
			"params": {
				"text":content
				}
			},
			onSuccess : function (e){ Mojo.Log.info("Open success, results="+JSON.stringify(e)); },
			onFailure : function (e){ Mojo.Log.info("Open failure, results="+JSON.stringify(e)); }
	});
}