const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const passport = require('passport');
const simpleflakes = require('simpleflakes');
const toml = require('toml');
const winston = require('winston');

const authentication = require('./authentication');
const routes = require('./routes');


// Main function
const main = async function() {
  // Load the settings
  const settingsFile = fs.readFileSync('settings.toml', {encoding: 'utf8'});
  const settings = toml.parse(settingsFile);

  // Create the logger
  const logger = winston.createLogger({
    level: settings?.logging?.level ?? 'verbose',
    format: winston.format.combine(
      winston.format.errors({stack: true}),
      winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS'}),
      winston.format.cli({level: true, colors: {debug: 'gray', verbose: 'gray', http: 'cyan', info: 'green', warn: 'yellow', error: 'red'}}),
      winston.format.printf(info => `[${info.timestamp}] ${info.level} ${info.message}`)
    ),
    transports: [new winston.transports.Console()],
    exitOnError: false
  });

  // Create the app
  const app = express();

  // Set the locals of the app
  app.locals.logger = logger;
  app.locals.mongodbUri = settings.mongodb.uri;
  app.locals.serverPort = settings.server.port ?? 8080;
  app.locals.serverAuthSecret = settings.server.authSecret;

  if (app.locals.mongodbUri === undefined)
    throw new Error("No mongodb.uri was defined in the settings");
  if (app.locals.serverAuthSecret === undefined)
    throw new Error("No server.authSecret was defined in the settings");

  app.locals.generateId = () => simpleflakes.simpleflake(Date.now(), undefined, Date.UTC(2020, 1, 1)).toString();
  app.locals.generateJwt = (user) => jwt.sign({sub: user._id}, app.locals.serverAuthSecret);

  // Create the database connection
  const databaseUri = settings?.mongodb?.uri;
  await mongoose.connect(databaseUri, {useUnifiedTopology: true, useNewUrlParser: true});
  logger.info(`Server connected to the database at "${databaseUri}"`);

  // Configure the authentication strategies
  passport.use('basic', authentication.basicStrategy(app));
  passport.use('jwt', authentication.jwtStrategy(app));

  // Add logging middleware to the app
  app.use(function(req, res, next) {
    app.locals.logger.http(`Request from ${req.ip}: "${req.method} ${req.originalUrl}"`);
    return next();
  });

  // Add the middleware to the app
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(passport.initialize());

  // Add the routes to the app
  routes(app);

  // Add error middleware to the app
  app.use(function(err, request, response, next) {
    app.locals.logger.error(`${err.name}: ${err.message}`);
    console.error(err);

    if (request.headersSent)
      return next(err);

    response.status(err.status ?? 500);
    response.json({error: err.name, message: err.message});
  });

  // Run the app
  const server = app.listen(app.locals.serverPort, () => logger.info(`Server listening on port ${app.locals.serverPort}`));

  process.on('SIGINT', () => {
    logger.info('Received SIGINT, closing the server...');
    server.close(() => logger.info('Server closed'));
    process.exit();
  });
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, closing the server...');
    server.close(() => logger.info('Server closed'));
    process.exit();
  });
}


// Execute the main function
if (require.main === module)
  main().catch(err => console.error(err));
