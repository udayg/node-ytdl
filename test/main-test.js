var assert      = require('assert');
var path        = require('path');
var fs          = require('fs');
var muk         = require('muk');
var streamEqual = require('stream-equal');


var url = 'http://www.youtube.com/watch?v=';
var id1 = '_HSylqgVYQI';
var url1 = url + id1;
var page1 = path.resolve(__dirname, 'files', 'video1.html');
var info1 = require('./files/info1.json');

var id2 = '_HSylqgyyyy';
var url2 = url + id2;
var page2 = path.resolve(__dirname, 'files', 'video2.html');

var id3 = '_HSylqgVYQI';
var url3 = url + id3;
var video3 = path.resolve(__dirname, 'files', 'video3.flv');

var video4 = path.resolve(__dirname, 'files', 'video4.flv');


describe('ytdl.getInfo()', function() {
  it('Returns correct video metainfo', function(done) {
    var ytdl = muk('..', {
      request: function request(options, callback) {
        fs.readFile(page1, 'utf8', function(err, data) {
          if (err) return callback(err);

          callback(null, { statusCode: 200 }, data);
        });
      },
      eventvat: function() {
        return { set: function() {}, get: function() {} };
      }
    });

    ytdl.getInfo(url1, function(err, info) {
      if (err) return done(err);

      assert.deepEqual(info, info1);
      done();
    });

  });
});


describe('ytdl.getInfo() from a non-existant video', function() {
  it('Should give an error', function(done) {
    var ytdl = muk('..', {
      request: function request(options, callback) {
        fs.readFile(page2, 'utf8', function(err, data) {
          if (err) return callback(err);

          callback(null, { statusCode: 200 }, data);
        });
      },
      eventvat: function() {
        return { set: function() {}, get: function() {} };
      }
    });

    ytdl.getInfo(url2, function(err) {
      assert.ok(err);
      assert.equal(err.message, 'Error 100: The video you have requested is not available. If you have recently uploaded this video, you may need to wait a few minutes for the video to process.');
      done();
    });
  });
});


describe('download', function() {
  it('Should be pipeable and data equal to stored file', function(done) {
    var ytdl = muk('..', {
      request: function request() {
        var rs = fs.createReadStream(video3);
        process.nextTick(rs.emit.bind(rs, 'response', {
          statusCode: 200,
          headers: { 'content-length': 42 }
        }));
        return rs;
      },
      eventvat: function() {
        return {
          set: function() {},
          get: function() { return info1; },
          exists: function() { return true; }
        };
      }
    });

    var stream = ytdl(url3, {
      filter: function(format) { return format.container === 'mp4'; }
    });
    var filestream = fs.createReadStream(video3);

    var infoEmitted = false;
    stream.on('info', function() {
      infoEmitted = true;
    });


    streamEqual(filestream, stream, function(err, equal) {
      if (err) return done(err);

      assert.ok(infoEmitted);
      assert.ok(equal);
      done();
    });
  });
});


describe('download with `start`', function() {
  it('Should be pipeable and data equal to stored file', function(done) {
    var ytdl = muk('..', {
      request: function request() {
        var rs = fs.createReadStream(video4);
        process.nextTick(rs.emit.bind(rs, 'response', {
          statusCode: 200,
          headers: { 'content-length': 42 }
        }));
        return rs;
      },
      eventvat: function() {
        return {
          set: function() {},
          get: function() { return info1; },
          exists: function() { return true; }
        };
      }
    });

    var stream = ytdl(url3, { start: '5s' });
    var filestream = fs.createReadStream(video4);

    streamEqual(filestream, stream, function(err, equal) {
      if (err) return done(err);

      assert.ok(equal);
      done();
    });
  });
});
