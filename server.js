var express = require('express');
var mongo = require('mongodb').MongoClient;
var app = express();
var dotenv=require("dotenv").config();
var https = require ("https");

const mongoUrl = process.env.MONGO_URL;
const googleApi = process.env.GOOGLE_API;
const googleKey = process.env.GOOGLE_KEY;
const googleUrl = "https://www.googleapis.com/customsearch/v1?key="+googleKey+"&cx="+googleApi+"&searchType=image&q=";//&lowRange

function parseGoogleSearch(search,res){
	let response=[];
	for (i in search)
	{
		let img={};
		img.url=search[i].link;
		img.snippet=search[i].snippet;
		img.thumbnail=search[i].image.thumbnailLink;
		img.context=search[i].image.contextLink;
		response.push(img)
	}
	res.send(response);
}

app.get('/api/imagesearch/:search(*)', function(req,res){
	let search=req.params.search;
	let offset=req.query.offset;
	let imageSearch = "";
	let time = new Date();

	if(offset) {
		imageSearch = googleUrl+search+"&lowRange="+offset;
	}
	else {
		imageSearch=googleUrl+search;
	}

	https.get(imageSearch, function(getRes){
		let body = "";

		getRes.on('data', function(chunk){
        body += chunk;
    });

    getRes.on('end', function(){
        let googleSearch = JSON.parse(body);
        parseGoogleSearch(googleSearch.items,res);
    });
	});

	mongo.connect(mongoUrl, function (err,db){
		if(err) throw err;
		let coll = db.collection("image_search");

		coll.insert({"term":search,"when":time}, function(err,result){
			if(err) throw err;
		});
		db.close();
	});
});

app.get('/api/latest/imagesearch/', function(req,res){
	mongo.connect(mongoUrl, function (err,db){
		if(err) throw err;
		let coll = db.collection("image_search");

		coll.find({},{_id:0}).sort({"when":-1}).limit(10).toArray(function(err,result){
			res.send(JSON.stringify(result));
		});
		db.close();
	});
});

app.listen(process.env.PORT || 3000, function(){
	console.log("Imagesearch running !");
});
