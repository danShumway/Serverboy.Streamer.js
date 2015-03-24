console.log('I will kill you all');

//Figure out a way to get the trigger from it.
(function() {
    "use strict";

    console.log("WHY!");

    window.DECOMPRESSION_STRATEGIES = {
        MAP: {
            "-1": "COMPRESSED_FULL_OLD",
            "-2": "COMPRESSED_FULL",
            "-3": "COMPRESSED_PARTIAL"
        },

        "COMPRESSED_FULL_OLD": function (frame, destination) {
            var i, place, color;

            //Skip the first byte since it only exists to tell us the compression format.
            for (i = 1; i < frame.length; i += 2) {
                place = Math.floor(frame[i]);
                color = frame[i + 1];

                //Swap place with where it should go on the destination.
                place = place + Math.floor(place / 1) * 3;

                destination[place] = (color >> 16) & 0xFF; //Red
                destination[++place] = (color >> 8) & 0xFF; //Green
                destination[++place] = color & 0xFF; //Blue
            }
        },

        "COMPRESSED_FULL": function (frame, destination) {
            var i, j, place, truePlace, color, trueColor = [];

            //Skip the first int since it only exists to tell us the compression format.
            for (i = 1; i < frame.length; i += 1) {
                place = i - 1; //Subtrack 1 to take into account that the first int was compression format.
                color = frame[i];

                //Swap place with where it should go on the destination.
                truePlace = place + Math.floor(place / 1) * 3;

                trueColor[0] = (color >> 16) & 0xFF; //Red
                trueColor[1] = (color >> 8) & 0xFF; //Green
                trueColor[2] = color & 0xFF; //Blue

                destination[truePlace] = trueColor[0];
                destination[++truePlace] = trueColor[1];
                destination[++truePlace] = trueColor[2];

                //Repeating color?
                if (frame[i + 1] < 0) {

                    //loop through the repeats.
                    for(j = 0; j < frame[i+1] * -1; j++) {
                        place++;

                        truePlace = place + Math.floor(place / 1) * 3;

                        destination[truePlace] = trueColor[0];
                        destination[++truePlace] = trueColor[1];
                        destination[++truePlace] = trueColor[2];
                    }
                }
            }
        },

        "COMPRESSED_PARTIAL": function (frame, destination) {
            var i, j, place, truePlace, color, trueColor = [];

            //Skip the first byte since it only exists to tell us the compression format.
            for (i = 1; i < frame.length; i += 2) {
                place = frame[i];
                color = frame[i + 1];

                //Swap place with where it should go on the destination.
                //ToDo: Math.floor is unnecessary here.
                truePlace = place + Math.floor(place / 1) * 3;

                trueColor[0] = (color >> 16) & 0xFF; //Red
                trueColor[1] = (color >> 8) & 0xFF; //Green
                trueColor[2] = color & 0xFF; //Blue

                destination[truePlace] = trueColor[0];
                destination[++truePlace] = trueColor[1];
                destination[++truePlace] = trueColor[2];

                //Check to see if this is a repeating color.
                if (frame[i + 2] < 0) {

                    //Loop through each repeat.
                    for (j = 0; j < frame[i + 2] * -1; j++) {
                        place++;

                        truePlace = place + Math.floor(place / 1) * 3;

                        destination[truePlace] = trueColor[0];
                        destination[++truePlace] = trueColor[1];
                        destination[++truePlace] = trueColor[2];
                    }

                    i++; //Adjust position for new data.
                }
            }
        }
    };
})();