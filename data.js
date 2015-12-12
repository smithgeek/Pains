var fs = require('fs');
var growl = require('./growl');
var config = require('./config.json');
var dataPath = 'data.json';
var hostUrl = config.url;
var data;
if (fs.existsSync(dataPath)) {
    var text = fs.readFileSync(dataPath);
    data = JSON.parse(text);
}
if (!('pains' in data)) {
    data = { pains: { topics: [] }, likes: { topics: [] } };
}
function daydiff(first, second) {
    return (first - second) / (1000 * 60 * 60 * 24);
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
function saveData() {
    fs.writeFileSync(dataPath, JSON.stringify(data));
}
function removeTopics(source, topics) {
    if (topics.length > 0) {
        topics.forEach(function (i) {
            source.topics.splice(i, 1);
        });
        saveData();
    }
}
var TopicType;
(function (TopicType) {
    TopicType[TopicType["Pain"] = 0] = "Pain";
    TopicType[TopicType["Like"] = 1] = "Like";
})(TopicType || (TopicType = {}));
var DataModule = (function () {
    function DataModule(topicType, data) {
        this.data = data;
        this.type = topicType == TopicType.Pain ? "Pain" : "Like";
    }
    DataModule.prototype.getAll = function () {
        var allTopics = [];
        var indexesToRemove = [];
        for (var i in this.data.topics) {
            var voteCount = 0;
            var topic = this.data.topics[i];
            topic.votes.forEach(function (voteDate) {
                voteCount += getScore(voteDate);
            });
            if (voteCount == 0) {
                indexesToRemove.push(i);
            }
            else {
                allTopics.push({ name: topic.name, votes: voteCount });
            }
        }
        removeTopics(this.data, indexesToRemove.reverse());
        return allTopics.sort(sortByVote).reverse();
    };
    DataModule.prototype.getTop = function () {
        return this.getAll().slice(0, 5);
    };
    DataModule.prototype.getComments = function (topic) {
        for (var i in this.data.topics) {
            if (this.data.topics[i].name.toLowerCase() == topic.toLowerCase()) {
                return this.data.topics[i].comments;
            }
        }
        return [];
    };
    DataModule.prototype.add = function (topic) {
        var found = false;
        for (var i in this.data.topics) {
            if (this.data.topics[i].name.toLowerCase() == topic.toLowerCase()) {
                this.data.topics[i].votes.push(Date.now());
                found = true;
                break;
            }
        }
        if (!found) {
            this.data.topics.push({ name: topic, votes: [Date.now()], comments: [] });
        }
        growl(topic, { title: this.type + " Posted", app: config.appName, sticky: 'true',
            notification_type: this.type + " Comment Posted", url: hostUrl });
        saveData();
    };
    DataModule.prototype.addComment = function (topic, comment) {
        for (var i in this.data.topics) {
            if (this.data.topics[i].name.toLowerCase() == topic.toLowerCase()) {
                var newComment = { "message": comment, "timestamp": Date.now() };
                if (this.data.topics[i].comments == null) {
                    this.data.topics[i].comments = [newComment];
                }
                else {
                    this.data.topics[i].comments.push(newComment);
                }
                var displayNotification = comment.substr(0, 10);
                if (comment.length > 10)
                    displayNotification += "...";
                growl(displayNotification, { title: "Comment for: " + topic, app: config.appName, sticky: 'true',
                    notification_type: this.type + " Comment Posted", url: hostUrl + "?page=comments&" + this.type.toLowerCase() + "=" + topic });
                saveData();
                break;
            }
        }
    };
    return DataModule;
})();
exports.DataModule = DataModule;
exports.Instance = { pains: new DataModule(TopicType.Pain, data.pains), likes: new DataModule(TopicType.Like, data.likes) };
//# sourceMappingURL=data.js.map