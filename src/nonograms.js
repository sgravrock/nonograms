(function () {
	"use strict";
	window.N = {};

	class Game {
		constructor(root, generator) {
			this.root = root;
			this.generator = generator || generate;
			this.width = 10;
			this.height = 10;
			this.undoStack = [];
			this.redoStack = [];
			this.setupUi();
			this.start();
		}

		setupUi() {
			this.createDom();
			this.bindToolEvents();
			new Dragger(this).setupUi();

			this.root.addEventListener("click", event => {
				const cell = this.cellWithNode(event.target);
	
				if (cell) {
					const cmd = new CellChangeCommand(cell, this.selectX());
					this._do(cmd);
				}
			});
		}

		createDom() {
			this.root.innerHTML = document.getElementById("game-template").textContent;
			const board = this.root.querySelector(".board");
			this.rows = [];
			this.rowHeaders = [];
			this.colHeaders = [];
	
			const headerRow = document.createElement("tr");
			headerRow.appendChild(document.createElement("th"));
	
			for (let i = 0; i < this.width; i++) {
				const cell = new ColHeader(i);
				cell.appendTo(headerRow);
				this.colHeaders[i] = cell;
			}
	
			board.appendChild(headerRow);
	
			for (let i = 0; i < this.height; i++) {
				const tr = document.createElement("tr");
				const cell = new RowHeader(i);
				cell.appendTo(tr);
				this.rowHeaders[i] = cell;
				this.rows[i] = [];
				for (let j = 0; j < this.width; j++) {
					const cell = new Cell();
					cell.appendTo(tr);
					this.rows[i][j] = cell;
				}
				board.appendChild(tr);
			}
		}

		bindToolEvents() {
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
				this._do(new ResetCommand(this.rows, this.solution));
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
		}

		cellWithNode(node) {
			for (const row of this.rows) {
				for (const cell of row) {
					if (cell.contains(node)) {
						return cell;
					}
				}
			}
		}

		_do(cmd) {
			cmd.do();
			this.undoStack.push(cmd);
			this.redoStack = [];
	
			this.undoBtn.disabled = false;
			this.checkSolution();
		}

		_undo() {
			const cmd = this.undoStack.pop();
			cmd.undo();
			this.redoStack.push(cmd);
	
			this.undoBtn.disabled = this.undoStack.length === 0;
			this.redoBtn.disabled = false;
			this.checkSolution();
		}

		_redo() {
			const cmd = this.redoStack.pop();
			cmd.do();
			this.undoStack.push(cmd);
	
			this.undoBtn.disabled = false;
			this.redoBtn.disabled = this.redoStack.length === 0;
			this.checkSolution();
		}

		start() {
			this.solution = generate(this.width, this.height);
	
			for (const h of this.colHeaders) {
				h.update(this.solution);
			}
	
			for (const h of this.rowHeaders) {
				h.update(this.solution);
			}
	
			new ResetCommand(this.rows, this.solution).do();
		}

		selectX() {
			return this.root.querySelector("input[name=x]").checked;
		}

		checkSolution() {
			for (let i = 0; i < this.height; i++) {
				for (let j = 0; j < this.width; j++) {
					if (this.solution[i][j] !== (this.rows[i][j].state === "on")) {
						return;
					}
				}
			}
	
			alert("Complete!");
		}
	}

	N.Game = Game;

	
	class Dragger {
		constructor(game) {
			this._game = game;
		}

		setupUi() {
			this._game.root.addEventListener("mousedown", event => {
				this._selection = [];
				this._selectionStart = event.target;
			});
	
			this._game.root.addEventListener("mouseup", event => {
				if (this._selection.length > 0) {
					const state = this._game.selectX() ? "off" : "on";

					for (const cell of this._selection) {
						cell.stopSelecting();
					}
	
					this._game._do(new DragCommand(this._selection, state));
				}
	
				this._selection = null;
			});
	
			this._game.root.addEventListener("mousemove", event => {
				if (!this._selection || event.target === this._selectionStart) {
					return;
				}
	
				this._selectCellWithNode(event.target);
			});
	
			this._game.root.addEventListener("mouseout", event => {
				if (this._selection && this._selectionStart === event.target) {
					this._selectCellWithNode(event.target);
				}
			});
		}

		_selectCellWithNode(node) {
			const cell = this._game.cellWithNode(node);
	
			if (cell && !this._selection.includes(cell)) {
				cell.startSelecting();
				this._selection.push(cell);
			}
		}
	}


	class ColHeader {
		constructor(colIx) {
			this._dom = document.createElement("th");
			this._colIx = colIx;
		}

		update(solution) {
			const col = projectColumn(solution, this._colIx);
			const runs = N.findRuns(col);
			const runLengths = runs.map(function (run) {
				return run.len;
			});
	
			this._dom.innerHTML = runLengths.join("<br>");
		}

		appendTo(root) {
			root.appendChild(this._dom);
		}
	}


	class RowHeader {
		constructor(rowIx) {
			this._dom = document.createElement("th");
			this._dom.className = "row-header";
			this._rowIx = rowIx;
		}

		update(solution) {
			const runs = N.findRuns(solution[this._rowIx]);
			const runLengths = runs.map(function (run) {
				return run.len;
			});
	
			this._dom.innerText = runLengths.join(" ");
		}

		appendTo(root) {
			root.appendChild(this._dom);
		}
	}


	class Cell {
		constructor() {
			this.state = null;
			this._dom = document.createElement("td");
			this._dom.appendChild(document.createElement("div"));
		}

		appendTo(root) {
			root.appendChild(this._dom);
		}

		contains(el) {
			while (el && el.tagName !== "TD") {
				el = el.parentNode;
			}
	
			return el === this._dom;
		}

		containsAny(els) {
			for (const el of els) {
				if (this.contains(el)) {
					return true;
				}
			}
	
			return false;
		}

		reset(shouldBeOn) {
			this.state = "";
			this._dom.className = shouldBeOn ? "expect-on" : "expect-off";
		}

		setState(state) {
			this.state = state;
			setClass(this._dom, "on", this.state === "on");
			setClass(this._dom, "off", this.state === "off");
		}

		startSelecting() {
			this._dom.classList.add("selecting");
		}

		stopSelecting() {
			this._dom.classList.remove("selecting");
		}
	}

	N.Cell = Cell;


	class CellChangeCommand {
		constructor(cell, selectX) {
			this._cell = cell;
			this._selectX = selectX;
		}

		do() {
			this._undoState = this._cell.state;
			this._cell.setState(this._nextState());
		}

		undo() {
			this._cell.setState(this._undoState);
		};
	
		_nextState() {
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
		}
	}


	class DragCommand {
		constructor(selectedCells, state) {
			this._selectedCells = selectedCells;
			this._doState = state;
			this._undoStates = selectedCells.map(cell => cell.state);
		};
	
		do() {
			for (const cell of this._selectedCells) {
				if (!cell.state) {
					cell.setState(this._doState);
				}
			}
		}
	
		undo() {
			for (let i = 0; i < this._selectedCells.length; i++) {
				this._selectedCells[i].setState(this._undoStates[i]);
			}
		}
	}

	N.DragCommand = DragCommand;


	class ResetCommand {
		constructor(rows, solution) {
			this._rows = rows;
			this._solution = solution;
			this._undoStates = rows.map(function(row) {
				return row.map(function(cell) {
					return cell.state;
				});
			});
		}
	
		do(f) {
			for (let y = 0; y < this._rows.length; y++) {
				for (let x = 0; x < this._rows[y].length; x++) {
					this._rows[y][x].reset(this._solution[y][x]);
				}
			}
		}
	
		undo() {
			for (let y = 0; y < this._rows.length; y++) {
				for (let x = 0; x < this._rows[y].length; x++) {
					this._rows[y][x].setState(this._undoStates[y][x]);
				}
			}
		}
	}


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
