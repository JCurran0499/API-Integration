/*
John Curran

This is the script used to begin the integration of Abios API into the Stream Hatchet databse.
Some of the code has been altered for privacy and security. Redacted information includes MySQL
connection information and database table names.

This script is a set of functions that inserts data from the API into the database.
Some of the data includes esports tournaments, streams, and matches.
*/

const mysql = require('mysql');
const fetch = require("node-fetch");

var con = mysql.createConnection({
		 // REDACTED
});


//insert tournament by id
async function insert_tournament(tournament_id, token) {

	var url = 'https://api.abiosgaming.com/v2/tournaments/' + tournament_id + '?access_token=' + token + '&with[]=series'
	let resp = await fetch(url)
	let data = await resp.json()

	con.connect(function(err) {
		if (err) throw err;
		var query = 'INSERT INTO REDACTED (name, start_date, end_date, description, region, location, game_id_abios, logo) VALUES ('
		  query += "'" + data["title"] + "'"
		  query += ", '" + data["start"] + "'" + ", '" + data["end"] + "'"
		  query += ", '" + data["short_description"] + "'"
		  query += ", '" + data["country"]["region"]["name"] + "'"
		  query += ", '" + data["city"] + "'"
		  query += ", " + data["game"]["id"]
		  query += ", '" + data["images"]["default"] + "'"
		  
		  query += ")"
		  con.query(query, function (err, result, fields) {
			if (err) throw err;
			
		  });
	});
}

//insert streams by match
async function insert_streams(series_id, token) {
	
	var url = 'https://api.abiosgaming.com/v2/series/' + series_id + '?access_token=' + token + '&with[]=casters&with[]=matches'
	let resp = await fetch(url)
	let data = await resp.json()
	
	
	con.connect(function(err) {
		if (err) throw err;
		var query = 'INSERT INTO REDACTED (platform, url, start_date, end_date, tournament_id_abios) VALUES '

		  for (let i = 0; i < data["casters"].length - 1; i++) {
			  var platform = data["casters"][i]["streams"]["platform"]["name"]
			  
			  query += "("
			  query += "'" + platform + "'"
			  query += ", '" + data["casters"][i]["url"] + "'"
			  query += ", '" + data["start"] + "'"
			  query += ", '" + data["end"] + "'"
			  query += ", " + data["tournament_id"]
			  query += ")"
			  
			  if (i < data["casters"].length - 2) {
				  query += ", "
			  }
		  }		  
		  
		  con.query(query, function (err, result, fields) {
			if (err) throw err;			
		  });
	});
}

//inserts events by id
async function insert_events(series_id, token) {
	
	var url = 'https://api.abiosgaming.com/v2/series/' + series_id + '?access_token=' + token + '&with[]=matches'
	let resp = await fetch(url)
	let data = await resp.json()
	
	con.connect(function(err) {
		if (err) throw err;
		var query = 'INSERT INTO REDACTED (start_date, end_date, team1_abios, team2_abios, abios_result) VALUES '
		
		var team1 = data["rosters"][0]["id"]
		var team2 = data["rosters"][1]["id"]
		if (data[team1.toString()] > data[team2.toString()]) {
			var winner = team1
		}
		else {
			var winner = team2
		}
		
		query += '('
		query += "'" + data["start"] + "'"
		query += ", '" + data["end"] + "'"
		query += ", " + data["rosters"][0]["team_id"]
		query += ", " + data["rosters"][1]["team_id"]
		query += ", " + winner
		query += ")"
		
		
		  con.query(query, function (err, result, fields) {
			if (err) throw err;			
		  });
	});
}


//insert every event in a tournament
async function insert_events_by_tournament(tournament_id, token) {
	
	var url = 'https://api.abiosgaming.com/v2/series?access_token=' + token + '&is_over=true&tournaments[]=' + tournament_id
	let resp = await fetch(url)
	let first_page = await resp.json()
	data = []
	
	for(let i = 1; i <= first_page["last_page"]; i++) {
		var page = await fetch(url + '&page=' + i)
		data = data + page["data"]
	}
	
	for (let i = 0; i < data.length; i++) {
		await insert_events(data[i]["id"], token)
	}
}
