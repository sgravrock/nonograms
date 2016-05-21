(function () {
	var generate = function (width, height) {
		// Naive random approach, doesn't necessarily generate puzzles
		// that can be solved without guessing. Should be replaced with
		// something better.
		var i, j;
		var solution = [];

		for (i = 0; i < height; i++) {
			solution[i] = [];

			for (j = 0; j < width; j++) {
				solution[i][j] = Math.random() > 0.5;
			}
		}

		return solution;
	};


	window.Game = function (root) {
		var that = this;
		this.root = root;
		this.width = 10;
		this.height = 10;
		this.setupUi();
		this.start();
	};

	Game.prototype.setupUi = function () {
		var i, j, tr, cell;
		var board = this.root.querySelector("#board");
		this.cells = [];

		for (i = 0; i < this.height; i++) {
			this.cells[i] = [];
			tr = document.createElement("tr");
			for (j = 0; j < this.width; j++) {
				cell = new Cell(this.checkSolution.bind(this));
				cell.appendTo(tr);
				this.cells[i].push(cell);
			}
			board.appendChild(tr);
		}

		this.root.querySelector("#new").addEventListener("click", function () {
			that.start();
		});
	};

	Game.prototype.start = function () {
		var i, j;
		this.solution = generate(this.width, this.height);
	};

	Game.prototype.checkSolution = function () {
		var i, j;

		for (i = 0; i < this.height; i++) {
			for (j = 0; j < this.width; j++) {
				if (this.solution[i][j] !== (this.cells[i][j].state === "on")) {
					return;
				}
			}
		}

		alert("Complete!");
	};


	window.Cell = function (onChange) {
		var that = this;
		this.state = null;
		this._dom = document.createElement("td");
		this._dom.addEventListener("click", function () {
			that.nextState();
		});
		this.onChange = onChange;
	};

	Cell.prototype.appendTo = function (root) {
		root.appendChild(this._dom);
	};

	Cell.prototype.nextState = function () {
		if (this.state === "on") {
			this.state = "off";
		} else if (this.state === "off") {
			this.state = "";
		} else { 
			this.state = "on";
		}

		this._dom.className = this.state || "";
		this.onChange();
	};
}());
