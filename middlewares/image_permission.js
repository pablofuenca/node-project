var Image = require("../models/images");

module.exports = function(image,req,res){
  //console.log(image);
  // True = tiene permisos
  // False = no los tiene
  if(req.method === "GET" && req.path.indexOf("edit") < 0){
    console.log("ver imagen");
    // ver la imagen, tiene permiso siempre si el metodo es GET (ver)
    // y el path es edit
    return true;
  }
  
  if(typeof image.creator == "undefined"){
    console.log("image creator undefined");
    return false;
  }

  if(image.creator._id.toString() == res.locals.user._id){
    console.log("usuario es el que ha subido la imagen");
    // el usuario subio la image
    return true;
  }
  return false;

}
