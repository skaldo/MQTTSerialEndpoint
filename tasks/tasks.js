/**
 * Created by skaldo on 10/22/14.
 */

/* USAGE:
 tasks = new TBusTasks(tQueue);
 tasks.schedule("10,20,30,40,50 * * * * *", [0x07, 0x00, 0x00, 0x01], [0x01]);
 tasks.schedule("10,20,30,40,50 * * * * *", [0x07, 0x00, 0x00, 0x02], [0x01]);
 */

var CronJob = require('cron').CronJob;

/**
 * Constructor
 * @constructor
 */
var Task = function(){
    var self;

    self = this;
    self.tasks = [];
};

/**
 * Schedules a send task
 * @param cronString
 * @param context - tbus or lora object. the send method has to be implemented.
 */
Task.prototype.schedule = function(cronString, context){
    var self,
        taskFn,
        task,
        params;

    self = this;

    if(typeof context.send != 'function'){
        console.log("the context does not have send function.");
        return;
    }

    if(arguments.length < 3){
        console.log("not enough arguments for the send method.");
        return;
    }

    params = [];
    for(var i=2; i<arguments.length; i++){
        params.push(arguments[i]);
    }

    taskFn = function(){
        context.send.apply(context, params);
    };

    task = new CronJob(cronString, taskFn, function () {
            // This function is executed when the job stops
        },
        true /* Start the job right now *///,
        //timeZone /* Time zone of this job. */
    );
    self.tasks.push({
        cronString: cronString,
        params: params,
        sp: context.sp,
        task: task
    });
};

module.exports = Task;