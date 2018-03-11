//all of this stuff is initialized on pageload
const REQUEST_WAIT_TIME = 1300; //time between requests in milliseconds
const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
const ORDER_REGEX = /transaction\/[1-9].........">([A-Za-z\n\w\s&#;|-]+)/g;
const ETSY_URL = "https://www.etsy.com/your/orders/sold/all?page=";
const request = require("request"); //https://github.com/request/request

let currentPageNum = -1;
let startAtPageNum = -1;
let stopAtPageNum = -1;
let numberOfPages = -1;
let emailStr = "";
let currentPageURL = "";
let uniqueEmails = [];
let emails = [];
let orders = [];

window.onload = (() => { 
  $("#scrapeEmailsButton").click(scrapeEmails);
  $("#downloadButton").click(downloadCSV);
  $("#progressDiv").hide();
  $("#downloadButtonRow").hide();
  $("#userMessageRow").hide();
});

//each of things are for when the user hits the 'start' button
/////////////////////////////////////////////////////////////////////////

function changeTabURLTo(URL){
  chrome.tabs.getSelected( tab => { 
    chrome.tabs.update(tab.id, { url: URL });
  });
}

function downloadCSV(){
  orders.forEach( (order, i, a) => { a[i] = order.split("\n")[1].replace("&#39;", "'") });
  uniqueEmails.forEach( (email,i) => emailStr += (email + "," + orders[i] + " \n"));
  let blob = new Blob([emailStr], { type: "text/plain" });
  let filename = "Etsy_Emails_Page_" + startAtPageNum.toString() + "-" + stopAtPageNum.toString() + ".csv";
	saveAs(blob, filename);
}

function scrapeEmails(){
  uniqueEmails = [];
  emailStr = "";
  $("#scrapeEmailsButton").hide();
  $("#progressDiv").show();
  setProgressBarPercentage(0);
  currentPageNum = parseInt( $("#startAtPageInput").val() );
  startAtPageNum = parseInt( $("#startAtPageInput").val() );
  stopAtPageNum = parseInt( $("#stopAtPageInput").val() );
  numberOfPages = stopAtPageNum - currentPageNum + 1;
  currentPageURL = ETSY_URL + currentPageNum;
  if(currentPageNum > stopAtPageNum){
    userMessage("Start page must be before stop page!");
    return;
  }
  setIntervalX(() => {
    changeTabURLTo(currentPageURL);
    if($("#emailOnlyRadio").prop("checked")) scrapePageRequest(currentPageURL, currentPageNum, false);
    else scrapePageRequest(currentPageURL, currentPageNum, true);
    currentPageNum++;
    currentPageURL = currentPageURL.split('=');
    currentPageURL[1] = currentPageNum.toString();
    currentPageURL = currentPageURL.join('=');
  }, REQUEST_WAIT_TIME, numberOfPages );
}

//invoke function 'callback' repeatedly with a period of 'delay', 'repetitions' times
function setIntervalX(callback, delay, repetitions) {
  let x = 0;
  let intervalID = window.setInterval( () => {
     callback();
     if (++x === repetitions) { 
        window.clearInterval(intervalID);
     }
  }, delay);
}

//create an http request for string 'url'
//set the progress bar based on integer 'pageNum'
//scrape order titles if withorders==true, otherwise don't get order titles
function scrapePageRequest(url, pageNum, withOrders){
  let pageOrders = [];
 request(url, (error, response, pageSource) => {
  if(!!!error){
    emails = pageSource.match(EMAIL_REGEX);
    pageOrders = pageSource.match(ORDER_REGEX);
    if(withOrders) pageOrders.forEach(o => orders.push(o));
    if(!!emails){
      emails.forEach( (e, i, a) => { 
        if(!uniqueEmails.includes(e) && e.split('@')[1] != "sentry.io"){
          uniqueEmails.push(e);
        }
        if(i == a.length-1){
          setProgressBarPercentage((pageNum/numberOfPages)*100);
        } 
      });
    }else{
      userMessage("No emails were found!");
    }
  }else{
    userMessage(error);
  } 
});
}

function setProgressBarPercentage(percentage){
  $("#progressBar")
    .attr("aria-valuenow", percentage )
    .css("width", ((percentage.toString() + "%")));
  if(percentage >= 100){
    $('#downloadButtonRow').show();
    $("#progressDiv").hide();
  } 
}

function userMessage(message){
  $("#userMessageRow").show();
  $("#userMessage").text(message);
  $("#userMessage").attr("color", "red");
}