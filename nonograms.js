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
		var i, j, tr;
		var board = this.root.querySelector("#board");
		this.cells = [];

		for (i = 0; i < this.height; i++) {
			tr = document.createElement("tr");
			for (j = 0; j < this.width; j++) {
				tr.appendChild(document.createElement("td"));
			}
			board.appendChild(tr);
		}

		this.root.querySelector("#new").addEventListener("click", function () {
			that.start();
		});
	};

	Game.prototype.start = function () {
		this.solution = generate(this.width, this.height);
	};
}());
