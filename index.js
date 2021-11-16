const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
var serveIndex = require("serve-index");

const PORT = process.env.PORT || 5000;

const bodyParser = require('body-parser');
app.use(bodyParser.json());       
app.use(bodyParser.urlencoded({ extended: true})); 

app.use("/public", express.static("public"));
app.use("/", express.static("public"));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, `${req.query.path}`);
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    },
});
var upload = multer({ storage: storage }).single("myfile");

// app.use("/static", express.static("public"));
// app.use('/public', serveIndex(__dirname + '/public'));

const directoryPath = path.join(__dirname, "public");
//passsing directoryPath and callback function

const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

function niceBytes(x) {
    let l = 0,
        n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}

let files = [];
fs.readdirSync(directoryPath).forEach((file) => {
    let stat = fs.statSync(directoryPath + "/" + file);
    files.push({
        name: file,
        type: file.match(/[.]/) ? "file" : "folder",
        size: niceBytes(stat.size),
        date: stat.birthtime,
    });
});


app.get("/", function (req, res) {
    try {
        // res.sendFile(__dirname + "/public/index.html");
        res.render("index", { files: files, directory: "/" });
    } catch (error) {
        res.sendFile(__dirname + "/error.html");
    }
});

app.get("/file-upload", function (req, res) {
    try {
        res.sendFile(__dirname + "/index.html");
    } catch (error) {
        console.log(error);
    }
});

app.post("/upload-file", function (req, res) {
    
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded successfully!");
    });
    // res.send("Success")
});

app.get("/delete-file", function (req, res) {
    try {
        fs.unlinkSync(`${req.query.path}`);
        res.send("File deleted")
        console.log("File is deleted.");
    } catch (error) {
        res.send("error on deleting file")
        console.log(error);
    }
});

app.get("*", function (req, res) {
    try {
        var dirPath = path.join(__dirname, "public/" + req.url);
        var allfiles = [];
        fs.readdirSync(dirPath).forEach((file) => {
            let stat = fs.statSync(dirPath + "/" + file);
            allfiles.push({
                name: file,
                type: file.match(/[.]/) ? "file" : "folder",
                size: niceBytes(stat.size),
                date: stat.birthtime,
            });
        });
        res.render("index", { files: allfiles, directory: req.url });
    } catch (error) {
        res.sendFile(__dirname + "/error.html");
    }
});

app.use((error, req, res, next) => {
    res.json({ response: false, message: error.message });
});
app.listen(PORT, () => {
    console.log(`Server is running at ${PORT} port`);
});

//<link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" integrity="sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p" crossorigin="anonymous"/>
// fs.readdir(directoryPath, function (err, files) {
//     //handling error
//     if (err) {
//         return console.log('Unable to scan directory: ' + err);
//     }
//     //listing all files using forEach
//     files.forEach(function (file) {
//         // Do whatever you want to do with the file
//         files+=file
//         console.log(file);
//     });

// });

// app.get('/download', function(req, res){
//     const file = `${__dirname}/copyright-form.pdf`;
//     res.download(file); // Set disposition and send it.
//   });
//   app.get('/dexter', function(req, res){
//     const file = `${__dirname}/dexter.mkv`;
//     res.download(file); // Set disposition and send it.
//   });

/*async function getTorrents(query, page) {
    try {
        const { data } = await axios.get(
            `https://bitsearch.to/search?q=${query}&page=${page}`
        );
        const $ = cheerio.load(data);
        var torrents = { results: [] };
        $(".w3-bar .w3-bar-item b").each((index, el) => {
            if (index == 0) {
                torrents.total_results = $(el).text();
                torrents.total_pages = Math.ceil(Number($(el).text()) / 20);
            }
        });
        $(".info .title ").each((index, el) => {
            torrents.results.push({ name: $(el).text().toString().trim() });
        });
        $(".search-result > .info > div > .stats ").each((indexParent, ele) => {
            $(ele)
                .children()
                .each((index, el) => {
                    switch (index) {
                        case 0:
                            torrents.results[Math.floor(indexParent)].downloads =
                                $(el).text();
                            break;
                        case 1:
                            torrents.results[Math.floor(indexParent)].size = $(el).text();
                            break;
                        case 2:
                            torrents.results[Math.floor(indexParent)].seeders = $(el)
                                .text()
                                .toString()
                                .trim();
                            break;
                        case 3:
                            torrents.results[Math.floor(indexParent)].peers = $(el)
                                .text()
                                .toString()
                                .trim();
                            break;
                        case 4:
                            torrents.results[Math.floor(indexParent)].date = $(el).text();
                            break;

                        default:
                            break;
                    }
                });
        });
        $(".dl-torrent").each((index, el) => {
            torrents.results[index].torrents = $(el).attr("href");
        });
        $(".dl-magnet").each((index, el) => {
            torrents.results[index].magnets = $(el).attr("href");
        });
        torrents.response = true;
        return torrents;
    } catch (error) {
        console.log("====================================");
        console.log(error);
        console.log("====================================");
        throw new Error("Cannot find torrents");
    }
}

app.get("/torrent/search/:query/:page", async (req, res, next) => {
    try {
        const torrents = await getTorrents(req.params.query, req.params.page);
        res.json(torrents);
    } catch (error) {
        next(error);
    }
});
*/
