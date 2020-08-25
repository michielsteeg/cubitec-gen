if ( !cubitec ) {
	var cubitec = {};
}

cubitec.generator = function (parameters) {


	// DEFAULTS 

	var defaults = {
		container: "#generator",
		seed: "Goede ideeën verdienen de beste technologie",
		viewBox: { x: 3024, y: 1512 },
		branch: { amount: 4, length: [1, 2] },
		fixedColors: true
	};

	var setDefaults = function (parameters, defaultObj) {
		for ( var key in defaultObj ) {
			if ( !parameters.hasOwnProperty(key) ) {
				parameters[key] = defaultObj[key];
			}
			else if ( defaultObj[key] === Object(defaultObj[key]) ) {
				setDefaults(parameters[key], defaultObj[key]);
			}
		}
	};

	setDefaults(parameters, defaults);


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
		},
		average: function (hash) {
			return utils.hash.value(hash) / hash.length;
		},
		random: function (input) {
			var prng = new Math.seedrandom(md5(input));
			return prng();
		},
		randomRange: function (input, min, max) {
			min = Math.ceil(min);
			max = Math.floor(max);
			var random = utils.hash.random(input);
			return Math.floor(random * (max - min)) + min;
		}
	};

	utils.block = {
		color: function (hashValue) {
			return colors[hashValue % 2];
		},
		position: function (hashValue, previous) {
			var position = positions[hashValue - 1];
			if ( !previous || previous.direction == "H" ) {
				return position;
			}
			else {
				if ( ["N","S"].indexOf(previous.position) >= 0 ) {
					var map = { "N":"N", "S":"S", "E":"N", "W":"S" };
					return map[position];
				}
				else if (["E", "W"].indexOf(previous.position) >= 0) {
					var map = { "E":"E", "W":"W", "N":"E", "S":"W" };
					return map[position];
				}
			}
		},
		direction: function (hashValue, previous) {
			if ( previous && previous.direction != "H" ) {
				return "H";
			}
			return directions[hashValue - 1];
		}
	};

	var scale = {
		x: { x: 144, y: 72 },
		y: { x: -144, y: 72 },
		z: { y: -45 }
	};

	var translations = {
		"N": {
			"U": { x: scale.x.x, y: scale.x.y * -2 },
			"D": { x: scale.x.x, y: 0 }
		},
		"E": {
			"U": { x: scale.x.x, y: scale.x.y * -1 },
			"D": { x: scale.x.x, y: scale.x.y }
		},
		"S": {
			"U": { x: 0, y: scale.x.y * -1 },
			"D": { x: 0, y: scale.x.y }
		},
		"W": {
			"U": { x: 0, y: scale.x.y * -2 },
			"D": { x: 0, y: 0 }
		}
	};

	utils.grid = {
		map: function (coords) {
			var svgCoords = {
				// x: influence of Xx + influence of Yx
				// y: influence of Xy + influence of Yy + influence of Zy
				x: coords.x * scale.x.x + coords.y * scale.y.x,
				y: coords.x * scale.x.y + coords.y * scale.y.y + coords.z * scale.z.y
			};
			return svgCoords;
		},
		translate: function (svgCoords, position, direction) {
			if ( direction == "H" ) {
				return svgCoords;
			}
			var translated = {
				x: svgCoords.x + translations[position][direction].x,
				y: svgCoords.y + translations[position][direction].y
			};
			if ( direction == "U" ) {
				translated.y = translated.y + scale.z.y;
			}
			return translated;
		},
		size: function () {
			var numBlocks = Math.min(
				Math.floor((parameters.viewBox.x - scale.x.x) / scale.x.x),
				Math.floor((parameters.viewBox.y - scale.x.y) / scale.x.y)
			);
			return {
				x: numBlocks,
				y: numBlocks
			};
		},
		move: function (coords, polygon, previous) {
			var movedCoords = JSON.parse(JSON.stringify(coords));
			if ( polygon.direction == "H" ) {
				switch (polygon.position) {
					case "N":
						movedCoords.y--;
						break;
					case "E":
						movedCoords.x++;
						break;
					case "S":
						movedCoords.y++;
						break;
					case "W":
						movedCoords.x--;
						break;
				}
			}
			if ( previous && previous.direction != "H" ) {
				switch (previous.direction) {
					case "U":
						movedCoords.x--;
						movedCoords.y--;
						movedCoords.z++;
						break;
					case "D":
						movedCoords.x++;
						movedCoords.y++;
						movedCoords.z--;
						break;
				}
			}
			// If the polygon's direction is horizontal (H) and its position is opposite the previous' position (e.g. E - W)
			// Then we've moved polygon too far apart from its previous partner
			// So we move them back together
			var isOpposite = function (position, oppositePosition) {
				var opposites = { "N": "S", "E": "W", "S": "N", "W": "E" };
				return opposites[position] == oppositePosition;
			};
			if ( polygon.direction == "H" && previous && isOpposite(polygon.position, previous.position) ) {
				console.log("we have opposites", polygon, previous);
				switch (polygon.position) {
					case "N":
						movedCoords.y++;
						break;
					case "E":
						movedCoords.x--;
						break;
					case "S":
						movedCoords.y--;
						break;
					case "W":
						movedCoords.x++;
						break;
				}
			}
			return movedCoords;
		}
	};

	var canvas = null;

	var points = {
		horizontal: "144 0 0 72 144 144 288 72 144 0",
		verticalX: "144 72 0 0 0 189 144 261 144 72",
		verticalY: "0 72 144 0 144 189 0 261 0 72"
	};

	utils.svg = {
		polygon: function (color, position, direction, classList) {
			classList = Array.isArray(classList) ? classList : [];
			var classes = { "B": "blue", "G": "green" };
			return {
				color: color,
				classes: ["polygon", classes[color]].concat(classList),
				direction: direction,
				points: utils.svg.points(position, direction),
				position: position
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
			if ( !canvas ) {
				canvas = SVG();
				canvas.viewbox({ x: 0, y: 0, width: parameters.viewBox.x, height: parameters.viewBox.y });
				canvas.addTo(parameters.container);
				canvas.style()
					.rule(".wrapper", { isolation: "isolate" })
					.rule(".polygon", { "mix-blend-mode": "multiply", opacity: 0.25 })
					.rule(".base", { opacity: 1 })
					.rule(".blue", { fill: "#2f67ff" })
					.rule(".green", { fill: "#6bdbe7" })
			}
			if ( !Array.isArray(polygons) ) {
				polygons = [polygons];
			}
			polygons.forEach(function (polygon) {
				var svgCoords = utils.grid.map(polygon.coords);
				svgCoords = utils.grid.translate(svgCoords, polygon.position, polygon.direction);
				canvas.polygon(polygon.points)
					.addClass(polygon.classes.join(" "))
					.move(svgCoords.x, svgCoords.y);
			});
		}
	};

	utils.allowed = {
		utils: {
			opposite: function (position) {
				var opposites = { "N": "S", "E": "W", "S": "N", "W": "E" };
				return opposites[position];
			}
		},
		polygon: function (polygon, branch) {
			var isOpposite = function (polygon, oppositePolygon) {
				return polygon.position == utils.allowed.utils.opposite(oppositePolygon.position);
			};

			if ( branch.polygons.length < 2 ) {
				return true;
			}
			var previous = branch.polygons[branch.polygons.length - 1];
			var beforePrevious = branch.polygons[branch.polygons.length - 2];
			if ( previous.direction == "H" && beforePrevious.direction != "H" ) {
				// Case 1: 'Zigzag'
				if ( isOpposite(polygon, beforePrevious) ) {
					return false;
				}
				if ( polygon.direction != beforePrevious.direction && !isOpposite(polygon, beforePrevious) ) {
					return false;
				}
			}
			return true;
		},
		start: function (start) {
			// Check if it's not used 
			var usedStartPositions = polygons.branches.reduce(function (prev, curr) {
				return prev.concat(curr.start);
			}, []);
			var stringifiedStartPositions = usedStartPositions.map(JSON.stringify);
			var used = stringifiedStartPositions.indexOf(JSON.stringify(start)) >= 0;
			// We want to use different attachment points as much as possible
			// An attachment point is the combination of coords and position. Currently we have 6 attachment points. (see utils.foobar.start)
			var getAttachmentPoint = function (position) {
				return JSON.stringify(position.coords) + "/" + JSON.stringify(position.position);
			};
			var usedAttachmentPoints = usedStartPositions.map(getAttachmentPoint);
			var usedAP = usedAttachmentPoints.indexOf(getAttachmentPoint(start)) >= 0;
			if ( polygons.branches.length == 6 - 1 ) {
				console.warn("Max amount of attachment points used. It's recommended to use less branches");
				usedAP = false;
			}
			
			return !used && !usedAP;
		}
	};


	var polygons = {};

	utils.foobar = {
		start: function () {
			// Definition based on the geometry of the base
			var definitions = [{
				coords: polygons.base[0].coords,
				options: ["EH", "ED", "SH", "SD", "WH", "WD"]
			}, {
				coords: polygons.base[2].coords,
				options: ["NH", "NU", "SH", "SU", "WH", "WU"]
			}];
			// Map for ease of use
			var output = [];
			definitions.forEach(function (definition) {
				definition.options.forEach(function (option) {
					output.push({
						coords: definition.coords,
						position: option[0],
						direction: option[1]
					});
				});
			});
			return output;
		},
		branch: {
			amount: function (hashValue) {
				return parameters.branch.amount;
			},
			length: function (hashValue) {
				var nums = parameters.branch.length;
				return nums[hashValue % nums.length];
			},
			start: function (hashValue) {
				var options = utils.foobar.start();
				var index = utils.hash.randomRange(hashValue.toString(), 0, options.length);
				// Keep on trying until it's allowed
				return utils.allowed.start(options[index]) ? options[index] : utils.foobar.branch.start(utils.hash.value(hashValue + ""));
			},
			hash: function (branch) {
				return hash.slice(branch.number * 4, branch.number * 4 + 4); // hash length 4 is used to generate branch's polygons (e.g. 'd4ab')
			},
			list: function (hash) {
				var amount = utils.foobar.branch.amount(utils.hash.value(hash[0]));
				polygons.branches = [];
				for ( var i = 0; i < amount; i++ ) {
					var part = hash.slice(i * 3, i * 3 + 3); // hash length 3 is used to generate branch properties (e.g. '6fe')
					var values = part.split("").map(utils.hash.value);
					polygons.branches.push({
						number: i,
						length: utils.foobar.branch.length(values[0]),
						start: utils.foobar.branch.start(values[1]),
						polygons: []
					});
				}
				return polygons.branches;
			},
			polygons: function (branch) {
				if ( Array.isArray(branch) ) {
					return branch.map(utils.foobar.branch.polygons);
				}
				var hash = utils.foobar.branch.hash(branch); // currently length 4
				var coords = branch.start.coords;
				for ( var i = 0; i < branch.length; i++ ) {
					var previous = null;
					if ( i > 0 ) {
						previous = branch.polygons[i - 1]
					}
					var value = utils.hash.value(hash[i]);
					var color = utils.block.color(value);
					var position = utils.block.position(value, previous);
					var direction = utils.block.direction(value, previous);
					if ( i == 0 ) {
						position = branch.start.position;
						direction = branch.start.direction;
					}
					
					var checkAllowed = function () {
						var allowed = utils.allowed.polygon({ position: position, direction: direction }, branch);
						console.log("checking allowed", allowed);
						if ( !allowed ) {
							value = utils.hash.value(value + "");
							position = utils.block.position(value, previous);
							direction = utils.block.direction(value, previous);
							checkAllowed();
						}
					};
					checkAllowed();

					if ( parameters.fixedColors ) {
						color = direction == "H" ? "B" : "G";
					}
					var polygon = utils.svg.polygon(color, position, direction);
					coords = utils.grid.move(coords, polygon, previous);
					polygon.coords = coords;
					branch.polygons.push(polygon);
				}
			}
		}
	};

	this.drawBase = function () {
		var size = utils.grid.size();
		var center = { x: Math.floor(size.x / 2), y: 0, z: 0 };
		var top = { x: center.x - 1, y: center.y - 1, z: 1 };
		var blocks = ["BSH", "GSU", "BSH"];
		polygons.base = blocks.map(function (block, index) {
			var polygon = utils.svg.polygon(block[0], block[1], block[2], ["base"]);
			polygon.coords = index == 2 ? top : center;
			return polygon;
		});
		utils.svg.draw(polygons.base);
	};

	this.generate = function (draw) {
		var branches = utils.foobar.branch.list(hash);
		utils.foobar.branch.polygons(branches);
		if ( draw ) {
			// timeout drawing here
			var draw = function (branch) {
				branch.polygons.forEach(function (polygon, index) {
					var timeout = index * 500;
					setTimeout(utils.svg.draw, timeout, polygon);
				});
			};
			polygons.branches.forEach(function (branch) {
				var timeout = branch.number * 2000;
				setTimeout(draw, timeout, branch);
			});
		}
		console.log("the branches are", polygons.branches);
		return polygons.branches;
	};

	this.seed = function (seed) {
		parameters.seed = seed;
		hash = utils.hash.create(parameters.seed);
	};

	this.clear = function () {
		polygons.branches.splice(0, polygons.branches.length);
		var list = document.querySelectorAll(".polygon:not(.base)");
		list.forEach(function (polygon) { polygon.remove(); });
	};

	var hash = utils.hash.create(parameters.seed);

	this.draw = utils.svg.draw;
	this.polygon = utils.svg.polygon;

	return this;
};
