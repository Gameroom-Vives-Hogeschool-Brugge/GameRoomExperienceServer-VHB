//imports
const schedule = require('node-schedule');

//variables
const midnightCronString = '0 0 * * *'; //every day at midnight
const mondayNoonCronString = '0 12 * * 1'; //every monday at noon
const everyMinuteCronString = '* * * * *'; //every minute
const everyTenMinutesCronString = '*/10 * * * *'; //every ten minutes

//move reservations to oldReservations collection every day at midnight
const moveReservations = schedule.scheduleJob(everyTenMinutesCronString, async () => {
  //imports
  const MongoDatabase = require('../mongoDatabase');
  
  //database variables
  const mongo = new MongoDatabase();
  const roomsDatadbName = mongo.dbStructure.RoomsData.dbName;
  const reservationsCollection = mongo.dbStructure.RoomsData.reservations;
  const oldReservationsCollection = mongo.dbStructure.RoomsData.oldReservations;

  //get all reservations for today midnight and earlier
  const midnightToday = new Date(new Date().setHours(0, 0, 0, 0));
  const reservations = await mongo.getDocumentsByFilter(
    { date: { $lt: midnightToday } },
    roomsDatadbName,
    reservationsCollection
  );

  //move reservations to oldReservations collection
  for (let reservation of reservations) {
    const response = await mongo.moveDocument(
      { _id: reservation._id },
      roomsDatadbName,
      reservationsCollection,
      oldReservationsCollection
    );
  }
});

//check for new emails every monday at noon
const checkForEmails = schedule.scheduleJob(everyTenMinutesCronString, async () => {
    //imports
    const EmailParser = require('../utils/emailParser');
    const MongoDatabase = require('../mongoDatabase');
    const ExcelParser = require('../excelParser');

    //variables
    const emailParser = new EmailParser();
    const mongo = new MongoDatabase();
    const usersDatadbName = mongo.dbStructure.UserData.dbName;
    const typesCollection = mongo.dbStructure.UserData.types;
    const usersCollection = mongo.dbStructure.UserData.users;

    //fetch attachments
    await emailParser.fetchAttachments();

    //get the studentFile
    const file = "storage/StudentList.xlsx";
    const excelParser = new ExcelParser(file);

    //get all registrations from Brugge from excel file
    const registrations = excelParser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = excelParser.removeAllRegistrationNotFromBrugge(registrations);

    //get the id of the type "Student" from the database
    const studentType = await mongo.getOnedocumentByFilter(
        { type: "Student" },
        usersDatadbName,
        typesCollection
    );
    
    //get all the users from the database with type "Student"
    const students = await mongo.getDocumentsByFilter(
        { type: studentType._id},
        usersDatadbName,
        usersCollection
    );

    //check if the student is already in the database, use the student number as unique identifier
    for (let student of students) {
        let found = false;

        //search for the student in the excel file
        for (let registration of bruggeRegistrations) {
            if (student.idNumber === registration.Student) {
                found = true;
                break; //stop searching  
            }
        }

        //if the student is not found in the excel file, delete the student from the database
        if (!found) {
            console.log("Student not in database");
            console.log(student);
            const response = await mongo.deleteDocument(
                { _id: student._id },
                usersDatadbName,
                usersCollection
            );
        }
    }



    
});


//exports
module.exports = moveReservations, checkForEmails;