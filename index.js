"use strict";

var path = require("path");
var exit = require("exit");

require("shelljs/global");

var validate = require("./validate");
var report = require("./report");

const NODE = "NODE", ATTR = "ATTR", COMMENT = "COMMENT";

var getLineArray = function(file) {
    var code;
    try {
        code = cat(file);
    } catch (err) {
        console.error("Can't open " + file);
        exit(1);
    }
    return code.split(/\r\n|\r|\n/);
};

var parseLineDescs = function(file, lines) {
    
    return lines.map(function(line, lineNum){

	if (!line || !line.trim()) {
	    return undefined;
	}
	
	return {
	    "file": file,
	    "lineNum": lineNum+1,
	    "content": line
	};
    }).filter(line => line);
};


var parseNodeAndAttr = function(results, lineDescObj) {
    //TODO: validate content's white space
    var content = lineDescObj.content.trim();
    var pos, pathContent;

    switch(true) {
    case content.charAt(0) === '[':
	if (!content.endsWith("]")) {
	    results.push(report.createError(lineDescObj, "Node should be end with ]"));
	} else {
	    pathContent = content.substr(1, content.length-2);
	    if (Object.keys(validate.option).includes("validatePath") && validate.validatePath(lineDescObj, pathContent, results)) {
	    	lineDescObj.path = pathContent;
	    }
	}
	lineDescObj.tag = NODE;
	break;
    case (content.charCodeAt(0)>64 && content.charCodeAt(0)<91) ||
	    (content.charCodeAt(0)>96 && content.charCodeAt(0)<123):
	lineDescObj.tag = ATTR;
	pos = content.indexOf('=');
	if (pos === -1) {
	    results.push(report.createError(lineDescObj, "Attribute line should have an \"=\""));
	} else {
	    lineDescObj.key = content.slice(0, pos);
	    lineDescObj.value = content.slice(pos + 1);
	}
	break;
    default:
	lineDescObj.tag = COMMENT;
    }
};

var buildNode = function(results, lineDescObjs) {
    var i = 0, nodes = [], currentNode, currentObj;
    
    for (i=0; i<lineDescObjs.length; i++) {
	currentObj = lineDescObjs[i];
	if (currentObj.tag === NODE) {
	    currentNode = currentObj;
	    currentNode.attrs = [];
	    currentNode.attr = {};
	    currentNode.node = currentNode;
	    nodes.push(currentNode);
	} else if (!currentNode) {
	    results.push(report.createError(lineDescObj, "Attribute line should be after a node"));
	} else {
	    currentNode.attrs.push(currentObj);
	    currentNode.attr[currentObj.key] = currentObj.value;
	    currentObj.node = currentNode;
	}
    }

    return nodes;
};

var buildNodeTree = function(results, nodes) {
    var rootNodes = [], i = 0;
    
};

var filterNodes = function(nodes, className) {
    var classNames;

    if (arguments.length > 2) {
	console.log(arguments.length);
	classNames = Array.prototype.slice.call(arguments, 1);
	console.log("classNames:" + classNames);
    } else if (arguments.length === 2) {
	if (Array.isArray(className)) {
	    classNames = className;
	} else {
	    classNames = [];
	    classNames.push(className);
	}
    }
    return nodes.filter(node => {
	return classNames.includes(node.attr['ClassName']);
    });
};

var findFileByRegex = function(dirname, regex) {
    return find(dirname).filter((file) => { return file.match(regex); });
};

let iumConfigFiles = [];

if (process.env.npm_package_config_ium_files) {
    iumConfigFiles = process.env.npm_package_config_ium_files.split(path.delimiter);
} else if (process.env.npm_package_config_ium_dir) {
    iumConfigFiles = findFileByRegex(process.env.npm_package_config_ium_dir, /\.config$/);
}

var lineDescObjs = [], results = [];

lineDescObjs = iumConfigFiles.map(file => {
    return parseLineDescs(file, getLineArray(file));
}).reduce((a, b) => a.concat(b));


lineDescObjs.forEach(lineDescObj => {
    parseNodeAndAttr(results, lineDescObj);
});

var nodes = buildNode(results, lineDescObjs);

let validateNodeFuncs = Object.keys(validate.option).filter(func => {
    return validate.option[func];
});

nodes.forEach(node => {
    validateNodeFuncs.forEach((func) => {
	validate[func](results, node);
    });
});
/*
filterNodes(nodes, "SNMEAdornmentRule", "NMEConversionRule").forEach(node => {
    validate.hasRootSNMEType(results, node);
});
*/
results.forEach(result => {
    report.error(result);
});
