const express = require("express");
var bodyParser = require("body-parser");
const urlScraper = require("./scraper.js");
const excelParser = require("./excelParser.js");
const app = express();
const cors = require("cors");
const sendEmail = require("./utils/email");
const dotenv = require("dotenv");
const MongoDatabase = require("./mongoDatabase");
const Encryptor = require("./utils/encryptor");
const EmailParser = require("./utils/emailParser");
const mongodb = require("mongodb");

dotenv.config({
  path: "./keys.env",
});

const corsOptions = {
  origin: ["http://localhost:5173"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = 3000;

app.post("/test", async (req, res) => {
  const emailParser = new EmailParser();
  await emailParser.fetchAttachments();
  res.status(200).send("Test succeeded");
});

app.post("/login", async (req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();
  scraper = new urlScraper();
  const encryptor = new Encryptor();
  const emailParser = new EmailParser();

  //check if a new Studentlist has been sent
  //await emailParser.fetchEmails();

  //decrypt the data
  const encryptedurl = req.body.encryptedLink;
  const url = encryptor.decrypt(encryptedurl);

  //change the header to allow all origins, NEEDS TO BE CHANGED TO ALLOW ONLY THE FRONTEND URL
  res.header("Access-Control-Allow-Origin", "*");

  //check if the url is valid, otherwise send an error
  if (!scraper.checkValidUrl(url)) return res.status(400).send("Invalid URL");

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

    return res.status(297).send(encryptedObject); // voor verwijzing naar persoonlijke pagina
  }

  //check if user exists and is not verified, otherwise send an error
  if (personFound && !personFound.verified) {
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
        return res.status(404).send("Card not found.");
      case scraper.falseCardMessage:
        return res.status(401).send("Invalid card number.");
      case scraper.serverErrorMessage:
        return res
          .status(500)
          .send("Internal Server Error. Please try again later.");
      default:
        return res
          .status(500)
          .send("Internal Server Error. Please try again later.");
    }
  } else {
    //check if the cardnumber is a student or a prof
    const studentFound = await scraper.findElement(page, scraper.studentXPath);
    const profFound = await scraper.findElement(page, scraper.profXPath);

    //if the cardnumber is a student, check if the student is from Brugge
    if (studentFound == "Student") {
      const placeFound = await scraper.findElement(page, scraper.locationXPath);
      await scraper.browser.close();

      //check if the student is from Brugge, otherwise send an error
      if (placeFound == "Kortrijk") {
        //Needs to be changed to Brugge
        return res.status(299).send(""); //Voor verwijzing naar registratiepagina
      } else {
        return res.status(401).send("Not a Valid Student or Prof"); //Needs to be changed to Brugge and for Error message
      }

      //if the cardnumber is a prof, send a response
    } else if (profFound == "Personeelslid") {
      await scraper.browser.close();
      return res.status(298).send("Prof found"); //Voor verwijzing naar registratiepagina

      //if the cardnumber is not a student or a prof, send an error
    } else {
      await scraper.browser.close();
      return res.status(401).send("Not a Valid Student or Prof");
    }
  }
});

app.get("/registrations", (req, res) => {
  //create a new instance of the required classes
  const file = "./storage/StudentList.xlsx";
  const parser = new excelParser(file);
  const encryptor = new Encryptor();

  //change the header to allow all origins, NEEDS TO BE CHANGED TO ALLOW ONLY THE FRONTEND URL
  res.header("Access-Control-Allow-Origin", "*");

  //get all registrations from the excel file, remove the students not from Brugge, give me only the names and send them to the frontend
  const registrations = parser.giveAllRegistrationsInJSON();
  const bruggeRegistrations =
    parser.removeAllRegistrationNotFromBrugge(registrations);
  const names = parser.giveTheNamesFromAllRegistrations(bruggeRegistrations);

  //encrypt the data and send it to the frontend
  const encryptedObject = encryptor.encryptObject(names);

  return res.send(encryptedObject);
});

app.post("/registrations", async (req, res) => {
  const file = "./storage/StudentList.xlsx";
  const parser = new excelParser(file);
  const mongo = new MongoDatabase();
  const encryptor = new Encryptor();

  //get data from the request
  const cardNumber = req.body.cardNumber;
  const role = req.body.role;
  const type = req.body.type;

  //Get all registrations from the excel file
  const registrations = parser.giveAllRegistrationsInJSON();
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
        if (!user) return res.status(404).send("User Could not be found");

        //create token and add it to the user
        const token = encryptor.createToken();
        let tokenAdded = await mongo.updateDocument(
          { _id: user._id },
          { $set: { token: token } },
          mongo.dbStructure.UserData.dbName,
          mongo.dbStructure.UserData.users
        );

        //check if token has been added, otherwise send an error
        if (!tokenAdded.acknowledged)
          return res.status(500).send("Token could not be added");

        //send email to user
        const message = `${process.env.BASE_URL}/user/verify/${user.cardNumber}/${token}`;
        await sendEmail(user.email, "Verify Email", message);

        return res
          .status(201)
          .send("An Email sent to your account please verify");
      } catch (error) {
        console.log(error);
        return res.status(500).send("Something went wrong");
      }
    } else {
      return res.status(500).send("Person could not be added to the database");
    }
  } else {
    return res.status(404).send("Person not found");
  }
});

app.get("/started", (req, res) => {
  res.status(200);
  res.send("Server is running");
});

app.get("/user/verify/:cardNumber/:token", async (req, res) => {
  try {
    const mongo = new MongoDatabase();
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
    if (!token) return res.status(404).send("Token Could not be found");

    //check if token is the same as the token in the url, otherwise send an error
    if (token !== req.params.token)
      return res.status(401).send("Invalid Token");

    //update userstatus to verified
    let verified = await mongo.updateDocument(
      { _id: user._id },
      { $set: { verified: true } },
      dbName,
      usersCollection
    );

    //check if userstatus has been updated, otherwise send an error
    if (!verified.acknowledged)
      return res.status(500).send("User could not be verified");

    res.status(200).send("User has been verified");
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

app.post("/opendoor", async (req, res) => {
  //wait for 2 seconds then send a response
  setTimeout(() => {
    return res.status(200).send("Door opened");
  }, 2000);
});

app.get("/rooms", async (req, res) => {
  const mongo = new MongoDatabase();
  const dbName = mongo.dbStructure.RoomsData.dbName;
  const roomsCollection = mongo.dbStructure.RoomsData.rooms;
  const rooms = await mongo.getAllDocuments(dbName, roomsCollection);
  res.status(200).send(rooms);
});

app.get("/reservations", async (req, res) => {
  const mongo = new MongoDatabase();

  //get the names of the databases and collections
  const roomsDatadbName = mongo.dbStructure.RoomsData.dbName;
  const usersDataDbName = mongo.dbStructure.UserData.dbName;
  const reservationsCollection = mongo.dbStructure.RoomsData.reservations;
  const roomsCollection = mongo.dbStructure.RoomsData.rooms;
  const usersCollection = mongo.dbStructure.UserData.users;

  //give all the reservations for today midnight and later
  const midnightToday = new Date(new Date().setHours(0, 0, 0, 0));
  const reservations = await mongo.getDocumentsByFilter(
    { date: { $gte: midnightToday } },
    roomsDatadbName,
    reservationsCollection
  );

  for (let i = 0; i < reservations.length; i++) {
    const userId = new mongodb.ObjectId(reservations[i].user);

    const user = await mongo.getOnedocumentByFilter(
      { _id: userId },
      usersDataDbName,
      usersCollection
    );
    reservations[i].user = {
      idNumber: user.idNumber,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const roomId = new mongodb.ObjectId(reservations[i].room);

    const room = await mongo.getOnedocumentByFilter(
      { _id: roomId },
      roomsDatadbName,
      roomsCollection
    );
    reservations[i].room = room;
  }

  res.status(200).send(reservations);
});

app.post("/reservations", async (req, res) => {
  const mongo = new MongoDatabase();

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
    return res.status(201).send("Reservation added");
  } else {
    return res.status(500).send("Reservation could not be added");
  }
});

app.delete("/reservations", async(req, res) => {
  //create a new instance of the required classes
  const mongo = new MongoDatabase();

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
    return res.status(200).send("Reservation deleted");
  } else {
    return res.status(500).send("Reservation could not be deleted");
  }
})

app.post("/myReservations", async(req, res) => {
  const mongo = new MongoDatabase();

  const userId = new mongodb.ObjectId(req.body.userId)
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports.app = app;
