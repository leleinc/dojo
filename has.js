define(["require"], function(require) {
	//	module:
	//		dojo/has
	//	summary:
	//		Defines the has.js API and several feature tests used by dojo.
	//	description:
	//		This module defines the has API as described by the project has.js with the following additional features:
	// 
	//			* the has test cache is exposed at has.cache.
	//			* the method has.add includes a forth parameter that controls whether or not existing tests are replaced
	//			* the loader's has cache may be optionally copied into this module's has cahce.
	// 
	//		This module adopted from https://github.com/phiggins42/has.js; thanks has.js team! 

	// try to pull the has implementation from the loader; both the dojo loader and bdLoad provide one
	var has = require.has;

	if(!has("loader-hasApi") && typeof has=="function"){
		// notice the condition is written so that if has("loader-hasApi") is transformed to 1 during a build
		// the conditional will be (!1 && typeof has=="function") which is statically false and the closure
		// compiler will discard the block.
		var
			isBrowser= 
				// the most fundamental decision: are we in the browser?
				typeof window!="undefined" && 
				typeof location!="undefined" && 
				typeof document!="undefined" && 
				window.location==location && window.document==document,

			// has API variables
			global = this,
			doc = isBrowser && document,
			element = doc && doc.createElement("DiV"),
			cache = {};
	
		has = function(name){
			//	summary: 
			//		Return the current value of the named feature.
			//
			//	name: String|Integer
			//		The name (if a string) or identifier (if an integer) of the feature to test.
			//
			//	description:
			//		Returns the value of the feature named by name. The feature must have been
			//		previously added to the cache by has.add.

			return cache[name] = typeof cache[name]=="function" ? cache[name](global, doc, element) : cache[name]; // Boolean
		};

		has.cache = cache;
	
		has.add = function(name, test, now, force){
			// summary: 
			//	 Register a new feature test for some named feature.
			//
			// name: String|Integer
			//	 The name (if a string) or identifier (if an integer) of the feature to test.
			//
			// test: Function
			//	 A test function to register. If a function, queued for testing until actually
			//	 needed. The test function should return a boolean indicating
			//	 the presence of a feature or bug.
			//
			// now: Boolean?
			//	 Optional. Omit if `test` is not a function. Provides a way to immediately
			//	 run the test and cache the result.
			//
			// force: Boolean?
			//	 Optional. If the test already exists and force is truthy, then the existing
			//	 test will be replaced; otherwise, add does not replace an existing test (that
			//	 is, by default, the first test advice wins).
			// 
			// example:
			//			A redundant test, testFn with immediate execution:
			//	|				has.add("javascript", function(){ return true; }, true);
			//
			// example:
			//			Again with the redundantness. You can do this in your tests, but we should
			//			not be doing this in any internal has.js tests
			//	|				has.add("javascript", true);
			//
			// example:
			//			Three things are passed to the testFunction. `global`, `document`, and a generic element
			//			from which to work your test should the need arise.
			//	|				has.add("bug-byid", function(g, d, el){
			//	|						// g	== global, typically window, yadda yadda
			//	|						// d	== document object
			//	|						// el == the generic element. a `has` element.
			//	|						return false; // fake test, byid-when-form-has-name-matching-an-id is slightly longer
			//	|				});
	
			(typeof cache[name]=="undefined" || force) && (cache[name]= test);
			return now && has(name);
		};

		// since we're operating under a loader that doesn't provide a has API, we must explicitly initialize
		// has as it would have otherwise been initialized by the dojo loader; use has.add to the builder
		// can optimize these away iff desired
		has.add("host-browser", isBrowser);
		has.add("dom", isBrowser);
		has.add("host-addEventListener", doc && !!doc.addEventListener);
		has.add("loader-pageLoadApi", 1);
		has.add("dojo-sniff", 1);
	}

	has.clearElement= function(element) {
		// summary: 
		//	 Deletes the contents of the element passed to test functions.
		element.innerHTML= "";
		return element;
	};

	has.load= function(id, parentRequire, loaded){
		// summary: 
		//	 Conditional loading of AMD modules based on a has feature test value.
		//
		// mid: String
		//	 Gives the has feature name, a module to load when the feature exists, and optionally a module
		//	 to load when the feature is false. The string had the format `"feature-name!path/to/module!path/to/other/module"`
		//
		// require: Function
		//	 The loader require function with respect to the module that contained the plugin resource in it's
		//	 dependency list.
		// 
		// load: Function
		//	 Callback to loader that consumes result of plugin demand.
	
		var 
			tokens = id.match(/[\?:]|[^:\?]*/g), i = 0,
			get = function(skip){
				var operator, term = tokens[i++];
				if(term == ":"){
					// empty string module name, resolves to undefined
					return undefined;
				}else{
					// postfixed with a ? means it is a feature to branch on, the term is the name of the feature
					if(tokens[i++] == "?"){
						if(!skip && has(term)){
							// matched the feature, get the first value from the options 
							return get();
						}else{
							// did not match, get the second value, passing over the first
							get(true);
							return get(skip);
						}
					}
					// a module
					return term;
				}
			};
		id = get();
		if(id){
			parentRequire([id], loaded);
		}else{
			loaded();
		}
	};

	return has;
});
