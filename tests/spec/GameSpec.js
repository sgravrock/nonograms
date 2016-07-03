"use strict";
describe("Game", function () {
	var generate = function (width, height) {
		var i, j;
		var solution = [];

		for (i = 0; i < height; i++) {
			solution[i] = [];

			for (j = 0; j < width; j++) {
				solution[i][j] = j === 0;
			}
		}

		return solution;
	};

	var simulateClick = function (element) {
		simulateMouseEvent("click", element);
	};

	var simulateMouseEvent = function (eventName, element) {
		var event = document.createEvent("MouseEvent");
		event.initMouseEvent(eventName, true, true, window);
		element.dispatchEvent(event);
	};

	beforeEach(function () {
		jasmine.addMatchers({
			toHaveClass: function (util, customEqualityTesters) {
				return {
					compare: function (actual, expected) {
						var result = {
							pass: actual.classList.contains(expected)
						};

						if (result.pass) {
							result.message = "Expected " + actual +
									" not to have class " + expected;
						} else {
							result.message = "Expected " + actual +
									" to have class " + expected;
						}

						return result;
					}
				};
			}
		});
		this.root = document.createElement("div");
		this.subject = new N.Game(this.root, generate);
	});

	it("creates a table cell for each box", function () {
		var rows = this.root.querySelectorAll("tr");
		var i;
		expect(rows.length).toEqual(11); // 10 + header

		for (i = 1; i < 11; i++) {
			expect(rows[i].querySelectorAll("td").length).toEqual(10);
		}
	});

	it("cycles box states in response to clicks", function () {
		var cell = this.root.querySelector("td.expect-on");
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

	describe("When the user drags across several cells", function () {
		var start, middle, end;

		var drag = function () {
			simulateMouseEvent("mousedown", start);
			simulateMouseEvent("mousemove", start);
			simulateMouseEvent("mousemove", middle);
			simulateMouseEvent("mousemove", end);
		};

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
				var other;

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
	});
});
