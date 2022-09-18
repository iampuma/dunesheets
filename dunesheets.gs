/**
 * Dunesheets allows you to fetch data from the Dune API in your Google Sheets.
 *
 * 8888888b.  888     888 888b    888 8888888888 
 * 888  "Y88b 888     888 8888b   888 888        
 * 888    888 888     888 88888b  888 888        
 * 888    888 888     888 888Y88b 888 8888888    
 * 888    888 888     888 888 Y88b888 888        
 * 888    888 888     888 888  Y88888 888        
 * 888  .d88P Y88b. .d88P 888   Y8888 888        
 * 8888888P"   "Y88888P"  888    Y888 8888888888   
 * - The data must flow.                                   
 */

var API_KEY = '--TOKEN--';
var DUNE_BASE_URI = 'https://api.dune.com/api/v1/';

var SUBQUERY_QUERY = 'query/{ID}/execute';
var SUBQUERY_EXECUTE = 'execution/{ID}/results';
var SUBQUERY_STATUS = 'execution/{ID}/status';

var DUNE = {
  'LATEST_PRICE': 1279471,
  'CONTRACT_ADDRESS': 1280024,
}

var API_STATES = [
  'QUERY_STATE_PENDING',
  'QUERY_STATE_EXECUTING',
];

/**
 * Get latest price of a token.
 * @param {_symbol} Token symbol.
 * @customfunction
 */
function DUNESHEETS_LATEST_PRICE(_symbol) {  
  var data = apiCall(DUNE.LATEST_PRICE, _symbol);
  if (data.length === 0) {
    return 'No price found';
  }
  return data[0].price;
}

/**
 * Get the contract address of a specified token.
 * @param {symbol} Token symbol.
 * @customfunction
 */
function DUNESHEETS_CONTRACT_ADDRESS(_symbol) {
  var data = apiCall(DUNE.CONTRACT_ADDRESS, _symbol);
  if (data.length === 0) {
    return 'No contract address found';
  }
  return data[0].contract_address;  
}

/**
 * DuneAPI client.
 */
function getClient(queryURI, queryId, body = "", method = 'GET') {  
  var params = {
    'method': method,
    'muteHttpExceptions': true,
    'headers': {
      'x-dune-api-key': API_KEY,
    }
  };
  if (body) {
    params.payload = JSON.stringify(body);
  }
  try {
    var URI = DUNE_BASE_URI + replaceTokens('ID' ,queryId, queryURI)
    var response = UrlFetchApp.fetch(URI, params);
  } catch (err) {
    throw 'Dune API request failed. ' + responseCode + ': ' + responseText;
  }
  var responseCode = response.getResponseCode();
  var responseText = response.getContentText();
  return responseText;
}

/**
 * Single API call by symbol.
 */
function apiCall(query, _symbol) {
  var response = getClient(SUBQUERY_QUERY, query, {'query_parameters':{'symbol':_symbol}}, 'POST');
  var data = JSON.parse(response);
  var executionId = data.execution_id;
  do {
    Utilities.sleep(500);
    var response = getClient(SUBQUERY_STATUS, executionId);
    var data = JSON.parse(response);    
  } while (API_STATES.includes(data.state));
  var content = getClient(SUBQUERY_EXECUTE, executionId);
  var data = JSON.parse(content);
  if (data.result.rows) {
    return data.result.rows;
  }
  return '';
}

/**
 * Token replace helper function.
 */
function replaceTokens(name, value, str){
  return str.replaceAll("{"+name+"}", value);
}
