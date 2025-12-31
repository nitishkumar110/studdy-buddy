const aiLogic = require('./ai-logic');

console.log("Testing AI Logic...");
const msg = "I need study materials for react";
const response = aiLogic.getResponse(msg, 'cs');

console.log("Response:", response);
