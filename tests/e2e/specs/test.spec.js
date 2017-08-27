var createMouseTests = require('../mouse.js');
var pageObject = require('../mouse-page-object');

module.exports = {

    mouseTests : function (browser) {

        var mouseTests = createMouseTests();
        mouseTests.openingOptionsBox(pageObject);
        mouseTests.closingOptionsBox(pageObject);
        mouseTests.hoveringOverAnOption(pageObject);
        mouseTests.selectingAnOption(pageObject);

    }
}