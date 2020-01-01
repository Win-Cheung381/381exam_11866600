const express = require('express');
const app = express();
const fs = require('fs');
const formidable = require('formidable');
var ExifImage = require('exif').ExifImage;

app.set('view engine', 'ejs');

app.use((req, res, next) => {
    if (req.path == "/upload" || req.path == "/uploadFile" || req.path == "/map") {
        next();
    } else {
        res.redirect('/upload');
    }

});

app.get("/upload", function (req, res) {
    let error = '';
    if (req.query.fail == 'noExif') {
	console.log('Error:NO exif information');
        error = 'Unable to extract Makernote information as it is in an unsupported or unrecognized format!';
    }
    res.render('upload', { error: error });

});


app.post("/uploadFile", function (req, res) {
    if (req.method.toLowerCase() == "post") {
        // parse a file upload
        const form = new formidable.IncomingForm();
        const photo = {};
        form.parse(req, (err, fields, files) => {
            photo['title'] = fields.title;
            photo['description'] = fields.description;
            photo['mimetype'] == files.sampleFile.mimetype;

            var have_gps = true;

            fs.readFile(files.sampleFile.path, (err, data) => {
                photo['image'] = new Buffer.from(data).toString('base64');
                try {
                    new ExifImage({ image: files.sampleFile.path }, function (error, exifData) {
                        if (error) {
                            res.redirect('/upload?fail=noExif');
                        }else {
                            console.log(exifData);

                            photo['make'] = exifData.image.Make;
                            photo['model'] = exifData.image.Model;
                            photo['createdDate'] = exifData.exif.CreateDate;

			    photo['lon'] = getGpsInfo(exifData.gps.GPSLongitude, exifData.gps.GPSLongitudeRef);
                            photo['lat'] = getGpsInfo(exifData.gps.GPSLatitude, exifData.gps.GPSLatitudeRef);
				
			    if (photo.lat == '' || photo.lon == '')
                                have_gps = false;

			    console.log('have_gps:'+have_gps);

                           res.render('photo', { photo: photo, have_gps: have_gps});
                        }
                    });
                }catch (error) {
                    res.redirect('/upload?fail=noExif');
                }
            });
        });
    }
});

app.get("/uploadFile", function (req, res) {
res.redirect('/upload');
});

app.get("/map", function (req, res) {
    res.render("displayMap", { lon: req.query.lon, lat: req.query.lat });
});

function getGpsInfo(gps, ref) {
    if (gps == null || ref == null) {
	console.log('NO GPS information');
        return '';
    } else {
	console.log(gps);
        let temp = gps[0] + (gps[1] / 60) + (gps[2] / 3600);
        if (ref == "W" || ref == "S") {
            temp = temp * -1;
        }
	console.log(temp);
        return temp;
    }
}

app.listen(process.env.PORT || 8099);
