/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

//var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;
const CONNECTION_STRING = process.env.DB; 

module.exports = function (app) {
  
  app.route('/api/threads/:board') 
  
    .get(function (req, res){
      var board = req.params.board;      
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(board).find({}).sort({"bumped_on":-1}).limit(10)
          .project({"_id":1, "text":1, "created_on":1, "bumped_on":1, "replies._id":1, "replies.text":1, "replies.created_on":1})
          .toArray((err, data) => {
            data.forEach(function(val){
              val.replycount = val.replies.length;
              if(val.replies.length > 3) {
                val.replies = val.replies.slice(-3);
              }
            });
          if(err) {
           res.send(err); 
          }
          res.status(200).json(data);
        });
      });      
    })
  
    .post(function (req, res){
      var board = req.params.board;    
      if ((req.body.text === undefined) || (req.body.delete_password === undefined)) {        
        res.send("missing inputs");
      } else {
          var insert = {
            text: req.body.text,
            created_on: new Date(),
            bumped_on: new Date(),
            reported: false,
            delete_password: req.body.delete_password,
            replies:[]
          };        
          MongoClient.connect(CONNECTION_STRING, function(err, db) {
            db.collection(board).insertOne(insert, (err, data) => {
              if(err) {
               res.send(err); 
              }
              res.redirect('/b/'+board+'/');
            });
          });      
       }
    })
  
    .put(function (req, res){
      var board = req.params.board;
      var thread_id = req.body.thread_id;
      if (thread_id === undefined) {
        res.send("missing input");
      } else {  
        //console.log('db now')
          MongoClient.connect(CONNECTION_STRING, (err, db) => {
            db.collection(board).findAndModify({_id: ObjectId(thread_id)}, {}, {$set:{"reported":true}}, (err, doc) => {
               if  (err) {
                 res.send(err); 
               }               
                 res.send("reported");               
            });
          });
        }        
      }) 
  
    .delete(function(req, res){
      var board = req.params.board;
      var thread_id = req.body.thread_id;
      var pass = req.body.delete_password;
      if ((thread_id === undefined) || (pass === undefined)) {
        res.send("missing inputs");
      } else {
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
            db.collection(board).findAndModify({_id:ObjectId(thread_id),delete_password:pass}, {}, {}, {remove: true, new: false},(err, data) => {
            if (data.value === null) {
              res.send('incorrect password');
            } else {
              res.send('success');
            }
            });            
        }); 
      }
    });    
  
  app.route('/api/replies/:board')
    
    .get(function (req, res){
      var board = req.params.board;
      var thread_id = req.query.thread_id;
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(board).find({"_id":ObjectId(thread_id)}).project({"_id":1, "text":1, "created_on":1, "bumped_on":1,
                                                                        "replies._id":1, "replies.text":1,"replies.created_on":1, }).toArray((err, arr) => {
          if(err) {
           res.send(err); 
          }
          res.status(200).json(arr[0]);
        });
      });
      
    })
  
    .post(function(req, res){
      var board = req.params.board;
      var thread_id = req.body.thread_id;
      var reply = req.body.text;
      var replyPass = req.body.delete_password;      
      //
      if ((thread_id === undefined) || (reply === undefined) || (replyPass === undefined)) {
        res.send("missing inputs");
      } else {
        var update = {
          _id:new ObjectId(),
          text:reply,
          created_on: new Date(),
          delete_password:replyPass,
          reported:false
        };
        var bumped_on = new Date();
          MongoClient.connect(CONNECTION_STRING, function(err, db) {          
              db.collection(board).findOneAndUpdate({"_id":ObjectId(thread_id)},
                                                {$push: {"replies":update}, $set:{"bumped_on":bumped_on}},
                                                (err, object) => {
                if (err) {
                  res.send(err); 
                }
                if (object.value !== null) {
                  res.redirect('/b/'+board+'/'+thread_id+'/');
                } else {
                  res.send("no thread exist");
                }
                });                
         });
      }
    })
  
    .put(function (req, res){
      var board = req.params.board;
      var thread_id = req.body.thread_id;
      var reply_id = req.body.reply_id;
      if ((thread_id === undefined) || (reply_id === undefined)) {
        res.send("missing input");
      } else {
          MongoClient.connect(CONNECTION_STRING, function(err, db) {
            db.collection(board).findAndModify({"_id":ObjectId(thread_id),"replies_id":ObjectId(reply_id)}, {}, {$set:{"replies.$.reported":true}}, (err, data) => {
            if (err) {
              res.send(err);             
            } 
            if (data) {              
              res.send('reported');
            }
          });
        });
      }        
    })
  
    .delete(function(req, res){
      var board = req.params.board;
      var thread_id = req.body.thread_id;
      var reply_id = req.body.reply_id;
      var replyPass = req.body.delete_password;
      if ((thread_id === undefined) || (reply_id === undefined) || (replyPass === undefined)) {
        res.send("missing inputs");
      } else {
        var update = '[deleted]';
        MongoClient.connect(CONNECTION_STRING, function(err, db) {
          db.collection(board).findOne({"_id":ObjectId(thread_id)}, (err, data) => {
            if (err) {
              res.send(err);             
            } 
            if (data) {
              var replies = data.replies;
              for (var i =0; i<replies.length; i++) {
                if (replies[i]._id == reply_id) {
                  if (replies[i].delete_password == replyPass){
                    replies[i].text=update;
                      db.collection(board).updateOne({"_id":ObjectId(thread_id)}, {$set:{"replies":replies}}, (err, data) => {
                        if (err) {
                          res.send(err);             
                        } 
                        res.send('success');
                      })
                  } else {
                    res.send('incorrect password');
                  }
                } else {
                  res.send('incorrect reply id');
                }
              }              
            } else {
              res.send('incorrect thread id')
            }
          });            
        });
      }
  });  
};
