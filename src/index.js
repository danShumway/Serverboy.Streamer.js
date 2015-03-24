/**
 * Created by shumw_000 on 3/8/2015.
 */

(function() { "use strict"; })();

var strategies = require("./COMPRESSION_STRATEGIES");

function Stream(gameboy, io) {

    var _this = this;
    _this.properties = {
        stream: {
            maxFrameRate: 1000 / 120, //in milliseconds.
            chunkSize: 1, //in seconds.
            skip: 2 //Number of frames that pass for each 1 frame sent.
        },
        update: {
            onFrameReady: undefined, //Actual update function to call (your emulator logic goes here.
            onFrameComplete: undefined, //Optional function to call each time a frame is finished.
            context: undefined //Optional object to use for this.
        }
    };

    //------------------PRIVATE-------------------------------------

    var elapsedTime;
    var frames = 0;
    var video;
    var chunkTimeElapsed;
    var keyframe;

    var running = false;

    //-------------Set up Serverboy.

    gameboy.frames = {

    };


    //--------------Define loop.
    var newLoop = function() {
        //-------------------Run the frame.
        var _prop = _this.properties.update;
        if(typeof(_prop.onFrameReady) === 'function') {
            var results = _prop.onFrameReady.call(_prop.context || this);
            if (typeof(_prop.onFrameComplete) === 'function') {
                _prop.onFrameComplete(results);
            }

            //-----------------Stream results.
            gameboy.doFrame();
            if(frames%_this.properties.stream.skip === 0) {
                if (keyframe) {
                    video.push(strategies.COMPRESSED_FULL(gameboy.getScreen()));
                    keyframe = false;
                } else {
                    video.push(strategies.COMPRESSED_PARTIAL(gameboy.getScreen(), video[video.length - 1]));
                }
            }

            frames++; //How many frames we've sent.

            var x = process.hrtime(chunkTimeElapsed);

            if(x[0] > _this.properties.stream.chunkSize-1) {

                if(io) {
                    console.log('emitting video');
                    io.emit('video', video);
                }

                x = process.hrtime(chunkTimeElapsed);
                chunkTimeElapsed = process.hrtime();

                //ToDo: Remove these lines.
                //console.log("SIZE: " + internals.video[0].length + ", " + Object.keys(internals.video[internals.video.length - 2]).length);
                console.log("TIME/FRAMES: " + (x[0] + (x[1]/1000000)/1000) + ", " + video.length);

                video = []; //Should be moved up.
                keyframe = true;
            }
        }

        //ToDo: Modify passed in gameboy instance here to add video compiling based on passed in strategy.

        if(running) { setTimeout(newLoop, _this.properties.stream.maxFrameRate); }
    };

    //----------------ENTRY POINT-------------------------------------

    /**
     * Starts running the stream.
     */
    this.start = function() {
        //For consistency in the interface.  You should need to be stopped before you can start.
        if(!running) {
            //set info.
            frames = 0;
            elapsedTime = 0;
            video = [];
            chunkTimeElapsed = process.hrtime();
            keyframe = true;
            //start
            running = true;
            newLoop();
        }
    };

    /**
     * Shuts down the stream (can be started again with no additional configuration)
     */
    this.stop = function() {
        running = false;
    };
}

module.exports = Stream;

//Should be loaded.
//var Stream = require("stream");
//Set up my stuff.
//var stream = new Stream(gameboy_instance, configured_socket);
//stream.properties.stuff.stuff = stuff.
//stream.properties.update.onFrameReady = myFunction;
//etc...
//stream.start(); //Starts up the main loop.
