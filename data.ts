import fs = require('fs');
var growl = require('./growl')
var config = require('./config.json');

const dataPath = 'data.json';
const hostUrl = config.url;

interface Comment {
    message: string;
    timestamp: number;
}

interface Topic {
    votes: Array<number>;
    name: string;
    comments: Array<Comment>
}

interface TopicList {
    topics: Array<Topic>;
}

interface FetchedTopic {
    name: string; 
    votes: number;
}

var data: {pains: TopicList, likes: TopicList};
if(fs.existsSync(dataPath)){
    var text: any = fs.readFileSync(dataPath)
    data = JSON.parse(text);
}
if(!('pains' in data)) {
    data = { pains: { topics: [] }, likes: { topics: [] } };
}

function daydiff(first: number, second: number) {
    return (first - second)/(1000*60*60*24);
}

var sixMonthsInDays = 183;
var lengthOfDecay = sixMonthsInDays;

function getScore(date: number) {
    var days = daydiff(Date.now(), date);
    var value = lengthOfDecay - days;
    return Math.max(0, value) / lengthOfDecay;
}

function sortByVote(a: FetchedTopic, b: FetchedTopic) {
    return a.votes - b.votes;
}

function saveData(){
    fs.writeFileSync(dataPath, JSON.stringify(data));
}


function removeTopics(source: TopicList, topics: Array<number>){
    if(topics.length > 0){
        topics.forEach(function(i) {
            source.topics.splice(i, 1);
        });
        saveData();
    }
}

enum TopicType{
    Pain,
    Like
}

export class DataModule {

    private type: string;
    
    constructor(topicType: TopicType, private data: TopicList){
        this.type = topicType == TopicType.Pain ? "Pain" : "Like"; 
    }
    
    getAll() {
        var allTopics: Array<FetchedTopic> = [];
        var indexesToRemove: Array<number> = [];
        for(var i in this.data.topics) {
            var voteCount = 0;
            var topic = this.data.topics[i];
            topic.votes.forEach( (voteDate) => {
                voteCount += getScore(voteDate);
            })
            if(voteCount == 0){
                indexesToRemove.push(i);
            }
            else {
                allTopics.push({name: topic.name, votes: voteCount});
            }
        }
        
        removeTopics(this.data, indexesToRemove.reverse());
    
        return allTopics.sort(sortByVote).reverse();
    }
    
    getTop() {
        return this.getAll().slice( 0, 5);
    }
    
    getComments(topic: string) {
        for(var i in this.data.topics)
        {
            if(this.data.topics[i].name.toLowerCase() == topic.toLowerCase()){
                return this.data.topics[i].comments;
            } 
        }
        return [];
    }
    
    add(topic: string){
        var found = false;
        for(var i in this.data.topics){
            if(this.data.topics[i].name.toLowerCase() == topic.toLowerCase()) {
                this.data.topics[i].votes.push(Date.now())
                found = true;
                break;
            }
        }
        if(!found){
            this.data.topics.push({name: topic, votes: [Date.now()], comments: []});
        }
        growl(topic, { title: this.type + " Posted", app: config.appName, sticky: 'true', 
                    notification_type: this.type + " Comment Posted", url: hostUrl });
        saveData();
    }
    
    addComment(topic: string, comment: string){
        for(var i in this.data.topics){
            if(this.data.topics[i].name.toLowerCase() == topic.toLowerCase()) {
                var newComment: Comment = {"message": comment, "timestamp": Date.now()};
                if(this.data.topics[i].comments == null) {
                    this.data.topics[i].comments = [newComment];
                }
                else{
                    this.data.topics[i].comments.push(newComment);
                }
                var displayNotification = comment.substr(0, 10);
                if(comment.length > 10 ) displayNotification += "...";
                growl(displayNotification, { title: "Comment for: " + topic, app: config.appName, sticky: 'true', 
                    notification_type: this.type + " Comment Posted", url: hostUrl + "?page=comments&" + this.type.toLowerCase() + "=" + topic  });
                saveData();
                break;
            }
        }
    }
}

export var Instance = { pains: new DataModule(TopicType.Pain, data.pains), likes: new DataModule(TopicType.Like, data.likes) };