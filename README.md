# Etsy Email Scraper

tl;dr : If you make any changes you will need to repack all the node dependencies into a single .js file using the browserify tool. 

'''
npm install browserify -g
browserify popup.js -o bundle.js
'''

All of the dependencies are loaded in already. There is one non-node dependency which is filesaver.js. It is very simple: just a single saveAs() function which accepts javascript Blob objects and saves them to your computer. There are two node dependencies: require and request. Request is a simple api which lets you make http requests with a URL string. Require is used to inject request into the main javascript file popup.js without exposing itself to the global scope. Because both require and request have dependencies from node you will need to use a tool called browserify to pack all the dependencies into a single file (bundle.js).