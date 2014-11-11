var formSubmit = function(theUrl, theForm){
  var data = {};
  for (var i = 0, ii = theForm.length; i < ii; ++i) {
    var input = theForm[i];
    if ( (input.name) && (input.value) ) {
      data[input.name] = input.value;
    }
  }
  if (! (data['file_content']) ){
    var error = "You must have content to submit."
    document.getElementById('output').textContent = error;
    console.log("error")
    return "Error"
  }
  var response = httpPost(theUrl, JSON.stringify(data));
  document.getElementById('output').innerHTML = String(response);
  console.log(response)
  return response;
};

var formPatch = function(theUrl, theForm){
  var data = {};
  var id = -1;
  for (var i = 0, ii = theForm.length; i < ii; ++i) {
    var input = theForm[i];
    if ( (input.name) && (input.value) ) {
      if (input.name != "id"){
        data[input.name] = input.value;
      }
      else{
        id = input.value;
      }
    }
  }
  var response = httpPatch(theUrl + id, JSON.stringify(data));
  document.getElementById('output').innerHTML = String(response);
  console.log(response)
  return response;
};

var formDelete = function(theUrl, theForm){
  var response = httpDelete(theUrl, theForm[0].value);
  document.getElementById('output').innerHTML = String(response);
  console.log(response)
  return response;
}

var formGet = function(theUrl, theForm){
  var response = httpGet(theUrl);
  document.getElementById('output').innerHTML = String(response);
  console.log(response)
  return response;
}
/*
//This is from one answer at StackOVerflow.
var form;
form.onsubmit = function (e) {
  // stop the regular form submission
  e.preventDefault();

  // collect the form data while iterating over the inputs
  var data = {};
  for (var i = 0, ii = form.length; i < ii; ++i) {
    var input = form[i];
    if (input.name) {
      data[input.name] = input.value;
    }
  }

  // construct an HTTP request
  var xhr = new XMLHttpRequest();
  xhr.open(form.method, form.action, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

  // send the collected data as JSON
  xhr.send(JSON.stringify(data));

  xhr.onloadend = function () {
    // done
  };
};
*/

//This is another answer. Below it is my modified version.
/*
function httpGet(theUrl)
{
  var xmlHttp = null;

  xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", theUrl, false );
  xmlHttp.send( null );
  return xmlHttp.responseText;
}
*/
var httpGet = function(theUrl)
{
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", theUrl, false);
  xmlHttp.send( );
  return xmlHttp.responseText;
}

var httpPost = function(theUrl,thedata)
{
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "POST", theUrl, false);
  xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xmlHttp.send( thedata );
  return xmlHttp.responseText;
}

var httpDelete = function(theUrl,thedata)
{
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "DELETE", theUrl + thedata, false);
  xmlHttp.send( );//thedata );
  return xmlHttp.responseText;
}

var httpPatch = function(theUrl,thedata)
{
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "PATCH", theUrl, false);
  xmlHttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xmlHttp.send( thedata );
  return xmlHttp.responseText;
}
