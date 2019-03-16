if ( !cubitec ) {
	var cubitec = {};
}

cubitec.generator = function () {


	// UTILS 

	var utils = {};

	var hexadecimals = 	["0","1","2","3", "4","5","6","7", "8","9","A","B", "C","D","E","F"];
	var colors = ["B","G"];
	var positions = 	["N","E","S","W", "W","S","E","N", "N","E","S","W", "W","S","E","N"];
	var directions = 	["H","U","D","H", "U","H","H","D", "U","H","H","D", "H","U","D","H"];

	utils.hash = {
		create: function (seed) {
			return md5(seed);
		},
		value: function (hash) {
			return hash.split("").reduce(function (prev, curr) {
				return prev + (hexadecimals[curr.toUpperCase()] + 1);
			}, 0);
		}
	};

	utils.block = {
		color: function (hashValue) {
			return colors[hashValue % 2];
		},
		position: function (hashValue, isVertical) {
			var position = positions[hashValue];
			if ( !isVertical ) {
				return position;
			}
			if ( ["N","E"].indexOf(position) >= 0 ) {
				return "N";
			}
			else if ( ["S","W"].indexOf(position) >= 0 ) {
				return "S";
			}
		},
		direction: function (hashValue, isVertical) {
			if ( isVertical ) {
				return "H";
			}
			return directions[hashValue];
		}
	};


	var hash = utils.hash.create(parameters.seed);

	// Let's create some blocks
	

	return this;
};