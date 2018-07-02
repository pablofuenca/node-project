var express = require("express");
var Image = require("./models/images");
var router = express.Router();
var image_finder_middleware = require("./middlewares/find_image");
var fs = require("fs");
var redis = require("redis");

var client = redis.createClient();

// como esta explicado en app.js, para acceder a esta ruta hay que acceder por
// /app/ porque alli hay un app.use("/app", router_app); que sumado a este "/",
// nos da la ruta /app/
router.get("/", function(req,res){
  Image.find({})
       .populate("creator")
       .exec(function(err, images){
         if(err) console.log(err);
         // este archivo estará en views
         res.render("app/home", {images: images});
       })

});

// vale para usar el middleware del find_image
router.all("/images/:id/*",image_finder_middleware);


// en esta app el usuario va a poder subir imagenes. vamos a rear la funcionalidad
// de la adiministracion de las imagenes (como subirlas, actualizarlas, eliminar...)
// para ello nos basaremos en la arquitectura REST, lo importante son los recursos,
// no las urls.
// este metodo va a servir para mostrar el formulario de crear una nueva imagen,
// no va a guardarla en la db.
router.get("/images/new", function(req,res){
  //console.log("new image");
  res.render("app/images/new");
});

// despliega formulario para editar imagen existente
router.get("/images/:id/edit", function(req,res){
  //Image.findById(req.params.id, function(req,res){

  // aqui haríamos un findById pero ya tenemos esta funcion en el middleware
  // que se llama find_images.js, por lo que aqui solo tenemos que hacer el render
  console.log("edita?");
  //console.log(res.locals);
  res.render("app/images/edit");
  //})
});

// Primero vamos a definir las acciones a ejecutar sobre este primer recurso, que son
// get, put y delete. Este primer recurso es una imagen individual /images/:id
router.route("/images/:id/")
  .get(function(req,res){
    //Image.findById(req.params.id, function(err,image){
    //console.log("mostrar imagen individual");
    res.render("app/images/show");
    //})
  })
  // esta ruta de put se ejecuta cuando estamos editando una imagen y le damos a save
  .put(function(req,res){
    //console.log(req);
    //Image.findById(req.params.id,function(err,image){
    console.log("guardar nueva imagen");
    // console.log(req.body);
    // console.log(res.locals);

    res.locals.image.title = req.body.title;
    res.locals.image.save(function(err){
      if(!err){
        console.log("guardar sin error");
        res.render("app/images/show");
      }else{
        console.log("guardar con errores");
        res.render("app/images/"+req.params.id+"/edit");
      }
    })
  //})
  })
  .delete(function(req,res){
    //eliminar imagenes
    console.log("Dentro de delete");
    // la ruta es la misma tanto para mostrar como para editar y eliminar (/images/:id),
    // solo cambiael verbo http con el cual se accede(get, put, delete)
    Image.findOneAndRemove({_id: req.params.id},function(err){
      if(!err){
        res.redirect("/app/images");
      }else{
        //console.log(err);
        res.redirect("/app/images"+req.params.id);
      }
    })
  });

// este segundo recurso es una collection de imagenes /imagenes
// Con el metodo post creamos una nueva imagen. En REST para crear un recurso nuevo
// individual se hace una peticion POST a la collection del recurso, por eso se crea
// aqui.
router.route("/images")
  .get(function(req,res){
    console.log("mostrar todas las imagenes");
    Image.find({creator: res.locals.user._id},function(err, images){
      if(err){
        console.log("hay error");
        res.redirect("/app");
        return;
      }
      //console.log(images);
      res.render("app/images/index",{images: images});
    });
  })
  .post(function(req,res){

    var extension = req.files.file.name.split(".").pop();
    var data = {
      title: req.body.title,
      creator: res.locals.user._id,
      extension: extension
    }
    var image = new Image(data);

    image.save(function(err){
      if(!err){

        var imgJSON = {
          "id": image._id,
          "title": image.title,
          "extension": image.extension
        };

        client.publish("images", JSON.stringify(imgJSON));
        fs.rename(req.files.file.path, "public/images/"+image._id+"."+extension);
        res.redirect("/app/images/"+image._id+"/");
      }
      else{
        res.render(err);
      }
    });
  });




// exportamos las rutas para que esten disponibles
module.exports = router;
