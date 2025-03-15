"use strict";
describe("DragCommand", function() {
	describe("undo", function() {
		it("restores previous cell states", function() {
			const selectedCells = [
				new N.Cell(),
				new N.Cell(),
				new N.Cell(),
			];
			selectedCells[1].setState("on");
			selectedCells[2].setState("off");
			const subject = new N.DragCommand(selectedCells, "on");

			subject.do();
			subject.undo();

			expect(selectedCells.map(c => c.state)).toEqual([null, "on", "off"]);
		});
	});
});
