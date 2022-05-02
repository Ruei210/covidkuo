const express = require('express');
const mysql = require('mysql');
const app = express();
const bodyParser = require("body-parser");
const res = require("express/lib/response");
const nodemailer = require('nodemailer');
const session = require('express-session');
const path = require('path');


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.all("*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type")
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS")
    next();
})

//Body server
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//Body server
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


//Mysql connection
const myDB = mysql.createConnection({
    host: 'bhzihwoot17f7jg9i8qx-mysql.services.clever-cloud.com',
    port: 3306,
    user: 'urur7xep1zh0rkuw',
    password: 'XVLzfCo6h0WcxCv5x89K',
    database: 'bhzihwoot17f7jg9i8qx',

});
myDB.connect(
    function (err) {
        if (err) {
            console.log("!!! Cannot connect !!! Error:");
            throw err;
        }
        else {
            console.log("Connection established.");
        }
    });


//Middleware
app.use(express.static('public'));
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/form.html')   //__dirname：目前的位置
})

app.post('/create', (req, res) => {
    console.log(req.body)   //server.js的xhr:'application/json'
    //製作隨機驗證碼
    function randomstring(L) {
        var s = '';
        var randomchar = function () {
            var n = Math.floor(Math.random() * 62);
            if (n < 10) return n; //1-10 
            if (n < 36) return String.fromCharCode(n + 55); //A-Z 
            return String.fromCharCode(n + 61); //a-z 
        }
        while (s.length < L) s += randomchar();
        return s;
    }
    const code = randomstring(5); //調用方法
    //send email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'covidkuokuo@gmail.com',
            pass: 'kuokuo2021'
        }
    })

    const mailOptions = {
        from: 'covidkuokuo@gmail.com',    //寄件email
        to: req.body.email,
        subject: '仁愛醫院',
        text: `儲存成功。您的序號是${code}`
    }

    var birth_date = req.body.birth_date
    var sex = req.body.sex
    var name = req.body.name
    var date = req.body.date
    var id_number = req.body.id_number;
    var infect_covid = req.body.infect_covid;
    var infect_date = req.body.infect_date;
    var treatment_place = req.body.treatment_place;
    var oxygen_treatment = req.body.oxygen_treatment;
    var ICU_treatment = req.body.ICU_treatment;
    var discharged_date = req.body.discharged_date;
    var revisit = req.body.revisit;
    var revisit_division = req.body.revisit_division;
    var deal_with = req.body.deal_with;
    var email = req.body.email;

    var db1 = `INSERT INTO patient(id_number,date,name,birth_date,sex, infect_covid, infect_date, treatment_place, oxygen_treatment, ICU_treatment, 
        discharged_date, revisit, revisit_division, email, deal_with) 
        VALUES ('${id_number}','${date}','${name}','${birth_date}','${sex}','${infect_covid}','${infect_date}','${treatment_place}','${oxygen_treatment}','${ICU_treatment}','${discharged_date}','${revisit}','${revisit_division}','${email}','${deal_with}')`;
    myDB.query(db1, function (err, res) {
        if (err) throw err;
        console.log("Insert success1")
    })



    var db = `INSERT INTO email (email, serial_number) VALUES ('${email}', '${code}')`;
    myDB.query(db, function (err, res) {
        if (err) throw err;
        console.log("Insert success")
    })



    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send('error');
        } else {
            console.log('Email sent:' + info.response);
            res.send('success')
        }
    })
})
//////////////////////

//病患login
app.post('/login', function (request, response) {
    // Capture the input fields
    let email = request.body.username;
    let serial_number = request.body.password;
    console.log(request.body);
    // Ensure the input fields exists and are not empty
    if (email && serial_number) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        myDB.query('SELECT * FROM email WHERE email = ? AND serial_number = ?', [email, serial_number], function (error, results, fields) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                // Authenticate the user
                request.session.loggedin = true;
                request.session.email = email;
                console.log(results);
                console.log("Login SUCCESS");
                // Redirect to 病患檔案網頁
                response.redirect('/file');
            } else {
                console.log("Login FAIL");
            }

        });
    }
});
//登入成功
app.get('/file', function (request, response) {

    // If the user is loggedin
    if (request.session.loggedin) {
        //response.sendFile(__dirname + '/public/profile.html');
        // Output username
        let email = request.session.email;
        myDB.query(`SELECT id_number, date, name, birth_date, sex, infect_covid, infect_date, treatment_place, oxygen_treatment, ICU_treatment, discharged_date, revisit, revisit_division, email, deal_with FROM patient WHERE email = ?`, [email], function (error, results, fields) {
            if (error) throw error;
            console.log(results);
        });
        response.send('Welcome' + request.session.email + '!');
    } else {
        // 登入失敗
        response.send('Please login to view this page!');
    }
    response.end();
});

//Logout
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/login');
        }
    });

})
//病患更改資料
app.patch('/update', function (request, res) {
    var name = request.body.name
    var date = request.body.date
    var infect_covid = request.body.infect_covid;
    var infect_date = request.body.infect_date;
    var treatment_place = request.body.treatment_place;
    var oxygen_treatment = request.body.oxygen_treatment;
    var ICU_treatment = request.body.ICU_treatment;
    var discharged_date = request.body.discharged_date;
    var revisit = request.body.revisit;
    var revisit_division = request.body.revisit_division;
    var deal_with = request.body.deal_with;
    var email = request.body.email;


    var db = `UPDATE patient SET date = '${date}' , name = '${name}',infect_covid='${infect_covid}',
        infect_date='${infect_date}',treatment_place='${treatment_place}',oxygen_treatment='${oxygen_treatment}',
        ICU_treatment='${ICU_treatment}',discharged_date='${discharged_date}',revisit='${revisit}',revisit_division='${revisit_division}',
        deal_with='${deal_with}' WHERE email ='${email}' `;
    myDB.query(db, function (err, res) {
        if (err) {
            // Update fail
            console.log("Update fail");
        } else {
            console.log("Update success");
            console.log(res);
        }

    })


});
//Server listner
let PORT = process.env.PORT || 567;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
