describe("findRuns", function () {
	it("finds nothing", function () {
		expect(N.findRuns([false, false, false])).toEqual([]);
	});

	it("finds a simple run", function () {
		expect(N.findRuns([true, true, false])).toEqual([{off: 0, len: 2}]);
	});

	it("finds a simple run that's not at the start", function () {
		expect(N.findRuns([false, true, true])).toEqual([{off: 1, len: 2}]);
	});

	it("finds multiple runs", function () {
		expect(N.findRuns([true, false, true, true])).toEqual([
			{off: 0, len: 1},
			{off: 2, len: 2}
		]);
	});
});
