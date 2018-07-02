var User = require("../models/user").User;

module.exports = function(req,res,next){
  if(!req.session.user_id){
    res.redirect("/login");
  }
  else{
    // podemos enviar en la respuesta variables que van a ir a todas las vistas
    // que pasaron por este middleware, por ejemplo, info del usuario
    User.findById(req.session.user_id, function(err,user){
      if(err){
        //console.log(err);
        res.redirect("/login");
      }else{
        // pasamos los datos del usuario logueado en la clave user
        //res.locals = { user: user };
        res.locals.user = user;
        next();
      }
    });
  }
}
