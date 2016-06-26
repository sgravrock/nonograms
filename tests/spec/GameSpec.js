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

	beforeEach(function () {
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
});
