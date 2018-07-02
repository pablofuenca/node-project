var express = require("express");
var bodyParser = require("body-parser");
var User = require("./models/user").User;
var session = require("express-session");
var router_app = require("./routes_app"); // importamos las rutas modulares
var session_middleware = require("./middlewares/session");
// middleware para poder modificar los atributos que se mandan en una peticion
var methodOverride = require("method-override");
// middleware para parsear las requests
var formidable = require("express-form-data");
var RedisStore = require("connect-redis")(session);
var http = require("http");
var realtime = require("./realtime");

var app = express();

var server = http.Server(app);

var sessionMiddleware = session({
  store: new RedisStore({}),
  secret: "my super personal secret word"
});

realtime(server,sessionMiddleware)

app.use("/public",express.static('public'));
//para peticiones application/json
app.use(bodyParser.json());
// el extended define el algoritmo que va a hacer el parsing
// en false no se puede hacer parsing de parametros que se envien a través de
// POST o GET que no sean JSON
// Si es true se puede hacer parsin de mas cosas
app.use(bodyParser.urlencoded({extended: true}));


//- el metodo del formulario necesitamos que sea put, pues es para editar
//- la image, pero no se permite escribir method="PUT", por lo que se utiliza
//- method override. Para que funcione hay que instalar la dependencia method-override
// *** ver edit.jade
app.use(methodOverride("_method"));



app.use(sessionMiddleware);

// le indicamos que mantenga las extensiones de los archivos que vaya leyendo
// en el parse en la carpeta temporal donde lo alamacena
app.use(formidable.parse({ keepExtensions: true }));

// middleware para manejo de las sesiones con express-session lo definimos aqui
// Un parametro requerido es secret, que permite generar identificadores unicos
// para cada sesion. Otro es resave, que indica si hay q guardar la sesion en caso
// de modificacion. Lo usamos una vez el usuario se ha registrado, en el user.findOne

// rutas modulares, todas las rutas que requieran que el usuario este logueado,
// las vamos a colocar en /app/.. (por ejemplo) y las que no requieran que el usuario
// inicie sesion, iran en /.. Para ello creamos un archivo (routes_app.js)
app.set("view engine", "jade");

app.get("/", function(req,res){
  console.log(req.session.user_id);
  res.render("index");
});

app.get("/signup", function(req,res){
  User.find(function(err,doc){
    console.log(doc);
    res.render("signup");
  });
});

app.get("/login", function(req,res){
  res.render("login");
});

app.post("/users", function(req,res){

  // @objeto e instanciamiento se inicial una instancia del modelo. Creamos un nuevo objeto de User.
  // la Instancia recibe como parametro un objeto JSON con los atributos (email, password...)
  // este objeto user viene con metodos como save
  var user = new User({
                       email: req.body.email,
                       password: req.body.password,
                       password_confirmation: req.body.password_confirmation,
                       username: req.body.username
                     });

  console.log(user.password_confirmation);

  // // @metodo save. Recibe como param un callback (function(err)). La funcion callback
  // // se ejecutará una vez mogoose intente guardar el objeto en la db
  // // @callback. 3 argumentos: error, elemento a guardar y número de elementos a guardar
  // // err -> cualquier error
  // // elemento a guardar -> aquello que se ha guardado en la db (con el atributo _id y todo)
  // // num elementos -> puede ser mas de un elemento lo q se vaya a guardar
  // // el metodo .save es asincrono, por lo que si metemos una accion despues del metodo, puede
  // // que todavia no se haya ejecutado el callback
  // user.save(function(err){
  //   // @validator La function tiene un parametro err, que viene del validator, que
  //   // se definea nivel schema. Si el err contiene algun error de los definidos en
  //   // este casoen user.js, no se guardan los datos en la db
  //   if(err){
  //     console.log(String(err));
  //   }
  //   res.send("Guardamos tus datos");
  // });

  // la manera mas moderna de guardar en la db es utilizando promises, es mejor que
  // con callbacks asincronos. En lugar de devolver un callback, devuleve una promesa (.then()).
  // los errores se reciben como segundo parametro a la promesa.
  // la primera func se ejecuta si todo sale bien, la segunda si hay error
  user.save().then(function(us){
    res.send("user succesfully saved");
  },function(err){
    if(err){
      console.log(String(err));
      res.send("user cannot be saved");
    }
  });

});

// este post sera para la busqueda en la db de usuarios registrados (es el login)
app.post("/sessions", function(req,res){
  // // lo primer que se necesita es un modelo, ya existe, se llama User
  // // find devuelve una collection, array de documentos que cumplen la condicion
  // // el primer parametros es un query, el segundo los campos que queremos que nos devuelva
  // // y despues un callback, en este caso no hay segundo parametro
  // User.find({email: req.body.email, password:req.body.password},function(err,docs){
  //   console.log(docs);
  //   res.send("Hola q ase");
  // });

  // ahora tenemos el findOne que solo devuelve un docs de la db
  User.findOne({email:req.body.email,password:req.body.password}, function(err,user){
    // guardamos en la sesion creada en express-session lo que queramos, por ej. el userID
    // ese userId se guarda en el objeto session, de la sesion creada en el server
    req.session.user_id = user._id;
    res.redirect("/app");
  });


});

app.use("/app", session_middleware);

// montamos las rutas modulares importadas arriba. Ponemos un /app, por lo que
// para acceder a esta ruta habría que acceder a /app/
app.use("/app", router_app);

server.listen(8080);
