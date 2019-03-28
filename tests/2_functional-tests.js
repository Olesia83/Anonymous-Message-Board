/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  var thread_id;
  var thread_id2;
  var reply_id;
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('2 new threads, 1 to be deleted', function(done) {
       chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'testing 1',
          delete_password: '0000'
        })
        .end(function(err, res){          
          assert.equal(res.status, 200);
        });
        chai.request(server)
        .post('/api/threads/test')
        .send({
          text: 'testing 2',
          delete_password: '0000'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);          
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('get not more than 10 threads and not more than 3 replies in each', function(done) {
        chai.request(server)
          .get('/api/threads/test')
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.notProperty(res.body[0], 'reported');
            assert.notProperty(res.body[0], 'delete_password');
            assert.property(res.body[0], 'replies');
            assert.property(res.body[0], '_id');
            assert.isBelow(res.body.length, 11);
            assert.isBelow(res.body[0].replies.length, 4);
            assert.isArray(res.body[0].replies);
            thread_id = res.body[0]._id;
            thread_id2 = res.body[1]._id;
            done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('delete one thread password correct', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({thread_id:thread_id2,
                 delete_password:'0000'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
      });
      test('delete one thread password incorrect', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({thread_id:thread_id,
                 delete_password:'1111'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
        });
      });
    });
    
    suite('PUT', function() {    
      test('report thread', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({thread_id:thread_id})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
        });
      });
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {    
      test('reply to thread', function(done) {       
        chai.request(server)
        .post('/api/replies/test')
        .send({
          thread_id:thread_id,
          text: 'reply testing',
          delete_password: '1111'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);          
          done();
        });
      });
    });
    
    suite('GET', function() {
      test("get a thread's replies", function(done) {
        chai.request(server)
          .get('/api/replies/test')
          .query({thread_id:thread_id})
          .end(function(err, res){
            assert.equal(res.status, 200);          
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');          
            assert.property(res.body, 'replies');          
            assert.isArray(res.body.replies);
            assert.notProperty(res.body, 'reported');
            assert.notProperty(res.body, 'delete_password');            
            assert.notProperty(res.body.replies[0], 'reported');
            assert.notProperty(res.body.replies[0], 'delete_password');
            assert.equal(res.body.replies[res.body.replies.length-1].text, 'reply testing');
            reply_id=res.body.replies[res.body.replies.length-1]._id;
            done();
        });
      });
    });
    
    suite('PUT', function() {
      test('report reply', function(done) {
        chai.request(server)
          .put('/api/replies/test')
          .send({thread_id:thread_id,
                 reply_id:reply_id})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
        });
      });
    });
    
    suite('DELETE', function() {
      
      test('delete one thread password incorrect', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id:thread_id,
                 reply_id:reply_id,
                 delete_password:'2222'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'incorrect password');
            done();
        });
      });
      test('delete one thread password correct', function(done) {
        chai.request(server)
          .delete('/api/replies/test')
          .send({thread_id:thread_id,
                 reply_id:reply_id,
                 delete_password:'1111'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
      });
    });
    
  });

});
