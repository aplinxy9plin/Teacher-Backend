var express = require('express'), bodyParser = require('body-parser'), multer = require('multer')
var app = express();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var url = "mongodb://localhost:27017/";

storage = multer.diskStorage(
    {
        destination: './uploads/',
        filename: function ( req, file, cb ) {
            var ext = file.originalname.split('.')
            cb( null, file.originalname+"."+ext[1]);
        }
    }
);
uplaod = multer({storage: storage})
form_element_name = 'test';

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/new_teach', uplaod.single(form_element_name), (req, res) => {
    var obj = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        university: req.body.university,
        subject: req.body.subject,
        mark: [req.body.mark],
        text: [req.body.text],
        photo: req.file.originalname ? req.file.originalname : null
    }
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("teachers");
        dbo.collection("teachers").findOne({first_name: obj.first_name, last_name: obj.last_name, university: obj.university}, (err, result) => {
            if (err) throw err;
            if(!result){
                dbo.collection("teachers").insertOne(obj, (err) => {
                    if (err) throw err;
                    res
                        .status(200)
                        .json({type: "ok"});
                });
            }else{
                res
                    .status(200)
                    .json({type: "just_add"});
            }
        })
    })
})

app.get('/file/:name', (req, res, next) => {
    var options = {
      root: __dirname + '/uploads/',
      dotfiles: 'deny',
      headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
      }
    };
  
    var fileName = req.params.name;
    res.sendFile(fileName, options, function (err) {
      if (err) {
        next(err);
      } else {
        console.log('Sent:', fileName);
      }
    });
});

app.post('/add_mark', (req, res) => {
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("teachers");
        dbo.collection("teachers").findOne({_id: ObjectId(req.body.id)}, (err, result) => {
            if (err) throw err;
            var marks = result.mark, texts = result.text;
            marks.push(req.body.mark); texts.push(req.body.text);
            var teacher = result;
            teacher.mark = marks; teacher.text = texts;
            dbo.collection("teachers").update({_id: ObjectId(req.body.id)}, teacher, (err) => {
                if (err) throw err;
                res.json({type: "ok"})
            })
        })
    })
})

app.get('/get_teacher', (req, res) => {
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db("teachers")
        dbo.collection("teachers").findOne({_id: ObjectId(req.query.id)}, (err, result) => {
            res.json(result)
        })
    })
})

app.get('/all_teachers', (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("teachers");
        dbo.collection("teachers").find().toArray((err, result) => {
            if (err) throw err;
            res.json(result)
        })
    })
})

app.listen(1337, () => {
    console.log('Server listening on 1337 port')
})