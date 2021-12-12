const axios = require('axios');
const domino = require('domino');
const pageMetadataParser = require('page-metadata-parser');

// Get metadata for an URL
module.exports.getMetadata = async function(url) {
  const response = await axios.get(url, {responseType: 'text'});
  const responseDoc = domino.createWindow(response.data).document;
  const responseMetadata = pageMetadataParser.getMetadata(responseDoc, url);
  return responseMetadata;
};
