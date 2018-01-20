window.onload = onWindowLoad;

function onWindowLoad() { 
  $("#scrapeEmailsButton").click(scrapeEmails);
  $("#downloadButton").click(downloadCSV);
  $("#downloadButton").hide();
  $("#downloadButtonRow").hide();
  $("#userMessageRow").hide();
}

/////////////////////////////////////////////////////////////////////////

const waitTime = 1300; //time between requests in milliseconds
const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
const ETSY_URL = "https://www.etsy.com/your/orders/sold/all?page=";
const request = require("request"); //https://github.com/request/request

let startAtPage = -1;
let stopAtPage = -1;
let numberOfPages = -1;
let emailStr = "";
let currentPageURL = "";
let uniqueEmails = [];
let emails = [];

function scrapeEmails(){
  $("#userMessage").hide();
  $("#userMessageRow").hide();
  uniqueEmails = [];
  currentPageURL = ETSY_URL + $("#startAtPageInput").val();
  startAtPage = parseInt( $("#startAtPageInput").val() );
  stopAtPage = parseInt( $("#stopAtPageInput").val() );
  if(startAtPage >= stopAtPage){
    userMessage("Start page must be before stop page!");
    return;
  }
  chrome.tabs.getSelected( (tab) =>{
    chrome.tabs.update(tab.id, {url: (ETSY_URL + $("#startAtPageInput").val() )});
  });
  numberOfPages = stopAtPage - startAtPage;
  let i = startAtPage;
  setIntervalX(() => {
    scrapePage(currentPageURL, i);
    i++;
    currentPageURL = currentPageURL.split('=');
    currentPageURL[1] = i.toString();
    currentPageURL = currentPageURL.join('=');
  }, waitTime, (stopAtPage-startAtPage+1) );
}

function scrapePage(url,i){
  if(currentPageURL.split('=')[0] != ETSY_URL){
    userMessage("ERROR: tab did not update url properly")
  }
  request(url, (error, response, pageSource) => {
    if(!!!error){
      $("#progressBar").attr("aria-valuenow", (i/numberOfPages)*100 ).css("width", (((i/numberOfPages)*100).toString() + "%") );
      if((i/numberOfPages) == 1){
        $('#downloadButtonRow').show();
        $('#downloadButton').show();
      }
      emails = pageSource.match(EMAIL_REGEX);
      if(!!emails) emails.forEach( e => { if(!uniqueEmails.includes(e) && e.split('@')[1] != "sentry.io") uniqueEmails.push(e) });
    }else userMessage(error);
  });
}

function downloadCSV(){
  uniqueEmails.forEach(email => emailStr += (email + ' \n'));
  let blob = new Blob([emailStr], { type: "text/plain" });
  let filename = "Etsy_Sold_Order_Emails_Pages_" + startAtPage.toString() + "_to_" + stopAtPage.toString();
	saveAs(blob, filename);
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

function userMessage(message){
  $("#userMessageRow").show();
  $("#userMessage").show();
  $("#userMessage").text(message);
  $("#userMessage").attr("color", "red");
}