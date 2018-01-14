window.onload = onWindowLoad;

function onWindowLoad() { 
  document.getElementById("scrapeEmailsButton").onclick = scrapeEmails;
  document.getElementById("downloadButton").onclick = downloadCSV;
  document.getElementById("userMessage").innerText = 'FUCK';
  $('#downloadButton').hide();
}

/////////////////////////////////////////////////////////////////////////

const waitTime = 1000; //time between requests in milliseconds
const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;
const ETSY_URL = "https://www.etsy.com/your/orders/sold/all?page=";
const request = require("request"); //https://github.com/request/request

let currentPageURL = "";
let numberOfPages = -1;
let emails = [];
let emailStr = "";
let uniqueEmails = [];

function scrapeEmails(){
  uniqueEmails = [];
  chrome.tabs.getSelected(null, tab => currentPageURL = tab.url);
  if(currentPageURL.split('@')[1] != ETSY_URL) gotoEtsySoldOrderPage();
  numberOfPages = parseInt(document.getElementById("stopAtPageInput").value);
  let i = parseInt((currentPageURL.split('='))[1]);
  setIntervalX(() => {
    scrapePage(currentPageURL, i);
    i++;
    currentPageURL = currentPageURL.split('=');
    currentPageURL[1] = i.toString();
    currentPageURL = currentPageURL.join('=');
  }, waitTime, numberOfPages);
}

function scrapePage(url,i){
  request(url, (error, response, pageSource) => {
    if(!!!error){
      $("#progressBar").attr("aria-valuenow", (i/numberOfPages)*100 ).css("width", (((i/numberOfPages)*100).toString() + "%") );
      emails = pageSource.match(EMAIL_REGEX);
      if(!!emails) emails.forEach( e => { if(!uniqueEmails.includes(e) && e.split('@')[1] != "sentry.io") uniqueEmails.push(e) });
    }else{
      printError(error);
      console.log(error);
    }
  });
}

function printError(error){
  
}
function downloadCSV(){
  uniqueEmails.forEach(email => {emailStr += (email + '\n')});
	var blob = new Blob([emailStr], { type: "text/plain" });
	saveAs(blob, 'emailList.csv');
}

function setIntervalX(callback, delay, repetitions) {
  var x = 0;
  var intervalID = window.setInterval( () => {
     callback();
     if (++x === repetitions) {
        window.clearInterval(intervalID);
        $('#downloadButton').show();
     }
  }, delay);
}

function gotoEtsySoldOrderPage(){
  chrome.tabs.getSelected(null, tab => {
    chrome.tabs.update(tab.id, {url: (ETSY_URL + "1")});
  });
}