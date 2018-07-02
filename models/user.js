var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// conexión a la db
mongoose.connect("mongodb://localhost/fotos");

// Collections => tablas
// Documents => contenido de las tablas

/* Datos que podemos guardar en mongodb a través de mongoose
  String
  Number
  Date
  Buffer
  Boolean
  Mixed
  Objectid
  Array
  Por lo q veo, el schema es como el struct, con sus datos y tipos
  y el modelo, las funciones a utilizar con el schema especificado
  Toda la conexion con la base de datos se hace a través de modelos
  Para comunicarse con la base de datos mongodb hay que crear un modelo
  con su respectiva colección (collection)
*/

var sex = ["M", "F"];
var email_match = [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Email not valid"];
var password_validation = { // variable para validator personalizado
  // @function retorna un bool, en este caso, compara password_confirmation
  // con password. Si es igual devuelve true
  validator: function(p){ // p referencia al parametro password
    return this.password_confirmation == p;
  },
  message: "Password do not match"
}

var user_schema = new Schema({
  name: String,
  username: {type: String, required: "username is required"},
  // el validator de mongoose para String permite minlength, maxlength
  password: {
    type: String,
    minlength: [6, "password too short"],
    // introducimos un validator PERSONALIZADO en el parametro password
    // la lógica de la funcion validate se desarrolla arriba
    validate: password_validation
  },
  // este validator de mongoose es sobre el tipo de dato Number, que permite
  // introducir otras condiciones como min y máx con su respectivo mensaje
  age: {type: Number, min: [5,"do not reach minimum age"], max: 90},
  // el validator de mongoose nos da la opción de fijar el tipo de dato y el
  // requerimiento de que se introduzca ese dato. Si no se cumple, salta el
  // parámetro err que va en la función user.save(function(err)) para indicar
  // el error
  // en el caso de match, utiliza expresiones regulares para comprobar si la
  // estructura que queremos coincide con la introducida por el usuario
  email: {type: String, required: true, match: email_match},
  // otra opción:
  // email: {type: String, required: "Mail required"},
  // el mensaje de error manda ese mensaje en caso de no introducir el campo
  data_of_birth: Date,
  // en este caso el validator solo permitira valores "M" o "F". En este caso el
  // mensaje de error se escribe algo distinto
  sex: {type: String, enum:{values: sex, message: "Not valid option"}}
});


// el virtual sirve para coger atributos que no quieres guardar pero puedes necesitar
// en ciertos momentos, como la confirmación del pass, que sólo sirve para confirmar
// que se ha escrito bien, una vez hecho, no se vuelve a utilizar.
// Se hacen al nivel del schema
user_schema.virtual("password_confirmation").get(function(){
  return this.p_c;
}).set(function(password){
  this.p_c = password;
});

var User = mongoose.model("User",user_schema);

// exportamos el modelo para utiilizar en el resto del código
// qué exportamos lo define .User en este caso, que indica la porción
// de código que queremos exportar
module.exports.User = User;
