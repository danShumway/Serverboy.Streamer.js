(function(){ 'use strict'; })();

var MAP = {
    FULL: -1,
    COMPRESSED_FULL_OLD: -1,
    COMPRESSED_FULL: -2,
    COMPRESSED_PARTIAL: -3
};

var COMPRESSION_STRATEGIES = {

	"FULL": function() {
		//Put it into full frames.
		//End up with an array we could just pass into the .data slot for imageData (canvas)
	},

	/*
	[-2, Fx000, Fx000, Fx001.. etc...]
	ToDo: Make this able to take advantage of repeating colors.
	*/
	"COMPRESSED_FULL_OLD": function(frame) {
		
		if(frame) {

			var toReturn = [];
			toReturn[0] = MAP.COMPRESSED_FULL_OLD; //Record what format we're in.

			for(var i=0; i < frame.length; i++) {
				toReturn.push(frame[i]); //Color
			}

			return toReturn;
		} 
		
		return undefined; //No data to compress.
	},

    "COMPRESSED_FULL": function(frame) {
        if(frame) {
            var toReturn = [];
            toReturn[0] = MAP.COMPRESSED_FULL; //Format

            var current_color = undefined; var duplicates = 0;
            for(var i=0; i < frame.length; i++) {

                //If you have duplicate values in a row, record that instead.
                if (frame[i] === frame[i - 1]) {
                    current_color = frame[i];
                    duplicates++;
                } else {

                    //If we were sitting on duplicates, record that.
                    if (duplicates !== 0) {
                        toReturn.push(-duplicates); //We use a negative number here as a flag.
                    }

                    toReturn.push(frame[i]); //Color

                    //And, we're moving forward, so clear out duplicates.
                    current_color = frame[i];
                    duplicates = 0;
                }
            }

            return toReturn;
        }

        return undefined;
    },


	//What you end up with.
	/*
	//Type - always starts the array (-3), then index to change, value to change, and (optionally) a negative number denoting how many pixels after this one should also be changed.
	[-3, 5, Fx000, -2, 10, Fx001, 11, Fx002, -1]...
	*/
	"COMPRESSED_PARTIAL": function(frame, comparison_frame) {

		if(frame) {
            if(comparison_frame) {
                var toReturn = [];
                toReturn[0] = MAP.COMPRESSED_PARTIAL; //Record what format we're in.

                var current_color = undefined; var duplicates = 0;
                for(var i=0; i < frame.length; i++) {

                    //Only record changes.
                    if (frame[i] !== comparison_frame[i]) {

                        //If you have duplicate values in a row, record that instead.
                        if (frame[i] === frame[i-1]) {
                            current_color = frame[i];
                            duplicates++;
                        } else {

                            //If we were sitting on duplicates, record that.
                            if (duplicates !== 0) {
                                toReturn.push(-duplicates); //We use a negative number here as a flag.
                            }

                            toReturn.push(i); //What index needs to be changed.
                            toReturn.push(frame[i]); //Color

                            //And, we're moving forward, so clear out duplicates.
                            current_color = frame[i];
                            duplicates = 0;
                        }
                    } else {
                        //We're jumping forward (a gap means we *must* start a new range)
                        current_color = undefined;
                        duplicates = 0;
                    }
                }

			} else {
                return this.COMPRESSED_FULL(frame); //You didn't supply a comparison, so we'll just return the entire thing.
            }

			return toReturn;
		}

		return undefined; //No data to compress.
	}
};

module.exports = COMPRESSION_STRATEGIES;