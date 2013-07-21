// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";
 
// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';
// Port where we'll run the websocket server
var webSocketsServerPort = 1337;
var PF = require('pathfinding');
var $ = require('jquery');
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
 
/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];
 
var spriteMap = [];
var pathMatrix = [];
var matrix = [];
var floorMatrix = [];
var skyMatrix = [];
var mapData = [];
var finder = new PF.AStarFinder();
var mapwidth;
var mapHeight;
/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
 
// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );
 
/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
 
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// Load map data
try{
    LoadMapData();
    console.log(spriteMap);
    console.log((new Date()) + ' Loaded map data.');
}
catch(e){
    console.log((new Date()) + ' Failed to load map data.');
}
 
// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');  
    console.log((new Date()) + ' Connection accepted.');       
    var connection = request.accept(null, request.origin);
    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            
            var data = JSON.parse(message.utf8Data);
            
            switch(data.cmd){

                case 'login':
                    console.log(data.name + " logged in");
                    var gameData = {
                        'cmd':      'login-response',
                        'name':     'Martin',
                        'level':    6,
                        'x':        512,
                        'y':        288,
                        'mapData':  mapData                        
                    }
                    connection.sendUTF(JSON.stringify(gameData));
                    break;

                case 'move':

                    var grid = new PF.Grid(mapwidth, mapHeight, pathMatrix);
                    var path = finder.findPath(data.x, data.y, data.moveToX, data.moveToY, grid);   
                    path.reverse();
                    path.pop();   

                    var gameData = {
                        'cmd':  'move-response',
                        'path': path
                    }

                    connection.sendUTF(JSON.stringify(gameData));
                    break;
            }

            
        }
    });
 
    // user disconnected
    connection.on('close', function(connection) {
        
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected."); 
        
    });
 
});



function LoadMapData(){    

    var fs = require('fs');
    fs.readFile( __dirname + '/saves/save.txt', function (err, data) {
        if (err) {
            throw err; 
        }
      
        mapData = $.parseJSON(data.toString());        
        matrix = mapData.TerrainMatrix;
        floorMatrix = mapData.FloorMatrix;
        skyMatrix = mapData.SkyMatrix; 
        mapwidth = matrix[0].length;
        mapHeight = matrix.length;
        pathMatrix = matrix;
        finder.allowDiagonal = true;
        finder.dontCrossCorners = true;       
    });    
} 