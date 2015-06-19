/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//used for caching
var feedCache = {};


// utilities 

// get current position in action list
var getPositionInActionsList = function(e) {
    var all = e.parentNode.parentNode.children;
    var current = e.parentNode;
    console.log("size: " + all.length);
    var index  = Array.prototype.indexOf.call(all, current);
    console.log("index: " + index);
    return index;
}

// clear form
$.fn.clearForm = function() {   
    return this.each(function() {     
        var type = this.type, tag = this.tagName.toLowerCase();     
        if (tag == 'form')       
            return $(':input',this).clearForm();     
        if (type == 'text' || type == 'password' || tag == 'textarea')       
            this.value = '';     
        else if (type == 'checkbox' || type == 'radio')       
            this.checked = false;     
        else if (tag == 'select')       
            this.selectedIndex = -1;   
    }); 
};

// on IntroPage show
var onIntroPageShow = function(e) {
    displayFeeds();
}

/*// on AddFeedForm submit
var onAddFeedFormSubmit = function(e) {
    console.log("add feed form submit fired !");
    handleAddFeed();
    return false;
}*/
var onAddFeedClick = function(e) {
    console.log("add feed click !");
    handleAddFeed();
    //return false;
}

// on AddFeedPage show
var onAddFeedPageShow = function(e) {
    console.log("add feed page show fired !");
    // set submit handler
    //$("#addFeedForm").submit(onAddFeedFormSubmit);
    // clears forms
    $("#addFeedForm").clearForm();
}

// on FeedPage show
var onFeedPageShow = function(e) {
    // get current feed
    query = localStorage["currentFeed"];
            
    //assume it's a valid ID, since this is a mobile app folks won't be messing with the urls, but keep
    //in mind normally this would be a concern
    var feeds = getFeeds();
    var thisFeed = feeds[query];
    $("h1", this).text(thisFeed.name);
    if (!feedCache[thisFeed.url]) {
        $("#feedcontents").html("<p>Fetching data...</p>");
        
        //now use Google Feeds API
        var feedServiceUrl = "https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&q=" + encodeURI(thisFeed.url) + "&callback=?";
        
        // on feed service return
        var onFeedServiceReturn = function (res, code) {
            //see if the response was good...
            if (res.responseStatus == 200) {
                feedCache[thisFeed.url] = res.responseData.feed.entries;
                displayFeed(thisFeed.url);
            } else {
                var error = "<p>Sorry, but this feed could not be loaded: < /p><p>" + res.responseDetails + "</p >";
                $("#feedcontents").html(error);
            }
        }
        
        $.get(feedServiceUrl, {}, onFeedServiceReturn, "json");
    } else {
        displayFeed(thisFeed.url);
    }
}

// on entry page show
var onEntryPageShow = function(e) {
    
    // get current entry index
    var entryIndex = localStorage["currentEntry"];
    console.log("onEntryPageShow entry index: " + entryIndex);
    
    // get current feed
    var currentFeed = localStorage["currentFeed"];
    var feeds = getFeeds();
    var feed = feeds[currentFeed];
    var entryUrl = feed.url;
    console.log("onEntryPageShow entry url: " + entryUrl);
    
    // get current entry
    var entry = feedCache[entryUrl][entryIndex];
    console.log("onEntryPageShow entry title: " + entry.title);
    console.log("onEntryPageShow entry content: " + entry.content);
    console.log("onEntryPageShow entry link: " + entry.link);
    $("h1", this).text(entry.title);
    $("#entrycontents", this).html(entry.content);
    $("#entrylink", this).attr("href", entry.link);
}

// set current feed in #intropage
var onFeedClick = function(e) {
    localStorage["currentFeed"] = getPositionInActionsList(e);
}

// set cuurent entry and url in #intropage
var onEntryClick = function(e) {
    
    var entry = getPositionInActionsList(e);
    console.log("onEntryClick entry index: " + entry);
    
    localStorage["currentEntry"] = entry;
}

// app init
var init = function() {
    //handle getting and displaying the intro or feeds
    $(document).on("pageshow", "#intropage", onIntroPageShow);
    
    //Listen for the addFeed Page so we can support adding feeds
    $(document).on("pageshow", "#addfeedpage", onAddFeedPageShow);
    
    //Listen for the Feed Page so we can displaying entries
    $(document).on("pageshow", "#feedpage", onFeedPageShow);
    
    //Listen for the Entry Page 
    $(document).on("pageshow", "#entrypage", onEntryPageShow);
}

// display feeds
function displayFeeds() { 
    var feeds = getFeeds();
    if (feeds.length == 0) {
        //in case we had one form before...
        $("#feedList").html("");
        $("#introContentNoFeeds").show();
    } else {
        $("#introContentNoFeeds").hide();
        var s = "";
        for (var i = 0; i < feeds.length; i++) {
            s += "<li data-icon='delete'><a href='#feedpage' onclick='onFeedClick(this)'>" + feeds[i].name + "</a><a href='#' onclick='handleDelFeed(this)'>Delete</a></li>";
        }
        $("#feedList").html(s);
        $("#feedList").listview("refresh");
    }
}

// display an feed
function displayFeed(url) { // UPDATE
    var entries = feedCache[url];
    var s = "<ul data-role='listview' data-inset='true' id='entrylist'>";
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        s += "<li><a href='#entrypage' onclick='onEntryClick(this)'>" + entry.title + "</a></li>";
    }
    s += "</ul>";
    //s += "<a href='#intropage' data-role='button' data-theme='b'>Cancel</a>";
    $("#feedcontents").html(s);
    $("#entrylist").listview();
}

//
// manage feeds
//
//
// get feeds list
function getFeeds() {
    if (localStorage["feeds"]) {
        return JSON.parse(localStorage["feeds"]);
    } else
        return [];
}

// add new feed
function addFeed(name, url) {
    var feeds = getFeeds();
    feeds.push({name: name, url: url});
    localStorage["feeds"] = JSON.stringify(feeds);
}

// delete feed by id
function removeFeed(id) {
    var feeds = getFeeds();
    feeds.splice(id, 1);
    localStorage["feeds"] = JSON.stringify(feeds);
    displayFeeds();
}

// handle add feed
function handleAddFeed() {
    console.log("add feed !");
    var feedname = $.trim($("#feedname").val());
    console.log("feedname: " + feedname);
    var feedurl = $.trim($("#feedurl").val());
    console.log("feedurl: " + feedurl);
    
    // basic error handling
    var errors = "";
    if (feedname == "")
        errors += "Feed name is required.\n";
    if (feedurl == "")
        errors += "Feed url is required.\n";
    if (errors != "") {
        //Create a PhoneGap notification for the error
        navigator.notification.alert(errors, function () {});
    } else {
        addFeed(feedname, feedurl);
        $.mobile.changePage($("#intropage"));
        //$.mobile.changePage($("index.html"));
    }
}

// handle delete feed in feed list
var handleDelFeed = function(e)
{
    removeFeed(getPositionInActionsList(e));
}
