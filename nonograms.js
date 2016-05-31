(function () {
	window.N = {};

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


	N.Game = function (root) {
		var that = this;
		this.root = root;
		this.width = 10;
		this.height = 10;
		this.setupUi();
		this.start();
	};

	N.Game.prototype.setupUi = function () {
		var i, j, tr, cell;
		var board = this.root.querySelector("#board");
		this.cells = [];
		this.rowHeaders = [];
		this.colHeaders = [];

		tr = document.createElement("tr");
		tr.appendChild(document.createElement("th"));

		for (i = 0; i < this.width; i++) {
			cell = new N.ColHeader(i);
			cell.appendTo(tr);
			this.colHeaders[i] = cell;
		}

		board.appendChild(tr);

		for (i = 0; i < this.height; i++) {
			tr = document.createElement("tr");
			cell = new N.RowHeader(i);
			cell.appendTo(tr);
			this.rowHeaders[i] = cell;
			this.cells[i] = [];
			for (j = 0; j < this.width; j++) {
				cell = new N.Cell(this.checkSolution.bind(this));
				cell.appendTo(tr);
				this.cells[i][j] = cell;
			}
			board.appendChild(tr);
		}
	};

	N.Game.prototype.start = function () {
		var that = this;
		this.solution = generate(this.width, this.height);

		this.colHeaders.forEach(function (h) {
			h.update(that.solution);
		});

		this.rowHeaders.forEach(function (h) {
			h.update(that.solution);
		});

		this.solution.forEach(function (row) {
			console.log(row.join(" "));
		});
	};

	N.Game.prototype.checkSolution = function () {
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


	N.ColHeader = function (colIx) {
		this._dom = document.createElement("th");
		this._colIx = colIx;
	};

	N.ColHeader.prototype.update = function (solution) {
		var col = projectColumn(solution, this._colIx);
		var runs = N.findRuns(col);
		var runLengths = runs.map(function (run) {
			return run.len;
		});

		this._dom.innerHTML = runLengths.join("<br>");
	};

	N.ColHeader.prototype.appendTo = function (root) {
		root.appendChild(this._dom);
	};


	N.RowHeader = function (rowIx) {
		this._dom = document.createElement("th");
		this._dom.className = "row-header";
		this._rowIx = rowIx;
	};

	N.RowHeader.prototype.update = function (solution) {
		var runs = N.findRuns(solution[this._rowIx]);
		var runLengths = runs.map(function (run) {
			return run.len;
		});

		this._dom.innerText = runLengths.join(" ");
	};

	N.RowHeader.prototype.appendTo = function (root) {
		root.appendChild(this._dom);
	};


	N.Cell = function (onChange) {
		var that = this;
		this.state = null;
		this._dom = document.createElement("td");
		this._dom.addEventListener("click", function () {
			that.nextState();
		});
		this.onChange = onChange;
	};

	N.Cell.prototype.appendTo = function (root) {
		root.appendChild(this._dom);
	};

	N.Cell.prototype.nextState = function () {
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

	N.findRuns = function (a) {
		var result = [];
		var i = 0, j, run;

		while (i < a.length) {
			i = nextOf(a, i, true);

			if (i < a.length) {
				j = nextOf(a, i, false);
				result.push({off: i, len: j - i});
				i = j + 1;
			}
		}

		return result;
	};

	var nextOf = function (a, startIx, value) {
		var i;

		for (i = startIx; i < a.length && a[i] !== value; i++) {
		}

		return i;
	};

	var projectColumn = function (m, colIx) {
		var result = [];
		var i;

		for (i = 0; i < m.length; i++) {
			result[i] = m[i][colIx];
		}

		return result;
	};
}());
