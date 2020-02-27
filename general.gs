var Route = {};
Route.path = function(route,callback){
  Route[route] = callback;
}

function doGet(e){
  Route.path("xml",loadXML);
  if(Route[e.parameters.v]){
    return Route[e.parameters.v]();
  }
  else {
    return render("test");
  }
  //var html = HtmlService.createTemplateFromFile("test").evaluate();
  //Logger.log(e);
  //return html;
}

function loadXML(){
   
   var tmp = HtmlService.createHtmlOutputFromFile('xml').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
   Logger.log(tmp)
   return tmp;
}
