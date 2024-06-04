# Game Experience Room Server Hogeschool VIVES, Brugge

[![Made with Docker](https://img.shields.io/badge/Made_with-Docker-blue?logo=docker&logoColor=white)](https://www.docker.com/ "Go to Docker homepage")
[![Made with Node.js](https://img.shields.io/badge/Node.js->=20-blue?logo=node.js&logoColor=white)](https://nodejs.org "Go to Node.js homepage")

Welcome, this server is the backend of the Game Experience Room Reservation and Door Access application. This server should be therefore used in conjunction with the frontend application that can be found here -> [Frontend](https://github.com/Gameroom-Vives-Hogeschool-Brugge/GameroomExperienceApp-VHB). 

The Game Experience Room Reservation and Door Access application allows you to create, update and control reservations for the Game Experience Room. Furthermore it is connected to a electrically controlled door which you can open if you have a valid reservation at that time.

## Team

[Olivier Van Ransbeeck](https://www.linkedin.com/in/oliviervanransbeeck/)

## Example video

## Features

- User Login control

- User Registration control

- Fetch Reservations

- Create and Delete Reservations

- Create, Update and Delete Users

- Fetch Roles, Types, Courses and Rooms

- Open the access door

- Monitor the application via logfiles

- Encrypt outgoing data, decrypt incoming data

- Verify users via verification emails

- Parses excel file with the registered students

- Uses Cronjobs and Puppeteer for automatic email attachment fetching

- Uses Cronjobs for automatic database cleaning

- Stores and fetches data from a mongoDb database

# Configuration and Installation

## Cloning the repository

```bash
git clone https://github.com/Gameroom-Vives-Hogeschool-Brugge/GameRoomExperienceServer-VHB.git
```

## Configuration before deploying

1. Copy the environment variables file (keys.env) to the main application folder.

2. Copy the examples folder to the main application folder.

3. Copy the StudentList.xlsx file to the "storage" folder.


## Deploy all containers

```bash
docker compose up -d --build
```

## Check if the server deploys correctly

1. The server will tell you in which mode it runs (development or prod), this can be changed in the keys.env file.

2. The server will tell you which port it uses, this can be changed in the keys.env file.

3. The server will create all log files if they are not created yet.

4. The server will create all databases and collections.

5. The server will populate the database with the initial data required to run the application.

6. The server will create the first administrator if this user does not already exist

## MongoDb Structure and examples

### RoomsData.Rooms

```json
[{
  "_id": {
    "$oid": "65ddc3c1191c68231bf6110c"
  },
  "description": "Console",
  "maxStudents": 2,
  "earliestReservationTime": "09:00",
  "latestReservationTime": "17:00",
  "roomNumber": 1
},
{
  "_id": {
    "$oid": "65ddc48fe28da42a3388ebd8"
  },
  "description": "VR Bril",
  "maxStudents": 2,
  "earliestReservationTime": "09:00",
  "latestReservationTime": "17:00",
  "roomNumber": 2
},
{
  "_id": {
    "$oid": "65faee64e7b1de9173fbcc03"
  },
  "description": "Computer 1",
  "maxStudents": 2,
  "earliestReservationTime": "09:00",
  "latestReservationTime": "17:00",
  "roomNumber": 3
},
{
  "_id": {
    "$oid": "65faee6ae7b1de9173fbcc04"
  },
  "description": "Computer 2",
  "maxStudents": 2,
  "earliestReservationTime": "09:00",
  "latestReservationTime": "17:00",
  "roomNumber": 4
}]
```

### RoomsData.Reservations

```json
[{
  "_id": {
    "$oid": "65facc6ce7b1de9173fbcbe1"
  },
  "room": {
    "$oid": "65ddc48fe28da42a3388ebd8"
  },
  "date": {
    "$date": "2024-03-18T08:00:00.000Z"
  },
  "duration": 1,
  "user": {
    "$oid": "65e5c77581846d9b55a37167"
  }
}]
```

### RoomsData.OldReservations

```json
[{
  "_id": {
    "$oid": "65facc6ce7b1de9173fbcbe1"
  },
  "room": {
    "$oid": "65ddc48fe28da42a3388ebd8"
  },
  "date": {
    "$date": "2024-03-18T08:00:00.000Z"
  },
  "duration": 1,
  "user": {
    "$oid": "65e5c77581846d9b55a37167"
  }
}]
```

### UserData.courses

```json
[{
  "_id": {
    "$oid": "65ddc6ab191c68231bf61114"
  },
  "course": "PBA Electronica-ICT (Kortrijk) (AO)",
  "description": "A course about Electronics-ICT from home",
  "location": "Kortrijk"
},
{
  "_id": {
    "$oid": "65ddc70e191c68231bf61115"
  },
  "course": "Not Applicable",
  "description": "For persons not registered as students",
  "location": "Not Applicable"
},
{
  "_id": {
    "$oid": "65ddc864191c68231bf6111b"
  },
  "course": "PBA Elektronica-ICT (Brugge)",
  "description": "A course about Electronics-ICT from Brugge",
  "location": "Brugge"
}]
```

### UserData.roles

```json
[{
  "_id": {
    "$oid": "65ddc614191c68231bf61110"
  },
  "role": "Student"
},
{
  "_id": {
    "$oid": "65ddc626191c68231bf61112"
  },
  "role": "Prof"
},
{
  "_id": {
    "$oid": "65ddc649191c68231bf61113"
  },
  "role": "Admin"
}]
```

### UserData.types

```json
[{
  "_id": {
    "$oid": "65ddc778191c68231bf61116"
  },
  "type": "Student"
},
{
  "_id": {
    "$oid": "65ddc793191c68231bf61117"
  },
  "type": "Prof"
},
{
  "_id": {
    "$oid": "65ddc7a2191c68231bf61119"
  },
  "type": "Exception"
}]
```

### UserData.users (example file with false data)

```json
[{
  "_id": {
    "$oid": "65ddc576191c68231bf6110f"
  },
  "idNumber": "0954449",
  "cardNumber": "00000002",
  "firstName": "Dimitri",
  "lastName": "lastName",
  "email": "dimitri.starkov@student.vives.be",
  "course": {
    "$oid": "65ddc6ab191c68231bf61114"
  },
  "role": {
    "$oid": "65ddc614191c68231bf61110"
  },
  "type": {
    "$oid": "65ddc778191c68231bf61116"
  },
  "token": "abc123",
  "verified": true
}]
```

# Containers

### App

The is a nodejs Express server that performs all backend tasks.

### MongoDB

This is a local database that uses mongoDB to store user and reservation data.
