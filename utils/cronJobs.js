//imports
const schedule = require('node-schedule');

//variables

const mondayNoonCronString = '0 12 * * 1'; //every monday at noon
const everyMinuteCronString = '* * * * *'; //every minute
const everyTenMinutesCronString = '*/10 * * * *'; //every ten minutes

const midnightCronString = '0 0 * * *'; //every day at midnight

//move reservations to oldReservations collection every day at midnight
const moveReservations = schedule.scheduleJob(midnightCronString, async () => {
  //imports
  const MongoDatabase = require('./mongoDatabase');
  
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
const checkForEmails = schedule.scheduleJob(mondayNoonCronString, async () => {
    //imports
    const EmailParser = require('../utils/emailParser');
    const MongoDatabase = require('./mongoDatabase');
    const ExcelParser = require('./excelParser');

    //variables
    const emailParser = new EmailParser();
    const mongo = new MongoDatabase();
    const usersDatadbName = mongo.dbStructure.UserData.dbName;
    const typesCollection = mongo.dbStructure.UserData.types;
    const usersCollection = mongo.dbStructure.UserData.users;

    //fetch attachments
    await emailParser.fetchAttachments();

    //wait 10 seconds for the attachments to be saved
    await new Promise(resolve => setTimeout(resolve, 10000));

    //get the studentFile
    const file = "storage/StudentList.xlsx";
    const excelParser = new ExcelParser(file);

    //get all registrations from Brugge from excel file
    const registrations = await excelParser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = await excelParser.removeAllRegistrationNotFromBrugge(registrations);

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

    //if there are no students in the database, stop the search
    if (students.length === 0) {
        return;
    }

    //check if the student is already in the database
    for (let student of students) {
        let found = false;

        //if there are no registrations in the excel file, stop the search
        if (bruggeRegistrations.length === 0) {
            return;
        }

        //search for the student in the excel file
        for (let registration of bruggeRegistrations) {
            if (student.idNumber === registration.Student) {
                found = true;
                break; //stop searching  
            }
        }

        //if the student is not found in the excel file, delete the student from the database
        if (!found) {
            const response = await mongo.deleteDocument(
                { _id: student._id },
                usersDatadbName,
                usersCollection
            );

            //find all reservations of the student
            const reservationsCollection = mongo.dbStructure.RoomsData.reservations;
            const reservations = await mongo.getDocumentsByFilter(
                { user: student._id },
                mongo.dbStructure.RoomsData.dbName,
                reservationsCollection
            );

            //if the student has reservations, delete them
            if (reservations.length > 0) {
                //delete all reservations of the student
                for (let reservation of reservations) {
                    const response = await mongo.deleteDocument(
                        { _id: reservation._id },
                        mongo.dbStructure.RoomsData.dbName,
                        reservationsCollection
                    );
                }
            }
        }
    }
});


//exports
module.exports = moveReservations, checkForEmails;