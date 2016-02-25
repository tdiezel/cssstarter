// Default js file. You can add the plugins in the /vendors folder
(function() {

"use strict";

var APP = APP || {};

APP.CommonClasses = {
	active: 'is-active',
	open: 'is-open',
	push: 'is-pushed'
};

APP.MyModule = {
	el: {
		exempleLinks: $("a"),
	},
	init: function(){
		this.Log(); // Launch on page load
		this.binds(); // Binds
	},
	binds: function() {
		this.el.exempleLinks.on('click', function(e) {
			console.log('clicked!');
			APP.MyModule.Log(); // You can also call functions
		});
	},
	Log: function() {
		console.log('LOG');
	}
}


APP.init = function() {
	// List all module
	APP.MyModule.init();
}

APP.init();

})();