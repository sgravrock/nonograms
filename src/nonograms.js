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

	var setClass = function (el, className, shouldHave) {
		if (shouldHave) {
			el.classList.add(className);
		} else {
			el.classList.remove(className);
		}
	};


	N.Game = function (root, generator) {
		var that = this;
		this.root = root;
		this.generator = generator || generate;
		this.width = 10;
		this.height = 10;
		this.setupUi();
		this.start();
	};

	N.Game.prototype.setupUi = function () {
		var i, j, tr, cell;
		this.root.innerHTML = document.getElementById("game-template").textContent;
		var board = this.root.querySelector(".board");
		var that = this;
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
				cell = new N.Cell({
					cellChanged: this.checkSolution.bind(this),
					selectX: this.selectX.bind(this)
				});
				cell.appendTo(tr);
				this.cells[i][j] = cell;
			}
			board.appendChild(tr);
		}

		document.addEventListener("keyup", function (e) {
			if (e.keyCode !== 88 /*x*/) {
				return;
			}

			var cb = that.root.querySelector("input[name=x]");
			cb.checked = !cb.checked;
		});

		this.root.querySelector("input[name=errors]")
				.addEventListener("click", function (e) {
					setClass(that.root, "show-errors", e.target.checked);
				});

		this.root.querySelector(".reset").addEventListener("click", function () {
			that._resetCells();
		});

		this.root.addEventListener("click", function (event) {
			var i, j;
			for (i = 0; i < that.cells.length; i++) {
				for (j = 0; j < that.cells[i].length; j++) {
					if (that.cells[i][j].contains(event.target)) {
						that.cells[i][j].nextState();
					}
				}
			}
		});

		this.root.addEventListener("mousedown", function (event) {
			that._selecting = [];
		});

		this.root.addEventListener("mouseup", function (event) {
			var state = that.selectX() ? "off" : "on";
			that._selecting.forEach(function (cell) {
				cell.stopSelecting();
				cell.setStateIfEmpty(state);
			});

			that._selecting = null;
		});

		this.root.addEventListener("mousemove", function (event) {
			var i, j, cell;

			if (!that._selecting) {
				return;
			}

			for (i = 0; i < that.cells.length; i++) {
				for (j = 0; j < that.cells[i].length; j++) {
					cell = that.cells[i][j];
					if (cell.contains(event.target)) {
						cell.startSelecting();
						that._selecting.push(cell);
					}
				}
			}
		});
	};

	N.Game.prototype._resetCells = function (f) {
		var x, y;

		for (y = 0; y < this.cells.length; y++) {
			for (x = 0; x < this.cells[y].length; x++) {
				this.cells[y][x].reset(this.solution[y][x]);
			}
		}
	};

	N.Game.prototype.start = function () {
		var that = this;
		var x, y;
		this.solution = generate(this.width, this.height);

		this.colHeaders.forEach(function (h) {
			h.update(that.solution);
		});

		this.rowHeaders.forEach(function (h) {
			h.update(that.solution);
		});

		this._resetCells();
	};

	N.Game.prototype.selectX = function () {
		return this.root.querySelector("input[name=x]").checked;
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


	N.Cell = function (delegate) {
		var that = this;
		this.state = null;
		this._dom = document.createElement("td");
		this._dom.appendChild(document.createElement("div"));
		this.delegate = delegate;
	};

	N.Cell.prototype.appendTo = function (root) {
		root.appendChild(this._dom);
	};

	N.Cell.prototype.contains = function (el) {
		while (el && el.tagName !== "TD") {
			el = el.parentNode;
		}

		return el === this._dom;
	};

	N.Cell.prototype.containsAny = function (els) {
		var i;

		for (i = 0; i < els.length; i++) {
			if (this.contains(els[i])) {
				return true;
			}
		}

		return false;
	};

	N.Cell.prototype.reset = function (shouldBeOn) {
		this.state = ""
		this._dom.className = shouldBeOn ? "expect-on" : "expect-off";
	};

	N.Cell.prototype.setState = function (state) {
		this.state = state;
		setClass(this._dom, "on", this.state === "on");
		setClass(this._dom, "off", this.state === "off");
		this.delegate.cellChanged();
	};

	N.Cell.prototype.setStateIfEmpty = function (state) {
		if (this.state === "") {
			this.setState(state);
		}
	};

	N.Cell.prototype.nextState = function () {
		if (this.delegate.selectX()) {
			if (this.state === "off") {
				this.setState("");
			} else { 
				this.setState("off");
			}
		} else {
			if (this.state === "on") {
				this.setState("off");
			} else if (this.state === "off") {
				this.setState("");
			} else { 
				this.setState("on");
			}
		}
	};

	N.Cell.prototype.startSelecting = function () {
		this._dom.classList.add("selecting");
	};

	N.Cell.prototype.stopSelecting = function () {
		this._dom.classList.remove("selecting");
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
