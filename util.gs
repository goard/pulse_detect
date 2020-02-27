function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

//Функция предназначена для передачи аргументов объекта в веб
function render(file,argsObject){
  var tmp = HtmlService.createTemplateFromFile(file);
  if(argsObject){
    var keys = Object.keys(argsObject);
    keys.forEach(function(key){
      tmp[key] = argsObject[key];
    });
  }// END IF
  return tmp.evaluate().setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
