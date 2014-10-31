'use strict';

var urls = [
//  'http://www.avejuice.com/store/tobacco-flavors-bobas-bounty-c-8044_8045.html',
//  'http://shop.vaperev.com/devices/mechanical/atmomixani.html'
  //
  //'https://www.atmomixani.gr/index.php/en/?option=com_virtuemart&nosef=1&view=cart&task=addJS&format=json&lang=en&quantity%5B%5D=1&option=com_virtuemart&view=cart&virtuemart_product_id%5B%5D=1660&virtuemart_manufacturer_id=6&virtuemart_category_id%5B%5D=21&_=1373868826467',

  // nemesis brass
  'https://www.atmomixani.gr/index.php/en/?option=com_virtuemart&nosef=1&view=cart&task=addJS&format=json&lang=en&quantity%5B%5D=1&option=com_virtuemart&view=cart&virtuemart_product_id%5B%5D=1760&virtuemart_manufacturer_id=6&virtuemart_category_id%5B%5D=21&_=1375143832380',
  
  // diver
  'http://www.atmistique.gr/en/craven-series?page=shop.product_details&flypage=flypage_images.tpl&product_id=480&category_id=75&vmcchk=1'
];


var http = require('http'),
  https = require('https'),
  crypto = require('crypto'),
  nodemailer = require("nodemailer"),
  mClient = require('mongodb').MongoClient,
  collection,
  smtp = nodemailer.createTransport('SMTP', {
    service : 'Gmail',
    auth : {
      user : 'vapechecker@gmail.com',
      pass : 'suck3rfr33'
    }
  }),
  mailOpts = {
    from : 'Vape Check <vapechecker@gmail.com>',
    to : 'cnojima@gmail.com',
    subject : 'Vape Check Alert'
  };


mClient.connect('mongodb://127.0.0.1:27017/vapecheck', function(err, db) {
  collection = db.collection('url_hash');
  process.emit('mongoReady');
});





function checkMd5(s) {
  var hex;
  return crypto.createHash('md5').update(s, 'utf8').digest('hex');
}




function handleResponse(res) {
  var chunk = '',
    url = res.req.path;
  
  function handleData(s) {
    chunk += s;
  }

// console.log(res);

  res.on("data", handleData);
  res.on('end', function() {
    var md5 = checkMd5(chunk),
      find = { id : url };

    console.log(md5, chunk);

    collection.findOne(find, function(err, o) {
      // console.log('findOne', o);

      if(o && o.hash) {
        if(o.hash == md5) {
          console.log('matching hash for [ ' + url + ' ], continuing');
        } else {
          console.log('hash mismatch - sending alert email');
          
          mailOpts.text = 'Page changed for [ ' + url + ' ].  gogogogogo!';
          mailOpts.html = 'Page changed for [ <a href="' + url + '">' + url + '</a> ].  gogogogogo!';

          smtp.sendMail(mailOpts, function(err, res) {
            if(err) {
              console.log(err);
              throw new Error(err);
            } else {
              console.log('email sent', res.message);
            }
          });
        }
      } else {
        collection.findAndModify(find, [], {
          id : url,
          hash : md5
        }, {
          upsert : true
        }, function(err, o) {
          // console.log(o);
        });
      }
    });
  });
}



function checkUrl(url) {
  var exUrl = url.split('://')
    exUrl2 = exUrl[1].split('/');


  if(exUrl[0] == 'https') {
    https.request({
      protocol : exUrl[0] + ':',
      host : exUrl2.shift(),
      path : exUrl2.join('/'),
      headers : {
        'Cookie'              : 'aveAgeVerified=1;',
        'User-Agent'          : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.71 Safari/537.36',
        'X-Requested-With'    : 'XMLHttpRequest'
      }
    }, handleResponse).end();
  } else {
    http.request({
      protocol : exUrl[0] + ':',
      host : exUrl2.shift(),
      path : exUrl2.join('/'),
      headers : {
        Cookie : 'aveAgeVerified=1;'
      }
    }, handleResponse).end();
  }
}



process.on('mongoReady', function() {
  // setInterval(function() {
    for(var i=0, n=urls.length; i<n; i++) {
      checkUrl(urls[i]);
    }

    //process.exit();
  // }, 5000);
});