var request = require('request');
var InNOut = require('in-n-out');
var gf = new InNOut.Geofence([
    [55.270987, -10.814900],
    [55.381886, -5.395924],
    [51.532291, -5.626637],
    [51.395400, -10.823170]
], 100);
var cheerio = require('cheerio');
//Database
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_DB_CONNECTION_STRING || 'mongodb://127.0.0.1/crossfit_ireland');
var Box = require('./box');


// This is a big array of id, lat, lng repeated in that pattern
var geoEndpoint = "http://map.crossfit.com/js/cfaffmapdata.js";
// This url is an endpoint that will return horrible html when you pass in a gym ID.
var queryEndpoint = "http://map.crossfit.com/affinfo.php?";

function _saveABox(boxObj) {
    var box = new Box();
    box.phone = boxObj.phone;
    box.address = boxObj.address;
    box.name = boxObj.name;
    box.lat = boxObj.lat;
    box.lng = boxObj.lng;

    box.save(function(err) {
        if (err) {
            console.log('SOmething has gone wrong!!');
            console.log(err);
        } else {
            console.log("SAVED!!");
        }
    });
}


function _submitRequest(boxObj) {

    var params = "a=" + boxObj.id + "&t=0";

    request(queryEndpoint + params, function(error, response, body) {
        $ = cheerio.load(body);
        boxObj.website = $('a').attr('href');
        boxObj.name = $('a').text();
        var contactNum = body.split("<br />");

        var address = "";
        for (var i = 1; i < contactNum.length; i++) {
            if (contactNum.length !== i + 1 && contactNum[i]) {
                address = address + contactNum[i];
            }
        }
        boxObj.address = address;
        boxObj.phone = contactNum[contactNum.length - 1];

        _saveABox(boxObj);
    });
}



request(geoEndpoint, function(error, response, body) {
    var str = body;
    str = str.split("=").pop();
    str = str.split(";")[0];
    var orgGeoArray = JSON.parse(str);


    var formattedGeoArray = [];
    for (var a = 0; a < orgGeoArray.length; a = a + 3) {
        var obj = {
            lat: orgGeoArray[a + 1],
            lng: orgGeoArray[a + 2],
            id: orgGeoArray[a]
        };
        formattedGeoArray.push(obj);
    }

    //Limit the results to just Ireland Boxes
    for (var i = formattedGeoArray.length - 1; i >= 0; i--) {
        var singleObj = formattedGeoArray[i];
        var insideFence = gf.inside([formattedGeoArray[i].lat, formattedGeoArray[i].lng]);
        if (insideFence) {
            _submitRequest(formattedGeoArray[i]);
        }
    }
});