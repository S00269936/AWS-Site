# Hospital Appointment System

The Hospital Appointment System is a web application that allows patients and doctors to manage appointments.

The application was created as part of my Software Development studies and gave me experience with AWS, cloud development, APIs and serverless applications.

## Features

- Create new appointments
- View upcoming appointments
- View appointments by patient
- View appointments by doctor
- Cancel appointments
- Update appointment status
- Add notes to appointments
- Separate patient and doctor views
- Store appointment information in the cloud

## Technologies Used

- AWS
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB
- Amazon S3
- Amazon CloudFront
- JavaScript
- HTML
- CSS
- Node.js

## How It Works

The application uses AWS services to handle the backend and store appointment information.

The frontend sends requests to an API created using Amazon API Gateway. API Gateway then sends these requests to the correct AWS Lambda function.

The Lambda functions handle the application logic and communicate with DynamoDB to create, read, update or delete appointment information.

This allows the application to run without needing a traditional server.

## API

The application uses a REST style API to manage appointments.

The API supports:

- Creating an appointment
- Getting an appointment by ID
- Getting appointments for a patient
- Getting appointments for a doctor
- Updating an appointment
- Deleting an appointment

Different Lambda functions are used to process these requests.

## Database

Amazon DynamoDB is used to store appointment information.

Each appointment can contain information such as:

- Appointment ID
- Patient ID
- Doctor ID
- Patient name
- Appointment date
- Appointment time
- Reason for appointment
- Appointment status
- Notes

DynamoDB indexes are also used to find appointments belonging to a specific patient or doctor.

## AWS Hosting

The application is hosted using AWS services.

Amazon S3 is used to store the frontend files and Amazon CloudFront is used to deliver the application to users.

The backend uses AWS Lambda and API Gateway, while DynamoDB is used as the database.

This gave me experience working with a serverless cloud architecture and connecting multiple AWS services together.

## What I Learned

While developing this project I gained experience with:

- AWS cloud services
- Serverless application development
- AWS Lambda
- API Gateway
- DynamoDB
- S3
- CloudFront
- Creating APIs
- CRUD operations
- Working with HTTP requests
- Connecting a frontend to a cloud backend
- DynamoDB indexes
- AWS IAM permissions
- Testing API endpoints

## About

The Hospital Appointment System was developed as part of my Software Development studies.

The project helped me understand how cloud based applications can be built and hosted using AWS. It also gave me practical experience with serverless functions, APIs, cloud databases and hosting.
