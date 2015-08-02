var fs = require('fs');
var growl = require('./growl')

var dataPath = 'data.json';
var hostUrl = "http://g/pain/";

var data;
if(fs.existsSync(dataPath)){
    data = JSON.parse(fs.readFileSync(dataPath));
}
else {
    data = { topics: [] };
}

function daydiff(first, second) {
    return (first - second)/(1000*60*60*24);
}

var sixMonthsInDays = 183;
var lengthOfDecay = sixMonthsInDays;

function getScore(date) {
    var days = daydiff(Date.now(), date);
    var value = lengthOfDecay - days;
    return Math.max(0, value) / lengthOfDecay;
}

function sortByVote(a, b) {
    return a.votes - b.votes;
}

function saveData(){
    fs.writeFileSync(dataPath, JSON.stringify(data));
}

var dataModule = {};

function removeTopics(topics){
    if(topics.length > 0){
        topics.forEach(function(i) {
            data.topics.splice(i, 1);
        });
        saveData();
    }
}

dataModule.getAllPains = function() {
    var allTopics = [];
    var indexesToRemove = [];
    for(var i in data.topics) {
        var voteCount = 0;
        var topic = data.topics[i];
        topic.votes.forEach( function(voteDate) {
            voteCount += getScore(voteDate);
        })
        if(voteCount == 0){
            indexesToRemove.push(i);
        }
        else {
            allTopics.push({name: topic.name, votes: voteCount});
        }
    }
    
    removeTopics(indexesToRemove.reverse());

    return allTopics.sort(sortByVote).reverse();
}

dataModule.getTopPains = function() {
    return dataModule.getAllPains().slice( 0, 5);
}

dataModule.getComments = function(pain) {
    for(var i in data.topics)
    {
       if(data.topics[i].name.toLowerCase() == pain.toLowerCase()){
           return data.topics[i].comments;
       } 
    }
    return [];
}

dataModule.addPain = function(pain){
    var found = false;
    for(var i in data.topics){
        if(data.topics[i].name.toLowerCase() == pain.toLowerCase()) {
            data.topics[i].votes.push(Date.now())
            found = true;
            break;
        }
    }
    if(!found){
        data.topics.push({name: pain, votes: [Date.now()], comments: []});
    }
    growl(pain, { title: "Pain Posted", app: 'PainWebApp', sticky: 'true', 
                notification_type: "Pain Comment Posted", url: hostUrl });
    saveData();
}

dataModule.addComment = function(pain, comment){
    for(var i in data.topics){
        if(data.topics[i].name.toLowerCase() == pain.toLowerCase()) {
            var newComment = {"message": comment, "timestamp": Date.now()};
            if(data.topics[i].comments == null) {
                data.topics[i].comments = [newComment];
            }
            else{
                data.topics[i].comments.push(newComment);
            }
            var displayNotification = comment.substr(0, 10);
            if(comment.length > 10 ) displayNotification += "...";
            growl(displayNotification, { title: "Comment for: " + pain, app: 'PainWebApp', sticky: 'true', 
                notification_type: "Pain Comment Posted", url: hostUrl + "?page=comments&pain=" + pain  });
            saveData();
            break;
        }
    }
}
module.exports = dataModule;
