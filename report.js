"use strict";

module.exports = {
    "createError": function(lineDescObj, message) {
	return {
	    "error": lineDescObj,
	    "message": message
	};
    },
    "error": function(error) {
	var lineDescObj = error.error;
	var message = error.message;
	console.error(lineDescObj.file + ", line " + lineDescObj.lineNum + ", " + message );
    },
};
