const REQUEST_WAIT_TIME = 1300; //time between requests in milliseconds
const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
const ETSY_URL = "https://www.etsy.com/your/orders/sold/all?page=";
const request = require("request"); //https://github.com/request/request

let currentPageNum = -1;
let stopAtPageNum = -1;
let numberOfPages = -1;
let emailStr = "";
let currentPageURL = "";
let uniqueEmails = [];
let emails = [];

window.onload = (() => { 
  $("#scrapeEmailsButton").click(scrapeEmails);
  $("#downloadButton").click(downloadCSV);
  $("#showUserSettingsButton").click(userSettings.show);
  $("#hideUserSettingsButton").click(userSettings.hide);

  $("#downloadButtonRow").hide();
  $("#userMessageRow").hide();
  $("#userSettingsRow").hide();
});

/////////////////////////////////////////////////////////////////////////

function scrapeEmails(){
  initializeScrape();
  if(currentPageNum > stopAtPageNum){
    userMessage("Start page must be before stop page!");
    return;
  }
  changeTabURLTo(ETSY_URL + currentPageNum);
  if($("#emailOnlyRadio").prop("checked")){
    setIntervalX(() => {
      scrapePageRequest(currentPageURL, currentPageNum);
      gotoNextPage();
    }, REQUEST_WAIT_TIME, numberOfPages );
  }else if($("#emailAndOrderRadio").prop("checked")){
    userMessage("it go")
    setIntervalX(() => {
      chrome.tabs.getSelected( tab => { 
        console.log(tab);
        $('a').each(() => { console.log(this) });
      });
      gotoNextPage();
    }, REQUEST_WAIT_TIME*3, numberOfPages );
  }
}

function scrapePageDOM(){
  
  
}

function scrapePageRequest(url, pageNum){
  request(url, (error, response, pageSource) => {
    if(!!!error){
      setProgressBarPercentage((pageNum/numberOfPages)*100);
      emails = pageSource.match(EMAIL_REGEX);
      if(!!emails){
        emails.forEach( e => { 
          if(!uniqueEmails.includes(e) && e.split('@')[1] != "sentry.io") uniqueEmails.push(e) 
        });
      }else{
        userMessage("No emails were found! Check the console for more info");
        logErrorMessage();
      }
    }else{
      userMessage(error);
      logErrorMessage();
    } 
  });
}

function downloadCSV(){
  uniqueEmails.forEach(email => emailStr += (email + ' \n'));
  let blob = new Blob([emailStr], { type: "text/plain" });
  let filename = "Etsy_Emails_Page_" + startAtPage.toString() + "-" + stopAtPage.toString();
	saveAs(blob, filename);
}

function logErrorMessage(){
  
}

function userMessage(message){
  $("#userMessageRow").show();
  $("#userMessage").text(message);
  $("#userMessage").attr("color", "red");
}

function changeTabURLTo(URL){
  chrome.tabs.getSelected( tab => { 
    chrome.tabs.update(tab.id, { url: URL });
  });
}

function setProgressBarPercentage(percentage){
  $("#progressBar")
    .attr("aria-valuenow", percentage )
    .css("width", ((percentage.toString() + "%")));
  if(percentage >= 100){
    $('#downloadButtonRow').show();
  } 
}

function setIntervalX(callback, delay, repetitions) {
  let x = 0;
  let intervalID = window.setInterval( () => {
     callback();
     if (++x === repetitions) { 
        window.clearInterval(intervalID);
     }
  }, delay);
}

let userSettings = {
  show: () => {
    $("#userSettingsRow").show();
    $("#showUserSettingsButtonRow").hide();
  },
  hide: () => {
    $("#userSettingsRow").hide();
    $("#showUserSettingsButtonRow").show();
  }
}

function gotoNextPage(){
  currentPageNum++;
  currentPageURL = currentPageURL.split('=');
  currentPageURL[1] = currentPageNum.toString();
  currentPageURL = currentPageURL.join('=');
  changeTabURLTo(currentPageURL);
}

function initializeScrape(){
  uniqueEmails = [];
  $("#userMessageRow").hide();
  $("#downloadButtonRow").hide();
  setProgressBarPercentage(0);
  currentPageNum = parseInt( $("#startAtPageInput").val() );
  stopAtPageNum = parseInt( $("#stopAtPageInput").val() );
  numberOfPages = stopAtPageNum - currentPageNum + 1;
  currentPageURL = ETSY_URL + currentPageNum;
}