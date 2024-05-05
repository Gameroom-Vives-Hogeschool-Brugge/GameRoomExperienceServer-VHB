//imports
const express = require("express");
var bodyParser = require("body-parser");
const app = express();
const cors = require("cors")
const dotenv = require("dotenv");
const mongodb = require("mongodb");

//utils
const urlScraper = require("./utils/scraper.js");
const excelParser = require("./utils/excelParser.js");
const sendEmail = require("./utils/email");
const MongoDatabase = require("./utils/mongoDatabase.js");
const Encryptor = require("./utils/encryptor");
const Logger = require("./utils/logger");


//load cronjobs
require("./utils/cronJobs");

//load the environment variables
dotenv.config({
  path: "./keys.env",
});

let corsOptions = {};

//cors options
if (process.env.NODE_ENV == "production") {
  corsOptions = {
    origin: "http://localhost:8080",
    optionsSuccessStatus: 200,
  };
} else {
  corsOptions = {
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
  };
}

//middleware
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Set middleware of CORS 
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Private-Network", true);
  //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
  res.setHeader("Access-Control-Max-Age", 7200);

  next();
});

//routes
app.post("/test", async (req, res) => {
});

app.post("/login", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  scraper = new urlScraper();
  const encryptor = new Encryptor();
  const logger = new Logger("login.log");

  //decrypt the data
  const encryptedurl = req.body.encryptedLink;
  const url = encryptor.decrypt(encryptedurl);

  //check if the url is valid, otherwise send an error
  if (!scraper.checkValidUrl(url)) {
    logger.error("Foute URL: " + url);
    return res.status(400).send("Invalid URL");
  }

  //get cardnumber from url
  const cardNumber = url.split("/").pop();

  //get user by cardnumber
  const personFound = await mongo.getOnedocumentByFilter(
    { cardNumber: cardNumber },
    mongo.dbStructure.UserData.dbName,
    mongo.dbStructure.UserData.users
  );

  //check if user exists and is verified, otherwise check if the cardnumber is valid
  if (personFound && personFound.verified) {
    const dbName = mongo.dbStructure.UserData.dbName;
    const rolesCollection = mongo.dbStructure.UserData.roles;
    const typesCollection = mongo.dbStructure.UserData.types;

    //get type and role by id
    const typeObject = await mongo.getOnedocumentByFilter(
      { _id: personFound.type },
      dbName,
      typesCollection
    );
    const roleObject = await mongo.getOnedocumentByFilter(
      { _id: personFound.role },
      dbName,
      rolesCollection
    );
    const type = typeObject.type;
    const role = roleObject.role;

    //send data to frontend
    const dataToBeSend = {
      _id: personFound._id,
      firstName: personFound.firstName,
      lastName: personFound.lastName,
      idNumber: personFound.idNumber,
      type: type,
      role: role,
    };

    //encrypt the data and send it to the frontend
    const encryptedObject = encryptor.encryptObject(dataToBeSend);

    //log the user
    logger.info("Gebruiker ingelogd: " + JSON.stringify(dataToBeSend))

    return res.status(297).send(encryptedObject); // voor verwijzing naar persoonlijke pagina
  }

  //check if user exists and is not verified, otherwise send an error
  if (personFound && !personFound.verified) {
    logger.warn("Gebruiker nog niet geverifieerd: " + cardNumber);
    return res.status(296).send("User not verified");
  }

  //Find the cardnumber on the website
  const page = await scraper.getPage(url);
  const cardNumberFound = await scraper.findElement(
    page,
    scraper.noCardNumberXPath
  );

  //check if cardnumber is found, otherwise send an error
  if (
    cardNumberFound == scraper.cardNotFoundMessage ||
    cardNumberFound == scraper.falseCardMessage ||
    cardNumberFound == scraper.serverErrorMessage
  ) {
    await scraper.browser.close();

    //send an error message based on the cardnumber found
    switch (cardNumberFound) {
      case scraper.cardNotFoundMessage:
        logger.error("Kaartnummer niet gevonden: " +  cardNumber);
        return res.status(404).send("Card not found.");
      case scraper.falseCardMessage:
        logger.error("Geen correct kaartnummer: " +  cardNumber);
        return res.status(401).send("Invalid card number.");
      case scraper.serverErrorMessage:
        logger.error("Interne Server fout: " + cardNumber);
        return res
          .status(500)
          .send("Internal Server Error. Please try again later.");
      default:
        logger.error("Interne Server fout: " + cardNumber);
        return res
          .status(500)
          .send("Internal Server Error. Please try again later.");
    }
  } else {
    //check if the cardnumber is a student or a prof
    const studentFound = await scraper.findElement(page, scraper.studentXPath);
    const profFound = await scraper.findElement(page, scraper.profXPath);

    console.log(studentFound);
    console.log(profFound);

    //if the cardnumber is a student, check if the student is from Brugge
    if (studentFound == "Student") {
      const placeFound = await scraper.findElement(page, scraper.locationXPath);
      await scraper.browser.close();

      //check if the student is from Brugge, otherwise send an error
      if (placeFound == "Brugge" || placeFound == "Kortrijk, Brugge") {
        logger.info("Student gevonden en doorverwezen naar registratiepagina: " +  cardNumber);
        return res.status(299).send(""); //Voor verwijzing naar registratiepagina
      } else {
        logger.warn("Student niet van Brugge: " + cardNumber);
        return res.status(401).send("Student not of Brugge");
      }

      //if the cardnumber is a prof, send a response
    } else if (profFound == "Personeelslid") {
      logger.warn("Personeelslid gevonden: " + cardNumber);
      await scraper.browser.close();
      return res.status(298).send("Prof found"); //Voor verwijzing naar registratiepagina

      //if the cardnumber is not a student or a prof, send an error
    } else {
      logger.error("Geen student of personeelslid: "+ cardNumber);
      await scraper.browser.close();
      return res.status(401).send("Not a Valid Student or Prof");
    }
  }
});

app.get("/registrations", async (req, res) => {
  //create a new instance of the required classes
  const file = "./storage/StudentList.xlsx";
  const parser = new excelParser(file);
  const encryptor = new Encryptor();

  //change the header to allow all origins, NEEDS TO BE CHANGED TO ALLOW ONLY THE FRONTEND URL
  res.header("Access-Control-Allow-Origin", "*");

  //get all registrations from the excel file, remove the students not from Brugge, give me only the names and send them to the frontend
  const registrations = await parser.giveAllRegistrationsInJSON();
  const bruggeRegistrations =
    parser.removeAllRegistrationNotFromBrugge(registrations);
  const names = parser.giveTheNamesFromAllRegistrations(bruggeRegistrations);

  //encrypt the data and send it to the frontend
  const encryptedObject = encryptor.encryptObject(names);

  return res.send(encryptedObject);
});

app.post("/registrations", async (req, res) => {
  //create a new instance of the required classes
  const file = "./storage/StudentList.xlsx";
  const parser = new excelParser(file);
  const mongo = new MongoDatabase();
  const encryptor = new Encryptor();
  const logger = new Logger("registrations.log");

  //get data from the request
  const cardNumber = req.body.cardNumber;
  const role = req.body.role;
  const type = req.body.type;

  //Get all registrations from the excel file
  const registrations = await parser.giveAllRegistrationsInJSON();
  const registeredPerson = req.body.person;
  const personFoundInExcel = parser.findPersonInRegistrations(
    registeredPerson,
    registrations
  );

  // if person is found in the excel file, add the person to the database
  if (personFoundInExcel) {
    const userObject = await mongo.createUserDocument(
      personFoundInExcel,
      role,
      type,
      cardNumber
    );
    const insertResponse = await mongo.insertDocument(
      userObject,
      mongo.dbStructure.UserData.dbName,
      mongo.dbStructure.UserData.users
    );

    // if the person is added to the database, create a token and send an email to the person
    if (insertResponse.acknowledged) {
      try {
        //get user by id
        const user = await mongo.getOnedocumentByFilter(
          { _id: insertResponse.insertedId },
          mongo.dbStructure.UserData.dbName,
          mongo.dbStructure.UserData.users
        );

        //check if user exists, otherwise send an error
        if (!user) {
          logger.error("Gebruiker niet gevonden: " + JSON.stringify(userObject));
          return res.status(404).send("User Could not be found");
        }

        //create token and add it to the user
        const token = encryptor.createToken();
        let tokenAdded = await mongo.updateDocument(
          { _id: user._id },
          { $set: { token: token } },
          mongo.dbStructure.UserData.dbName,
          mongo.dbStructure.UserData.users
        );

        //check if token has been added, otherwise send an error
        if (!tokenAdded.acknowledged) {
          logger.error("Token kon niet toegevoegd worden: " + JSON.stringify(userObject) + " " + token);
          return res.status(500).send("Token could not be added");
        }

        //send email to user
        const message = `${process.env.BASE_URL}/user/verify/${user.cardNumber}/${token}`;
        await sendEmail(user.email, "Verify Email", message);

        //log the user and token
        logger.info("Gebruiker en token toegevoegd: " + JSON.stringify(userObject) + " " + token);

        return res
          .status(201)
          .send("An Email sent to your account please verify");
      } catch (error) {
        logger.error("Er is iets fout gegaan bij het versturen van de email: " + error);
        return res.status(500).send("Something went wrong");
      }
    } else {
      logger.error("Gebruiker kon niet toegevoegd worden aan de database: " + userObject);
      return res.status(500).send("Person could not be added to the database");
    }
  } else {
    logger.error("Gebruiker niet gevonden in de excel file: " + registeredPerson);
    return res.status(404).send("Person not found");
  }
});

app.get("/started", (req, res) => {
  res.status(200);
  res.send("Server is running");
});

app.get("/user/verify/:cardNumber/:token", async (req, res) => {
  try {
    //create a new instance of the required classes
    const mongo = new MongoDatabase();
    const logger = new Logger("verify.log");

    //get the names of the databases and collections
    const dbName = mongo.dbStructure.UserData.dbName;
    const usersCollection = mongo.dbStructure.UserData.users;
    const cardnumber = req.params.cardNumber;

    //get user and token by cardnumber
    const user = await mongo.getOnedocumentByFilter(
      { cardNumber: cardnumber },
      dbName,
      usersCollection
    );
    const token = user.token;

    //check if user and token exist, otherwise send an error
    if (!token) {
      logger.error("Token kon niet gevonden worden: ", cardnumber);
      return res.status(404).send("Token Could not be found");
    }

    //check if token is the same as the token in the url, otherwise send an error
    if (token !== req.params.token) {
      logger.error("Ongeldige token: ", cardnumber + " " + token);
      return res.status(401).send("Invalid Token");
    }

    //update userstatus to verified
    let verified = await mongo.updateDocument(
      { _id: user._id },
      { $set: { verified: true } },
      dbName,
      usersCollection
    );

    //check if userstatus has been updated, otherwise send an error
    if (!verified.acknowledged) {
      logger.error("Gebruiker kon niet geverifieerd worden: ", user); 
      return res.status(500).send("User could not be verified");
    }

    logger.info("Gebruiker geverifieerd: ", user);
    res.status(200).send("User has been verified");
  } catch (error) {
    logger.error("Er is iets fout gegaan bij het verifiëren van de gebruiker: " + error + " " + cardnumber + " " + token);
    res.status(500).send("Something went wrong");
  }
});

app.get("/users", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  const encryptor = new Encryptor();

  //get the names of the databases and collections
  const dbName = mongo.dbStructure.UserData.dbName;
  const usersCollection = mongo.dbStructure.UserData.users;

  //get all users from the database
  const users = await mongo.getAllDocuments(dbName, usersCollection);
  const encryptedUsers = encryptor.encryptObject(users);

  res.status(200).send(encryptedUsers);
});

app.post("/users", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  const encryptor = new Encryptor();
  const logger = new Logger("registrations.log");

  //get the user data from the request
  const encryptedUser = req.body.encryptedUser;

  //decrypt the user data
  const user = encryptor.decryptObject(encryptedUser)

   //create a mongoDb ObjectId from a string
    const roleId = new mongodb.ObjectId(user.role);
    const typeId = new mongodb.ObjectId(user.type);
    const courseId = new mongodb.ObjectId(user.course);

    const newUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      idNumber: user.idNumber,
      cardNumber: user.cardNumber,
      role: roleId,
      type: typeId,
      course: courseId,
      token:"",
      verified: false,
    };
     
   //insert the user into the database
   const insertResponse = await mongo.insertDocument(
     newUser,
     mongo.dbStructure.UserData.dbName,
     mongo.dbStructure.UserData.users
   );
 
   //check if the user has been added to the database, otherwise send an error
   if (!insertResponse.acknowledged) {
     logger.error("Gebruiker kon niet toegevoegd worden: " + JSON.stringify(newUser));
     return res.status(500).send("User could not be added");
   }
 
   //create a token and send an email to the user
   const token = encryptor.createToken();
   let tokenAdded = await mongo.updateDocument(
     { _id: insertResponse.insertedId },
     { $set: { token: token } },
     mongo.dbStructure.UserData.dbName,
     mongo.dbStructure.UserData.users
   );
 
   //check if the token has been added, otherwise send an error
   if (!tokenAdded.acknowledged) {
     logger.error("Token kon niet toegevoegd worden: " + JSON.stringify(newUser) + " " + token);
     return res.status(500).send("Token could not be added");
   }
 
   //send an email to the user
   const message = `${process.env.BASE_URL}/user/verify/${newUser.cardNumber}/${token}`;
   try {
     await sendEmail(newUser.email, "Verify Email", message);
     logger.info("Gebruiker en token toegevoegd: " + JSON.stringify(newUser) + " " + token);
     return res.status(201).send("An Email sent to your account please verify");
   } catch (error) {
     logger.error("Er is iets fout gegaan bij het versturen van de email: " + error);
     return res.status(500).send("Something went wrong");
   }
 
});

app.delete("/users", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  const logger = new Logger("registrations.log");
  const encryptor = new Encryptor();

  //get the userId from the request
  const userId = new mongodb.ObjectId(req.body.encryptedUserId);

  //get the names of the databases and collections
  const usersCollection = mongo.dbStructure.UserData.users;
  const dbName = mongo.dbStructure.UserData.dbName;

  //delete the user
  const deleteResponse = await mongo.deleteDocument(
    { _id: userId },
    dbName,
    usersCollection
  );

  //check if the user has been deleted, otherwise send an error
  if (deleteResponse.acknowledged) {
    logger.info("Gebruiker verwijderd: "+ userId);
    return res.status(200).send("User deleted");
  } else {
    logger.error("Gebruiker kon niet verwijderd worden: "+ userId);
    return res.status(500).send("User could not be deleted");
  }
});

app.put("/users", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  const logger = new Logger("registrations.log");
  const encryptor = new Encryptor();

  //get the user data from the request
  const encryptedUser = req.body.encryptedUser;

  //decrypt the user data
  const user = encryptor.decryptObject(encryptedUser);

  //create a mongoDb ObjectId from a string
  const userId = new mongodb.ObjectId(user._id);
  const roleId = new mongodb.ObjectId(user.role);
  const typeId = new mongodb.ObjectId(user.type);
  const courseId = new mongodb.ObjectId(user.course);

  //create the user object
  const updatedUser = {
    _id: userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    idNumber: user.idNumber,
    cardNumber: user.cardNumber,
    role: roleId,
    type: typeId,
    course: courseId,
  };

  //update the user in the database
  const updateResponse = await mongo.updateDocument(
    { _id: userId },
    { $set: updatedUser },
    mongo.dbStructure.UserData.dbName,
    mongo.dbStructure.UserData.users
  );

  //check if the user has been updated, otherwise send an error
  if (!updateResponse.acknowledged) {
    logger.error("Gebruiker kon niet geüpdatet worden: " + JSON.stringify(updatedUser));
    return res.status(500).send("User could not be updated");
  }

  logger.info("Gebruiker geüpdatet: " + JSON.stringify(updatedUser));
  return res.status(200).send("User updated");
});

app.get("/types", async (req, res) => {
  //create a new instance of the required classes
  //const mongo = new MongoDatabase();
  const mongo = new MongoDatabase();
  const encryptor = new Encryptor();

  //get the names of the databases and collections
  const dbName = mongo.dbStructure.UserData.dbName;
  const typesCollection = mongo.dbStructure.UserData.types;

  //get all types from the database
  const types = await mongo.getAllDocuments(dbName, typesCollection);
  const encryptedTypes = encryptor.encryptObject(types);

  res.status(200).send(encryptedTypes);
});

app.get("/roles", async (req, res) => {
  //create a new instance of the required classes
  //const mongo = new MongoDatabase();
  const mongo = new MongoDatabase();
  const encryptor = new Encryptor();

  //get the names of the databases and collections
  const dbName = mongo.dbStructure.UserData.dbName;
  const rolesCollection = mongo.dbStructure.UserData.roles;

  //get all roles from the database
  const roles = await mongo.getAllDocuments(dbName, rolesCollection);
  const encryptedRoles = encryptor.encryptObject(roles);

  res.status(200).send(encryptedRoles);
});

app.get("/courses", async (req, res) => {
  //create a new instance of the required classes
  //const mongo = new MongoDatabase();
  const mongo = new MongoDatabase();
  const encryptor = new Encryptor();

  //get the names of the databases and collections
  const usersDataDbName = mongo.dbStructure.UserData.dbName;
  const coursesCollection = mongo.dbStructure.UserData.courses;

  //get all courses from the database
  const courses = await mongo.getAllDocuments(usersDataDbName, coursesCollection);
  const encryptedCourses = encryptor.encryptObject(courses);

  res.status(200).send(encryptedCourses);
});

app.post("/opendoor", async (req, res) => {
  const logger = new Logger("opendoor.log");

  //wait for 2 seconds then send a response
  setTimeout(() => {
    logger.info("Door opened");
    return res.status(200).send("Door opened");
  }, 2000);
});

app.get("/rooms", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  
  //get the names of the databases and collections
  const dbName = mongo.dbStructure.RoomsData.dbName;
  const roomsCollection = mongo.dbStructure.RoomsData.rooms;
  const rooms = await mongo.getAllDocuments(dbName, roomsCollection);

  res.status(200).send(rooms);
});

app.get("/reservations", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();

  //get the names of the databases and collections
  const roomsDatadbName = mongo.dbStructure.RoomsData.dbName;
  const usersDataDbName = mongo.dbStructure.UserData.dbName;
  const reservationsCollection = mongo.dbStructure.RoomsData.reservations;
  const roomsCollection = mongo.dbStructure.RoomsData.rooms;
  const usersCollection = mongo.dbStructure.UserData.users;

  //give all reservations
  const reservations = await mongo.getAllDocuments(
    roomsDatadbName,
    reservationsCollection
  );

  for (let reservation of reservations) {
    const userId = new mongodb.ObjectId(reservation.user);

    const user = await mongo.getOnedocumentByFilter(
      { _id: userId },
      usersDataDbName,
      usersCollection
    );
    reservation.user = {
      _id: user._id,
      idNumber: user.idNumber,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const roomId = new mongodb.ObjectId(reservation.room);

    const room = await mongo.getOnedocumentByFilter(
      { _id: roomId },
      roomsDatadbName,
      roomsCollection
    );
    reservation.room = room;
  }

  res.status(200).send(reservations);
});

app.post("/reservations", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  const reservationLogger = new Logger("reservations.log");

  //get the reservation data from the request
  const reservation = req.body;

  //create a mongoDb ObjectId from a string
  const reservationRoomId = new mongodb.ObjectId(reservation.roomId);
  const reservationDate = new Date(reservation.date);

  //get all reservations for the room
  const checkReservationsForRoom = await mongo.getDocumentsByFilter(
    { room: reservationRoomId },
    mongo.dbStructure.RoomsData.dbName,
    mongo.dbStructure.RoomsData.reservations
  );

  //keep track of the amount of reservations found for that moment
  let foundReservations = 0;

  //check for reservation date and time + duration if reservation is valid
  //if valid add reservation to database
  //if not valid send an error message
  for (let storedReservation of checkReservationsForRoom) {
    //check day first using days, months and years only
    if (
      storedReservation.date.getUTCDay() === reservationDate.getUTCDay() &&
      storedReservation.date.getUTCMonth() === reservationDate.getUTCMonth() &&
      storedReservation.date.getUTCFullYear() === reservationDate.getUTCFullYear()
    ) {
      //get the hours and duration of the stored reservation
      const storedHours = storedReservation.date.getUTCHours();
      const storedDuration = storedReservation.duration;

      //get the hours and duration minutes of the new reservation
      const newHours = reservationDate.getUTCHours();
      const newDuration = reservation.duration;

      //check if no part of the reservationtime + duration is between a storedreservation time + duration
      if (
        (newHours >= storedHours && newHours <= storedHours + storedDuration) || (newHours + newDuration > storedHours && newHours + newDuration <= storedHours + storedDuration)
      ) {
        ++foundReservations;
        if (foundReservations > 1) {
            reservationLogger.warn("Reservatie kon niet toegevoegd worden door overlapping: " + JSON.stringify(reservation));
            return res.status(400).send("Reservation not valid");
        } 
        continue;
      } else {
        continue;
      }
    } else {
      continue;
    }
  }

  const reservationToAdd = await mongo.createReservationDocument(
    reservation.userId,
    reservation.roomId,
    reservation.date,
    reservation.duration
  );

  const insertResponse = await mongo.insertDocument(
    reservationToAdd,
    mongo.dbStructure.RoomsData.dbName,
    mongo.dbStructure.RoomsData.reservations
  );

  if (insertResponse.acknowledged) {
    //log the full reservation as info
    reservationLogger.info("Reservatie Toegevoegd: " + JSON.stringify(reservationToAdd));
    return res.status(201).send("Reservation added");
  } else {
    //log the full reservation as error
    reservationLogger.error("Reservatie kon niet toegevoegd worden door een interne fout: " + JSON.stringify(reservationToAdd));
    return res.status(500).send("Reservation could not be added");
  }
});

app.delete("/reservations", async(req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  const logger = new Logger("reservations.log");

  //use the reservationId only
  const reservationId = new mongodb.ObjectId(req.body.reservationId);
  const reservationsCollection = mongo.dbStructure.RoomsData.reservations;
  const roomsDatadbName = mongo.dbStructure.RoomsData.dbName;

  //delete the reservation
  const deleteResponse = await mongo.deleteDocument(
    { _id: reservationId },
    roomsDatadbName,
    reservationsCollection
  );

  //check if the reservation has been deleted, otherwise send an error
  if (deleteResponse.acknowledged) {
    logger.info("Reservatie verwijderd: "+ reservationId);
    return res.status(200).send("Reservation deleted");
  } else {
    logger.error("Reservatie kon niet verwijderd worden: "+ reservationId);
    return res.status(500).send("Reservation could not be deleted");
  }
})

app.post("/myReservations", async(req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();

  //create a mongoDb ObjectId from the userId
  const userId = new mongodb.ObjectId(req.body.userId)
  
  //create a new instance of the required classes
  const roomsDatadbName = mongo.dbStructure.RoomsData.dbName;
  const reservationsCollection = mongo.dbStructure.RoomsData.reservations;
  const roomsCollection = mongo.dbStructure.RoomsData.rooms;

  //give all the reservations for that user for today midnight and later
  const midnightToday = new Date(new Date().setHours(0, 0, 0, 0));
  const reservations = await mongo.getDocumentsByFilter(
    { user: userId, date: { $gte: midnightToday } },
    roomsDatadbName,
    reservationsCollection
  );

  //get the room for each reservation
  for (let i = 0; i < reservations.length; i++) {
    const room = await mongo.getOnedocumentByFilter(
      { _id: reservations[i].room },
      roomsDatadbName,
      roomsCollection
    );
    reservations[i].room = room;
  }

  return res.status(200).send(reservations);
})

app.get("/logfiles", async(req, res) => {
  //import the logs in the logs directory
  const encryptor = new Encryptor();
  const loginLogger = new Logger("login.log");
  const registrationLogger = new Logger("registrations.log");
  const reservationLogger = new Logger("reservations.log");
  const verifyLogger = new Logger("verify.log");
  const openDoorLogger = new Logger("opendoor.log");

  //get all the logfiles
  const loginFile = loginLogger.getLogFileDataInJson();
  const registrationFile = registrationLogger.getLogFileDataInJson();
  const reservationsFile = reservationLogger.getLogFileDataInJson();
  const verifyFile = verifyLogger.getLogFileDataInJson();
  const openDoorFile = openDoorLogger.getLogFileDataInJson();

  //encrypt the data and send it to the frontend
  const encryptedLogfiles = encryptor.encryptObject([loginFile, registrationFile, reservationsFile ,verifyFile, openDoorFile]);

  return res.status(200).send(encryptedLogfiles);
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`);
  console.log("Environment: " + process.env.NODE_ENV);

  //check if the logfiles exist, otherwise create them
  const loginLogger = new Logger("login.log");
  const registrationLogger = new Logger("registrations.log");
  const reservationLogger = new Logger("reservations.log");
  const verifyLogger = new Logger("verify.log");
  const openDoorLogger = new Logger("opendoor.log");

  loginLogger.createLogFile();
  registrationLogger.createLogFile();
  reservationLogger.createLogFile();
  verifyLogger.createLogFile();
  openDoorLogger.createLogFile();
});

module.exports.app = app;
