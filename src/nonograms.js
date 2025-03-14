(function () {
	"use strict";
	window.N = {};

	N.Game = function (root, generator) {
		this.root = root;
		this.generator = generator || generate;
		this.width = 10;
		this.height = 10;
		this.undoStack = [];
		this.redoStack = [];
		this.setupUi();
		this.start();
	};

	N.Game.prototype.setupUi = function () {
		this.root.innerHTML = document.getElementById("game-template").textContent;
		const board = this.root.querySelector(".board");
		this.cells = [];
		this.rowHeaders = [];
		this.colHeaders = [];

		const headerRow = document.createElement("tr");
		headerRow.appendChild(document.createElement("th"));

		for (let i = 0; i < this.width; i++) {
			const cell = new N.ColHeader(i);
			cell.appendTo(headerRow);
			this.colHeaders[i] = cell;
		}

		board.appendChild(headerRow);

		for (let i = 0; i < this.height; i++) {
			const tr = document.createElement("tr");
			const cell = new N.RowHeader(i);
			cell.appendTo(tr);
			this.rowHeaders[i] = cell;
			this.cells[i] = [];
			for (let j = 0; j < this.width; j++) {
				const cell = new N.Cell();
				cell.appendTo(tr);
				this.cells[i][j] = cell;
			}
			board.appendChild(tr);
		}

		document.addEventListener("keyup", e => {
			if (e.keyCode !== 88 /*x*/) {
				return;
			}

			const cb = this.root.querySelector("input[name=x]");
			cb.checked = !cb.checked;
		});

		this.root.querySelector("input[name=errors]")
				.addEventListener("click", e => {
					setClass(this.root, "show-errors", e.target.checked);
				});

		this.root.querySelector(".reset").addEventListener("click", () => {
			this._do(new N.ResetCommand(this.cells, this.solution));
		});

		this.undoBtn = this.root.querySelector(".undo");
		this.undoBtn.addEventListener("click", event => {
			event.stopPropagation();
			this._undo();
		});

		this.redoBtn = this.root.querySelector(".redo");
		this.redoBtn.addEventListener("click", event => {
			event.stopPropagation();
			this._redo();
		});

		this.root.addEventListener("click", event => {
			const cell = this._cellWithNode(event.target);

			if (cell) {
				const cmd = new N.CellChangeCommand(cell, this.selectX());
				this._do(cmd);
			}
		});

		this.root.addEventListener("mousedown", event => {
			this._selecting = [];
			this._selectionStart = event.target;
		});

		this.root.addEventListener("mouseup", event => {
			if (this._selecting.length > 0) {
				const state = this.selectX() ? "off" : "on";
				this._selecting.forEach(function (cell) {
					cell.stopSelecting();
				});

				this._do(new N.DragCommand(this._selecting, state));
			}

			this._selecting = null;
		});

		this.root.addEventListener("mousemove", event => {
			if (!this._selecting || event.target === this._selectionStart) {
				return;
			}

			this._selectCellWithNode(event.target);
		});

		this.root.addEventListener("mouseout", event => {
			if (this._selecting && this._selectionStart === event.target) {
				this._selectCellWithNode(event.target);
			}
		});
	};

	N.Game.prototype._cellWithNode = function (node) {
		for (let i = 0; i < this.cells.length; i++) {
			for (let j = 0; j < this.cells[i].length; j++) {
				if (this.cells[i][j].contains(node)) {
					return this.cells[i][j];
				}
			}
		}
	};

	N.Game.prototype._selectCellWithNode = function (node) {
		const cell = this._cellWithNode(node);

		if (cell) {
			cell.startSelecting();
			this._selecting.push(cell);
		}
	};

	N.Game.prototype._do = function(cmd) {
		cmd.do();
		this.undoStack.push(cmd);
		this.redoStack = [];

		this.undoBtn.disabled = false;
		this.checkSolution();
	};

	N.Game.prototype._undo = function() {
		const cmd = this.undoStack.pop();
		cmd.undo();
		this.redoStack.push(cmd);

		this.undoBtn.disabled = this.undoStack.length === 0;
		this.redoBtn.disabled = false;
		this.checkSolution();
	};

	N.Game.prototype._redo = function() {
		const cmd = this.redoStack.pop();
		cmd.do();
		this.undoStack.push(cmd);

		this.undoBtn.disabled = false;
		this.redoBtn.disabled = this.redoStack.length === 0;
		this.checkSolution();
	};

	N.Game.prototype.start = function () {
		this.solution = generate(this.width, this.height);

		for (const h of this.colHeaders) {
			h.update(this.solution);
		}

		for (const h of this.rowHeaders) {
			h.update(this.solution);
		}

		new N.ResetCommand(this.cells, this.solution).do();
	};

	N.Game.prototype.selectX = function () {
		return this.root.querySelector("input[name=x]").checked;
	};

	N.Game.prototype.checkSolution = function () {
		for (let i = 0; i < this.height; i++) {
			for (let j = 0; j < this.width; j++) {
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
		const col = projectColumn(solution, this._colIx);
		const runs = N.findRuns(col);
		const runLengths = runs.map(function (run) {
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
		const runs = N.findRuns(solution[this._rowIx]);
		const runLengths = runs.map(function (run) {
			return run.len;
		});

		this._dom.innerText = runLengths.join(" ");
	};

	N.RowHeader.prototype.appendTo = function (root) {
		root.appendChild(this._dom);
	};


	N.Cell = function () {
		this.state = null;
		this._dom = document.createElement("td");
		this._dom.appendChild(document.createElement("div"));
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
		for (let i = 0; i < els.length; i++) {
			if (this.contains(els[i])) {
				return true;
			}
		}

		return false;
	};

	N.Cell.prototype.reset = function (shouldBeOn) {
		this.state = "";
		this._dom.className = shouldBeOn ? "expect-on" : "expect-off";
	};

	N.Cell.prototype.setState = function (state) {
		this.state = state;
		setClass(this._dom, "on", this.state === "on");
		setClass(this._dom, "off", this.state === "off");
	};

	N.Cell.prototype.startSelecting = function () {
		this._dom.classList.add("selecting");
	};

	N.Cell.prototype.stopSelecting = function () {
		this._dom.classList.remove("selecting");
	};


	N.CellChangeCommand = function(cell, selectX) {
		this._cell = cell;
		this._selectX = selectX;
	};

	N.CellChangeCommand.prototype.do = function() {
		this._undoState = this._cell.state;
		this._cell.setState(this._nextState());
	};

	N.CellChangeCommand.prototype.undo = function() {
		this._cell.setState(this._undoState);
	};

	N.CellChangeCommand.prototype._nextState = function() {
		if (this._selectX) {
			if (this._cell.state === "off") {
				return "";
			} else {
				return "off";
			}
		} else {
			if (this._cell.state === "on") {
				return "off";
			} else if (this._cell.state === "off") {
				return "";
			} else {
				return "on";
			}
		}
	};


	N.DragCommand = function(cells, state) {
		this._cells = cells;
		this._doState = state;
		this._undoStates = cells.map(function(cell) { cell.state });
	};

	N.DragCommand.prototype.do = function() {
		const state = this._doState;

		this._cells.forEach(function(cell) {
			if (!cell.state) {
				cell.setState(state);
			}
		});
	};

	N.DragCommand.prototype.undo = function() {
		for (let i = 0; i < this._cells.length; i++) {
			this._cells[i].setState(this._undoStates[i]);
		}
	};


	N.ResetCommand = function(cells, solution) {
		this._cells = cells;
		this._solution = solution;
		this._undoStates = cells.map(function(row) {
			return row.map(function(cell) {
				return cell.state;
			});
		});
	};

	N.ResetCommand.prototype.do = function (f) {
		for (let y = 0; y < this._cells.length; y++) {
			for (let x = 0; x < this._cells[y].length; x++) {
				this._cells[y][x].reset(this._solution[y][x]);
			}
		}
	};

	N.ResetCommand.prototype.undo = function() {
		for (let y = 0; y < this._cells.length; y++) {
			for (let x = 0; x < this._cells[y].length; x++) {
				this._cells[y][x].setState(this._undoStates[y][x]);
			}
		}
	};


	N.findRuns = function (a) {
		const result = [];
		let i = 0;

		while (i < a.length) {
			i = nextOf(a, i, true);

			if (i < a.length) {
				const j = nextOf(a, i, false);
				result.push({off: i, len: j - i});
				i = j + 1;
			}
		}

		return result;
	};

	function generate (width, height) {
		// Naive random approach, doesn't necessarily generate puzzles
		// that can be solved without guessing. Should be replaced with
		// something better.
		let solution = [];

		for (let i = 0; i < height; i++) {
			solution[i] = [];

			for (let j = 0; j < width; j++) {
				solution[i][j] = Math.random() > 0.5;
			}
		}

		return solution;
	}

	function setClass (el, className, shouldHave) {
		if (shouldHave) {
			el.classList.add(className);
		} else {
			el.classList.remove(className);
		}
	}


	function nextOf(a, startIx, value) {
		let i;

		for (i = startIx; i < a.length && a[i] !== value; i++) {
		}

		return i;
	}

	function projectColumn(m, colIx) {
		const result = [];

		for (let i = 0; i < m.length; i++) {
			result[i] = m[i][colIx];
		}

		return result;
	}
}());
