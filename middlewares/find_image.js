var Image = require("../models/images");
var owner_check = require("./image_permission");

module.exports = function(req,res,next){
  //console.log("estos se ejecuta antes");
  //console.log(req.params.id);
  //console.log("y despues");
  Image.findById(req.params.id)
    // con el populate queremos que solo pueda editar la imagen el usuario
    // que la ha subido
    .populate("creator")
    .exec(function(err,image){
      if(image != null && owner_check(image,req,res)){
        console.log("encontrada la imagen: "+image.title);
        //console.log(res.locals);
        res.locals.image = image;
        next();
      }
      else{
        console.log("imagen no encontrada");
        res.redirect("/app");
      }
    })
}
