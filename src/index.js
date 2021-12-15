const app = require('./app');
const port = process.env.PORT;

app.listen(() => {
    console.log('Server is up on port ', port)
});