
/*Mora da se aktivira ruta u app.js, ako se ne aktivira node app nece raditi*/
var imageRouter = require('./routes/image-route');
app.use('/', imageRouter);
