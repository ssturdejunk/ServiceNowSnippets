var CartExamples = Class.create();
CartExamples.prototype = {
	initialize: function() {
	},

	/*****************************************************
			BEGIN new Cart() FUNCTIONS
	******************************************************/
	createNewRequest: function(current){ // function called by workflow or business rule on the sc_req_item table passing the current record object, perpetuated as current for use in each function
		var reqNum = this._buildCart(current); // return value that will be used in the calling script
		return reqNum;
	},

	// function to build out the cart using values from the current request item
	_buildCart: function(current){
		gs.include('Cart'); // must include this Script include to be able to invoke the Cart object
		var cart = new Cart(null, current.request.requested_for); // create the cart with a name and a user object

		/** test variables from the source record to see if items need to be added to the cart **/

		if(current.variables.onboardItem1.toString() == 'true'){  // if this variable on the current item was true
			this._addOnboardItem1(current,cart); // add that item to the cart. Item is built out in a separate function
		}

		if(current.variables.onboardItem2.toString() == 'true'){ // if this variable on the current item was true
			this._addOnboardItem2(current,cart); // add that item to the cart. Item is built out in a separate function
		}

		var rc = cart.placeOrder(); // complete the order which creates a new request

		return rc.number; // return the newly created request number
	},

	/** functions for specific catalog items to be added to the cart **/ 
	_addOnboardItem1: function(current,cart){
		var item = cart.addItem(gs.getProperty(company.catalog.onboarding.item1)); // store the sys_id of the catalog item in a property instead of hard-coding
		this._getBaseItem(current,cart,item); // map shared variables from the source record to the new item
		
		/** map unique variables from the source record to the new item variables **/
		cart.setVariable(item, 'variable1', current.variables.onboardItem1_option1); 
		cart.setVariable(item, 'variable2', current.variables.onboardItem1_option2); 
		return;
	},

	_addOnboardItem2: function(current,cart){
		var item = cart.addItem(gs.getProperty(company.catalog.onboarding.item2)); // store the sys_id of the catalog item in a property instead of hard-coding
		this._getBaseItem(current,cart,item); // map shared variables from the source record to the new item
		
		/** map unique variables from the source record to the new item variables **/
		cart.setVariable(item, 'variable1', current.variables.onboardItem2_option1); 
		cart.setVariable(item, 'variable2', current.variables.onboardItem2_option2); 
		return;
	},

	_getBaseItem: function(current,cart,item){
		/** shared variables from all catalog items (maybe from a variable set that all items use) **/
		cart.setVariable(item, 'requested_for', current.variables.user);
		cart.setVariable(item, 'user_manager', current.variables.user_manager.toString());
		cart.setVariable(item, 'department', current.variables.department.toString());
		cart.setVariable(item, 'user_location', current.variables.user_location.toString());
		cart.setVariable(item, 'requested_by', current.variables.onboarding_date);
		return;
	},

	/*****************************************************
			END new Cart() FUNCTIONS
	******************************************************/

	/*****************************************************
            BEGIN new sn_sc.CartJS() FUNCTIONS
            https://developer.servicenow.com/dev.do#!/reference/api/paris/server/sn_sc-namespace/c_CartJSScoped?navFilter=cartjs
	******************************************************/

	CreateCart: function(current, userManager, newUser){ // function that creates the cart based on the current requested item GlideRecord, userManager object, and newUser object
		var msg = 'This is a selection of necessary entitlements for your employee'; // message we'll use later 
		var cart = new sn_sc.CartJS('onboarding for ' + newUser.name); // create a new cart with a name for the cart
		var item = this._buildCartItem(current, userManager); // create an item to the cart, there could be many of these

		cart.setRequestedFor(userManager.getValue('sys_id')); // set our manager as the requester for this cart
		cart.addToCart(item); // add our newly created item from above to the cart
		cart.setSpecialInstructions(msg); // add our message from above as instructions on the cart


		/** At this point we could just checkout the cart using cart.submitOrder(). 
		 * BUT if we want to drop it out as a draft cart for the manager to complete, 
		 * we use the following steps 
		 * note that only the default cart will display in the portal, 
		 * so we have to move the items in our current cart to the default cart*/

		var cartId = cart.getCartID(); // grab the current cart id

		var defaultCart = this._getUserDefaultCart(userManager);// look up the default cart
		var defaultCartId = defaultCart.getValue('sys_id'); // get the default cart ID

		this._updateCartItem(cartId,defaultCartId); // move the item out of our current cart and into the default cart
		this._deleteCart(cartId); // delete the current cart to keep things clean
		
		gs.eventQueue('catalog.onboarding.cart', defaultCart, userManager.getValue('sys_id')); // we create an event to trigger a notification to the manager to go complete the cart

		return; // we could return something here, or we can just generically 'return' so that processing completes on the calling script.
	},

	_buildCartItem: function(current, userManager, newUser){ // function to form the cart item with the source requested item as a gliderecord object, the user's manager and the user
		var item = {}; // item is a JSON object
		item.sysparm_id = gs.getProperty(company.catalog.onboarding.item1); // sys_id of the catalog item
		item.sysparm_quantity = '1'; // default quantity to 1
		item.variables = {}; // variables are stored in JSON
		/** Set variables with source values **/
		item.variables.user = newUser.getValue('sys_id'); 
		item.variables.user_manager = userManager.getValue('sys_id');
		item.variables.requested_by = current.variables.onboarding_date.getDisplayValue();

		return item; // sends JSON object back with Item details
	},

	_updateCartItem: function(tempCart, defaultCart){ // function to update our item's cart association
		var grItem = new GlideRecord('sc_cart_item'); // look into the cart item table
		grItem.addQuery('cart', tempCart); // find items with our cart ID
		grItem.setLimit(1); // if you know it's only one item, set a limit
		grItem.query();// execute the query
		grItem.next(); // go to the first record (we set limit to one. If you were expecting more, you'd need to loop through them.)
		grItem.cart = defaultCart; // change the cart id on the item to our default cart
		grItem.update(); // update the item

		return;
	},


	_deleteCart: function(cart){ // function to delete any cart sent to this function
		var grCart = new GlideRecord('sc_cart');
		if(grCart.get(cart)){
			grCart.deleteRecord();
		}

		return;
	},

	_getUserDefaultCart: function(user){ // function to find a user's default cart. If there is one, we use it, if not we create it.
		var grCart = new GlideRecord('sc_cart');
		grCart.addQuery('name', 'DEFAULT');
		grCart.addQuery('requested_for', user.getValue('sys_id'));
		grCart.setLimit(1);
		grCart.query();
		if(grCart.hasNext()){
			grCart.next();
		}
		else{
			grCart.initialize();
			grCart.name = 'DEFAULT';
			grCart.user = user.getValue('sys_id');
			grCart.requested_for = user.getValue('sys_id');
			grCart.hidden = false;
			grCart.insert();
		}

		return grCart;
	},

	/*****************************************************
			END new sn_sc.CartJS() FUNCTIONS
	******************************************************/

	type: 'CartExamples'
};