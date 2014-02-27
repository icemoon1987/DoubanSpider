/** Douban spider */

var base_url = "http://www.douban.com/";

var start_url = base_url;

var page = require('webpage').create();
var fs = require('fs');
var loadInProgress = false;
var gapPeriod = 1000;
var testindex = 0;
var groupList = new Array();
var groupIndex = 0;
var topicList = new Array();
var topicIndex = 0;
var topicContentList = new Array();

var maxGroup = 3;
var maxTopic = 10;

page.onConsoleMessage = function(msg) {
	//console.log(msg);
};

page.onLoadStarted = function() {
    loadInProgress = true;
    console.log("load started");
};

page.onLoadFinished = function(status) {
    loadInProgress = false;
    console.log("load finished");
};

page.onUrlChanged = function() {
    console.log("url changed");
	/*
    if(flag){
        if(task_url.length > 0){
            pushNewStep();
            ////console.log("insert a new step");
            insertGapStep();
        }else{
            pushLastStep();
            flag = false;
        }
    }
	*/
};

var steps  = [
	OpenMainPage,
	//Login,
	WaitingForAGap,
	HandleMainPage,
	WaitingForAGap,
	GetGroups,
	WaitingForAGap

];


function OpenMainPage() {
	/** TODO: Use logged in cookie */
	console.log("Loading url: " + start_url);
	page.open( start_url, function(status) {
			
			if(status === "success")
			{
				console.log("Main page load success!");
			}
			else
			{
				console.log("Open Main page error!");
				phantom.exit();
			}

			});
}

/** TODO: Not used function */
function Login() {
	var needLogin = page.evaluate(function() {
			/** If there is a div with class login, we need to login first */
			if( $("div.login") != [] )
			{
				return true;
			}
			else
			{
				return false;
			}
	});

	if(needLogin)
	{
		console.log("Login...");
		page.evaluate(function() {
			$("div.login").find(":input#form_email").val("panwenhai1987@163.com");
			$("div.login").find(":input#form_password").val("PWH871117");
			$("div.login").find(":submit").click();
		});
	}
	else
	{
		console.log("Already logged in!");
	}
}

function WaitingForAGap() {
	console.log("Waiting for " + gapPeriod + " ms ......");
}


function HandleMainPage() {

	console.log("Handle Main Page ......");
	if( page.injectJs('jquery-1.10.2.min.js') == true )
	{
	}
	else
	{
		console.log("Inject jQuery Failed!");
	}

	page.evaluate(function() {
			$('input[name=q]').val("北京 租房");
			$("[value='搜索']").click();
			});
}


function GetGroups() {
	groupList = page.evaluate(function() {

			var groupList = new Array();

			$("div.result-list:first").find("div.result").each(function() {
				var group = new Object();
				group.name = $(this).find("div.content").find("a").text();
				group.url = $(this).find("div.content").find("a").attr("href");
				group.num = $(this).find("div.content").find("div.info").text();

				groupList.push(group);

				});
				
				return groupList;
			});

	console.log("Get " + groupList.length + " groups!");
	for(var i = 0 ; i < groupList.length ; ++i)
	{
		console.log("Group " + i + ": " + groupList[i].name + "	" + groupList[i].url + "	" + groupList[i].num);
	}

	if(groupList.length > 0)
	{
		steps.push(GetTopics);
		steps.push(WaitingForAGap);
	}
}


function GetTopics()
{
	var group;

	console.log("groupIndex = " + groupIndex);
	console.log("groupList.length = " + groupList.length);
	//if(groupIndex < groupList.length)
	if(groupIndex < maxGroup)
	{
		group = groupList[groupIndex];	
		groupIndex ++;
		steps.push(GetTopics);
		steps.push(WaitingForAGap);
	}
	else
	{
		steps.push(PrintTopics);
		steps.push(GetTopicContent);
		steps.push(WaitingForAGap);
		return;
	}

	console.log("Geting topics of group: " + group.name);
	page.open(group.url, function(status) {
			if(status === "success")
			{
				var tmpTopicList = page.evaluate(function () {
						var tmpTopicList = new Array();
						$("div#group-topics").find("table.olt").find("tr").find("td.title").each(function () {
							var topic = new Object();
							topic.title = $(this).find("a").text();
							topic.url = $(this).find("a").attr("href");
							tmpTopicList.push(topic);

							});
						return tmpTopicList;
					});
				console.log("Get " + tmpTopicList.length + " topics!");
				topicList = topicList.concat(tmpTopicList);
			}
			else
			{
				console.log("Get topic of group: " + group.name + " error!");
				//phantom.exit();
			}
			
			});	

}


function GetTopicContent() {
	var topic;

	console.log("topicIndex = " + topicIndex);
	console.log("topicList.length = " + topicList.length);
	//if(groupIndex < groupList.length)
	if(topicIndex < maxTopic) 
	{
		topic = topicList[topicIndex];	
		topicIndex ++;
		steps.push(GetTopicContent);
		steps.push(WaitingForAGap);
	}
	else
	{
		steps.push(PrintTopicContents);
		steps.push(StoreTopicContents);
		return;
	}

	console.log("Geting content of topic: " + topic.title);

	page.open(topic.url, function(status) {
			if(status === "success")
			{
				var topicContent = page.evaluate(function() {
					var topicContent = new Object();
					topicContent.group = $("div.title").find("a").text();
					topicContent.groupPeople = $("div.ft-members").find("i").text();
					topicContent.groupurl = $("div.title").find("a").attr("href");
					topicContent.title = $("div#content").find(":header:first").text();
					topicContent.time = $("span.color-green").text();
					topicContent.content = $("div.topic-content").find("p:first").text();

					return topicContent;
				});

				topicContent.url = topic.url;
				topicContentList.push(topicContent);

			}
			else
			{
				console.log("Get topic: " + topic.title + " error!");
			}

			});

}



function PrintTopics()
{
	console.log("Get " + topicList.length + " topics!");
	for(var i = 0 ; i < topicList.length ; i++)
	{
		console.log("Topic " + i + " : " + topicList[i].title + "	" + topicList[i].url);
	}
}


function PrintTopicContents()
{
	console.log("Get " + topicContentList.length + " topics!");
	for(var i = 0 ; i < topicContentList.length ; i++)
	{
		console.log("******************************************");
		console.log("Topic " + i);
		console.log("Group: " + topicContentList[i].group);
		console.log("Group People: " + topicContentList[i].groupPeople);
		console.log("Group Url: " + topicContentList[i].groupurl);
		console.log("Title: " + topicContentList[i].title);
		console.log("Url: " + topicContentList[i].url);
		console.log("Time: " + topicContentList[i].time);
		console.log("Content: " + topicContentList[i].content);
		console.log("******************************************");
	}
}


function StoreTopicContents() {
	f = fs.open("topic_content.txt", "w");
	f.writeLine(JSON.stringify(topicContentList));
	f.close();
}

interval = setInterval(function() {
    if (!loadInProgress && typeof steps[testindex] == "function")
	{
		console.log("*****************************");
        console.log("step " + (testindex + 1));
        steps[testindex]();
        /**
		f = fs.open("pages/step" + (testindex + 1) + ".html","w");
		f.write(page.content);
		*/
        testindex++;
    }

    if (typeof steps[testindex] != "function")
    {
        console.log("test complete!");
        phantom.exit();
    }
}, gapPeriod);


