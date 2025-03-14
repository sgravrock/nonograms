"use strict";
describe("Game", function () {
	beforeEach(function () {
		this.root = document.createElement("div");
		this.subject = new N.Game(this.root, generate);

		this.findByText = function(selector, text) {
			const candidates = this.root.querySelectorAll(selector);
			const matches = Array.prototype.filter.call(candidates, function(el) {
				return el.textContent === text;
			});

			if (matches.length !== 1) {
				throw new Error("Expected to find one " + selector +
					" with text " + text + " but found " + matches.length);
			}

			return matches[0];
		}
	});

	it("creates a table cell for each box", function () {
		const rows = this.root.querySelectorAll("tr");
		expect(rows.length).toEqual(11); // 10 + header

		for (let i = 1; i < 11; i++) {
			expect(rows[i].querySelectorAll("td").length).toEqual(10);
		}
	});

	it("cycles box states in response to clicks", function () {
		const cell = this.root.querySelector("td.expect-on");
		expect(cell).not.toHaveClass("on");
		expect(cell).not.toHaveClass("off");

		simulateClick(cell);
		expect(cell).toHaveClass("on");
		expect(cell).not.toHaveClass("off");

		simulateClick(cell);
		expect(cell).not.toHaveClass("on");
		expect(cell).toHaveClass("off");

		simulateClick(cell);
		expect(cell).not.toHaveClass("on");
		expect(cell).not.toHaveClass("off");
	});

	it("does not select a cell until the user drags out of it", function () {
		const start = this.root.querySelectorAll("tr")[1]
				.querySelectorAll("td")[1];
		simulateMouseEvent("mousedown", start);
		simulateMouseEvent("mousemove", start);
		expect(start).not.toHaveClass("selecting");
		simulateMouseEvent("mouseout", start);
		expect(start).toHaveClass("selecting");
	});

	describe("When the user drags across several cells", function () {
		let start, middle, end;

		beforeEach(function () {
			start = this.root.querySelectorAll("tr")[1]
					.querySelectorAll("td")[1];
			middle = this.root.querySelectorAll("tr")[2]
					.querySelectorAll("td")[1];
			end = this.root.querySelectorAll("tr")[3]
					.querySelectorAll("td")[1];
		});

		it("selects the cells in a row from the start point", function () {
			drag();
			[start, middle, end].forEach(function (cell) {
				expect(cell).toHaveClass("selecting");
			});
		});

		describe("When the user releases the mouse", function () {
			it("deslects the cells", function () {
				drag();
				simulateMouseEvent("mouseup", end);

				[start, middle, end].forEach(function (cell) {
					expect(cell).not.toHaveClass("selecting");
				});
			});

			describe("In normal mode", function () {
				beforeEach(function () {
					drag();
					simulateMouseEvent("mouseup", end);
				});

				it("puts the cells in the 'on' state", function () {
					[start, middle, end].forEach(function (cell) {
						expect(cell).toHaveClass("on");
					});
				});
			});

			describe("In X mode", function () {
				beforeEach(function () {
					this.root.querySelector("input[name=x]").checked = true;
					simulateClick(middle); // => on state
					simulateClick(end);
					simulateClick(end); // => off state

					drag();
					simulateMouseEvent("mouseup", end);
				});

				it("puts the cells in the 'off' state", function () {
					[start, middle, end].forEach(function (cell) {
						expect(cell).toHaveClass("off");
					});
				});
			});

			describe("In normal mode", function () {
				beforeEach(function () {
					drag();
					simulateMouseEvent("mouseup", end);
				});

				it("deslects the cells", function () {
					[start, middle, end].forEach(function (cell) {
						expect(cell).not.toHaveClass("selecting");
					});
				});

				it("puts the cells in the 'on' state", function () {
					[start, middle, end].forEach(function (cell) {
						expect(cell).toHaveClass("on");
					});
				});
			});

			describe("And the user mouses over more cells", function () {
				let other;

				beforeEach(function () {
					drag();
					simulateMouseEvent("mouseup", end);
					other = this.root.querySelectorAll("tr")[4]
						.querySelectorAll("td")[1];
					simulateMouseEvent("mousemove", other);
				});

				it("should not select those cells", function () {
					expect(other).not.toHaveClass("selecting");
				});
			});
		});

		function drag() {
			simulateMouseEvent("mousedown", start);
			simulateMouseEvent("mousemove", start);
			simulateMouseEvent("mouseout", start);
			simulateMouseEvent("mousemove", middle);
			simulateMouseEvent("mousemove", end);
		}
	});

	describe("Undo and redo", function() {
		it("can undo and redo cell clicks", function () {
			const undoBtn = this.findByText("button", "Undo");
			const redoBtn = this.findByText("button", "Redo");
			const cell = this.root.querySelector("td");

			simulateClick(cell);

			simulateClick(undoBtn);
			expect(cell).not.toHaveClass("on");

			simulateClick(redoBtn);
			expect(cell).toHaveClass("on");
		});

		it("can undo and redo drags", function() {
			const undoBtn = this.findByText("button", "Undo");
			const redoBtn = this.findByText("button", "Redo");
			const start = this.root.querySelectorAll("tr")[1]
				.querySelectorAll("td")[1];
			const end = this.root.querySelectorAll("tr")[2]
				.querySelectorAll("td")[1];

			simulateMouseEvent("mousedown", start);
			simulateMouseEvent("mousemove", start);
			simulateMouseEvent("mouseout", start);
			simulateMouseEvent("mousemove", end);
			simulateMouseEvent("mouseup", end);

			expect(start).toHaveClass("on");
			expect(end).toHaveClass("on");

			simulateClick(undoBtn);
			expect(start).not.toHaveClass("on");
			expect(end).not.toHaveClass("on");

			simulateClick(redoBtn);
			expect(start).toHaveClass("on");
			expect(end).toHaveClass("on");
		});

		it("can undo and redo resets", function() {
			const undoBtn = this.findByText("button", "Undo");
			const redoBtn = this.findByText("button", "Redo");
			const resetBtn = this.findByText("button", "Reset");
			const cells = this.root.querySelectorAll("td");

			simulateClick(cells[0]);
			simulateClick(cells[1]);
			simulateClick(resetBtn);

			simulateClick(undoBtn);
			expect(cells[0]).toHaveClass("on");
			expect(cells[1]).toHaveClass("on");

			simulateClick(redoBtn);
			expect(cells[0]).not.toHaveClass("on");
			expect(cells[1]).not.toHaveClass("on");
		});

		it("can undo and redo multiple moves", function () {
			const undoBtn = this.findByText("button", "Undo");
			const redoBtn = this.findByText("button", "Redo");
			const cells = this.root.querySelectorAll("td");

			simulateClick(cells[0]);
			simulateClick(cells[1]);

			simulateClick(undoBtn);
			expect(cells[0]).toHaveClass("on");
			expect(cells[1]).not.toHaveClass("on");

			simulateClick(undoBtn);
			expect(cells[0]).not.toHaveClass("on");
			expect(cells[1]).not.toHaveClass("on");

			simulateClick(redoBtn);
			expect(cells[0]).toHaveClass("on");
			expect(cells[1]).not.toHaveClass("on");

			simulateClick(redoBtn);
			expect(cells[0]).toHaveClass("on");
			expect(cells[1]).toHaveClass("on");
		});

		it("enables and disables the undo and redo buttons", function() {
			const undoBtn = this.findByText("button", "Undo");
			const redoBtn = this.findByText("button", "Redo");
			const cell = this.root.querySelector("td");

			expect(undoBtn.disabled).withContext("undo initially").toEqual(true);
			expect(redoBtn.disabled).withContext("redo initially").toEqual(true);

			simulateClick(cell);
			expect(undoBtn.disabled).withContext("undo after 1st do").toEqual(false);
			expect(redoBtn.disabled).withContext("redo after 1st do").toEqual(true);

			simulateClick(cell);
			expect(undoBtn.disabled).withContext("undo after 2nd do").toEqual(false);
			expect(redoBtn.disabled).withContext("redo after 2nd do").toEqual(true);

			simulateClick(undoBtn);
			expect(undoBtn.disabled).withContext("undo after 1st undo").toEqual(false);
			expect(redoBtn.disabled).withContext("redo after 1st undo").toEqual(false);

			simulateClick(undoBtn);
			expect(undoBtn.disabled).withContext("undo after 1st undo").toEqual(true);
			expect(redoBtn.disabled).withContext("redo after 1st undo").toEqual(false);
		});
	});

	function generate(width, height) {
		const solution = [];

		for (let i = 0; i < height; i++) {
			solution[i] = [];

			for (let j = 0; j < width; j++) {
				solution[i][j] = j === 0;
			}
		}

		return solution;
	}

	function simulateClick(element) {
		simulateMouseEvent("click", element);
	}

	function simulateMouseEvent(eventName, element) {
		const event = document.createEvent("MouseEvent");
		event.initMouseEvent(eventName, true, true, window);
		element.dispatchEvent(event);
	}
});
