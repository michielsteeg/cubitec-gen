if ( !cubitec ) {
	var cubitec = {};
}

cubitec.generator = function (parameters) {

	// DEFAULTS 
	var defaults = {
		container: "#generator",
		seed: "Goede ideeën verdienen de beste technologie",
		viewBox: { x: 800, y: 600 }
	};

	var setDefaults = function (parameters) {
		for ( var key in defaults ) {
			if ( !parameters.hasOwnProperty(key) ) {
				parameters[key] = defaults[key];
			}
		}
	};

	setDefaults(parameters);


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
				return prev + (hexadecimals.indexOf(curr.toUpperCase()) + 1);
			}, 0);
		}
	};

	utils.block = {
		color: function (hashValue) {
			return colors[hashValue % 2];
		},
		position: function (hashValue, previousIsVertical) {
			var position = positions[hashValue - 1];
			if ( !previousIsVertical ) {
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
			return directions[hashValue - 1];
		}
	};

	var draw = null;

	var points = {
		horizontal: "144 0 0 72 144 144 288 72 144 0",
		verticalX: "144 72 0 0 0 189 144 261 144 72",
		verticalY: "0 72 144 0 144 189 0 261 0 72"
	};

	utils.svg = {
		polygon: function (color, position, direction) {
			return {
				points: utils.svg.points(position, direction),
				color: color
			};
		},
		points: function (position, direction) {
			var shape;
			if ( direction == "H" ) {
				shape = "horizontal";
			}
			else if (["N", "S"].indexOf(position) >= 0) {
				shape = "verticalX";
			}
			else if (["E", "W"].indexOf(position) >= 0) {
				shape = "verticalY";
			}
			return points[shape];
		},
		draw: function (polygons) {
			if ( !draw ) {
				draw = SVG().size(parameters.viewBox.x, parameters.viewBox.y);
				draw.addTo(parameters.container);
			}
			if ( !Array.isArray(polygons) ) {
				polygons = [polygons];
			}
			polygons.forEach(function (polygon) {
				draw.polygon(polygon.points).fill(polygon.fill).move(polygon.svgCoords.x, polygon.svgCoords.y);
			});
		}
	};


	var hash = utils.hash.create(parameters.seed);

	// Let's create some blocks
	this.blocks = function () {
		return hash.split("").map(function (hashPart) {
			var value = utils.hash.value(hashPart);
			var color = utils.block.color(value);
			var position = utils.block.position(value);
			var direction = utils.block.direction(value);
			return utils.svg.polygon(color, position, direction);
		});
	};

	this.draw = utils.svg.draw;

	return this;
};