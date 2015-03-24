/**
 * Created by shumw_000 on 3/8/2015.
 * ToDo: check to see if it's causing firefox crashes.  Might be a memory leak somewhere.
 * ToDo: add support for de-compression strategies.
 */

(function() {
    "use strict";

    var canvas;
    var ctx;
    var ctx_data;

    /*
    * Serverboy sends as many frames as it can pump out in 1 second.
    * However, because of overhead from Socket.io, those frames will take
    * longer than 1 second to get here.  If we're on a slow connection, it
    * might be even longer. We calculate the average amount of time it takes for
    * Serverboy to send us a bundle of frames, then use that to set our framerate.
     */

    var frames; //[] used to store frameBuffer for next second.
    var time; //Date() used to tell how long it's been since the last bundle of frames was sent.
    var lastTime; //Date() of last frame bundle arrival.
    var averageChunkTime = 1000; //What the average amount of time we need to wait for a bundle is.

    var samples; //How many bundles we've currently recieved.
    const MAX_SAMPLES = 2; //restricts the number of samples we need before we can calculate the average frame arrival time.

    var timeLeft; //How much time is left before we expect Serverboy to send us more frames.
    var lastFrameDisplay; //What was the time when I displayed the last frame.
    var timeRefresh; //How long should we wait before displaying the next frame?


    var socket; var strategies;
    var initialized = false;
    var strategies;

    window.reciever = {
        init: function(canvas_id, _strategies) {

            if(io) {
                console.log(canvas_id);
                canvas = document.getElementById(canvas_id);
                ctx = canvas.getContext('2d');
                ctx_data = ctx.createImageData(160, 144);
                strategies = _strategies;


                //This is used internally to make sure methods aren't called in the wrong order.
                initialized = true;
            } else {
                console.log('Serverboy-streamer requires local socket.io to work. ');
            }
        },

        start: function(ip) {
            if(initialized) {

                var _this = this;
                //Fill ctx_data with white.
                var i;
                for(i = 0; i < ctx_data.data.length; i++) {
                    ctx_data.data[i] = 0xFF;
                }

                //Reset frame data and timers.
                frames = [];
                time = new Date(); lastTime = undefined;
                samples = -1;
                timeLeft = 0;
                timeRefresh = 0;

                //Connect to server and start loop
                console.log('starting loop');
                socket = io.connect(ip);
                socket.on('video', function(data) {
                    if(!lastTime){
                        lastTime = Date.now();
                    } else {
                        var t = lastTime;
                        lastTime = Date.now();
                        t = lastTime - t;
                    }

                    if(samples === 1) {
                        averageChunkTime = t;
                    } else if (samples > 1) {
                        //Compute new average time.
                        //use (samples+1)
                        averageChunkTime = (averageChunkTime*samples + t)/(samples+1);
                    } else {
                        //You don't have an averageChunkTime, don't mess with the frame.
                        samples++;
                        return;
                    }

                    //Allow for faster adjustment of average.
                    if(samples < MAX_SAMPLES) {
                        samples++;
                    }

                    frames = frames.concat(data);
                    timeLeft = averageChunkTime;
                    lastFrameDisplay = undefined;
                    timeRefresh = averageChunkTime/frames.length;

                    console.log(frames[0][0] + ", " + frames[0][1]);
                });

                //Set up display loop.
                var draw = function() {

                    if(frames.length > 0 && averageChunkTime !== undefined) {
                        //pull off a frame and draw it.
                        var frame = frames.shift();

                        //
                        //var i; var place; var color;
                        /*for (i = 0; i < frame.length; i++) {
                         place = Math.floor(frame[i]);
                         ctx_data.data[place] = (frame[i] - place)*1000;
                         }*/
                        /*for (i = 0; i < frame.length; i++) {
                         place = Math.floor(frame[i]);
                         color = (frame[i] - place)*1000;

                         //Swap place with where it should go on the destination.
                         place = place + Math.floor(place/3)*1;
                         ctx_data.data[place] = color;
                         }*/
                        /*for (i = 0; i < frame.length; i+=2) {
                            place = Math.floor(frame[i]);
                            //color = (frame[i] - place)*100000000;
                            color = frame[i+1];

                            //Swap place with where it should go on the destination.
                            place = place + Math.floor(place/1)*3;

                            ctx_data.data[place] = (color >> 16) & 0xFF; //Red
                            ctx_data.data[++place] = (color >> 8) & 0xFF; //Green
                            ctx_data.data[++place] = color & 0xFF; // Blue
                        }*/

                        strategies[strategies.MAP[frame[0]]](frame, ctx_data.data);

                        _this.onFrame(ctx_data); //Call display hook.

                        //Set up timer.
                        setTimeout(draw, timeRefresh);//timeLeft/frames.length);
                        window.dataStuff = {
                            length: frames.length,
                            timeRefresh: timeRefresh
                        };
                        window.frames = frames;
                    } else {
                        setTimeout(draw, 0)
                    }
                };

                draw();

            } else {
                console.log('Serverboy-streamer can not start without being initialized. ');
            }
        },

        //Will get called every time there's a new frame decompressed and ready to draw.
        //Override with your own method for drawing here if desired.
        onFrame: function(ctx_data) {
            ctx.putImageData(ctx_data, 0, 0);
        },

        stop: function() {
            if(initialized) {

                //ToDo: Add Stopping.
                throw "Serverboy-streaming: Stop is not implemented. "

            } else {
                console.log('Serverboy-streamer can not start without being initialized. ');
            }
        }
    };

})();