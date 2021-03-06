var xlsx = require('node-xlsx');
var _ = require('lodash');
var Excel = require("exceljs");
var json2csv = require('json2csv');
var fs = require('fs');

// Parse xlsx file to generate [{title:'',dec:''},...] format output
var parseXlsx = function(file){
	var obj = xlsx.parse(file); // parses a file

	var result = _.map(obj[0].data, function(row) {
		return {
			title: row[0],
			dec: row[1],
		};
	});
	result = _.drop(result);
	return result;
}

var tSet = parseXlsx('data/T.xlsx');
var ntSet = parseXlsx('data/NT.xlsx');

// Walk over all records from NT and add to results
var results = _.map(ntSet, function(row) {
	return {
		ntTitle: row.title,
		ntDec: row.dec,
	};
});

// Walk over all T records and try to match against NT record
_.forEach(tSet, function(row) {
	var existingNt = _.find(results, {ntTitle: row.title});
	if (existingNt) { // Result set already exists in tSet
		results.tTitle = row.title;
		results.tDec = row.dec;
	} else { // Not found - create new right-hand-side record
		results.push({
			tTitle: row.title,
			tDec: row.dec,
		});
	}
});

// Compute the result
results = _.map(results, function(row) {
	if (_.isUndefined(row.tDec) || _.isUndefined(row.ntDec)) { // Left or right Dec is missing
		row.result = '';
	} else if (row.tDec == row.ntDec) { // Decisions agree
		row.result = '';
	} else { // Decisions disagree
		row.result = 'CONFLICT';
	}
	return row;
});

// Transer results to output.csv
var fields = ['ntTitle', 'ntDec', 'tTitle', 'tDec', 'result'];
json2csv({ data: results, fields: fields }, function(err, csv) {
	if (err) console.log(err);
	fs.writeFile('output.csv', csv, function(err) {
		if (err) throw err;
		console.log('file saved');
	});
});
