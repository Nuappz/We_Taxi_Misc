var http = require('http');
var mysql = require('mysql');
var util = require('util');
var url = require('url');
 
var singer_name, currentmodif, lastmodif, request, response, time_of_request;
 
var requests=[];
 
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'polling',  //mysql database to work with (optional)
});
connection.connect(); //connect to mysql
 
connection.query('SELECT * FROM musics WHERE id=1', function(err, rows, fields) {
  if (err) throw err;
 
  singer_name=rows[0].singer_name;
  currentmodif=rows[0].time;
});
 
http.createServer(function (req, res) {
    request = req;
    response = res;
    time_of_request = new Date().getTime();
 
    requests.push({
        response: response,
        timestamp: new Date().getTime()
    });
    if(req.method=='GET'){
        var url_parts = url.parse(req.url,true);
        lastmodif = url_parts.query.timestamp;
    }
 
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
 
}).listen(8000);
 
var response;
 
function checkupdate() { 
 
    var expiration = new Date().getTime() - 30000;
 
    for (var i = requests.length - 1; i >= 0; i--) {
        if (requests[i].timestamp < expiration) {
            // return response
            response = requests[i].response;
            response.write('_testcb(\'ok\')', 'utf8');
            response.end();
        }
    }
 
    connection.query('SELECT * FROM musics WHERE id=1', function(err, rows, fields) {
        if (err) throw err;
        currentmodif=rows[0].time;
 
        if (lastmodif == undefined)
            lastmodif = 0;
 
        console.log("singer_name:"+ singer_name +"currentmodif: "+currentmodif+" lastmodif: "+lastmodif);
 
        if (currentmodif > lastmodif){
            singer_name=rows[0].singer_name;  
            var _arrays = {'singer_name': singer_name, 'time': currentmodif} 
            var data = "_testcb"+"("+JSON.stringify(_arrays)+")";
 
            //response.writeHead(200, { 'content-type':'application/json',
                                  //  'Access-Control-Allow-Origin' : '*'});
            response = requests[i].response;
            response.end(data); 
        }
 
    });
};
 
setInterval(checkupdate, 2000);