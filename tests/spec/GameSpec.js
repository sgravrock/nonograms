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
		var event = document.createEvent("MouseEvent");
		event.initMouseEvent("click", true, true, window);
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
});
