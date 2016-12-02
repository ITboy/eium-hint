"use strict";

var report = require("./report");

module.exports = {
    "option": {
	//func: isValidateNode
	//"validatePath": false,
	"hasRootSNMEType": true,
	"fullClassName": true,
    },
    "validatePath": function(lineDescObj, pathContent, results) {
	if (!/^\/([\-\_\.a-zA-Z0-9]+)?(\/[\-\_\.a-zA-Z0-9]+)*$/.test(pathContent)) {
	    results.push(report.createError(lineDescObj, "Node path is an invalid path"));
	    return false;
	} else {
	    return true;
	}
    },
    "hasRootSNMEType": function(results, node) {
	const requiredClassNames = ["SNMEAdornmentRule", "NMEConversionRule"];
	let className = node.attr["ClassName"];
	if (className && requiredClassNames.includes(className)) {
	    if (!Object.keys(node.attr).includes("SNMEType")) {
	        results.push(report.createError(node, "No SNMEType found"));
		return false;
	    }
	}
	return true;
    },
    "fullClassName": function(results, node) {
	let className = node.attr["ClassName"];

	if (className && !className.startsWith("com.")) {
	    results.push(report.createError(node, "ClassName should be a full classname"));
	    return false;
	}
	return true;
    },
};
