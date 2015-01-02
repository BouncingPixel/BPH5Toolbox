/*
 * BPH5Toolbox.js
 * For use with CreateJS exports from Flash
 * (c) 2014 Bouncing Pixel
 *
 */

"use strict";

//
// 
//
var BPH5Toolbox = {};

/* AddMovieClipActions(instance:createjs.DisplayObject, actions:Array)
	Sets up actions to happen at points along a CreateJS DisplayObjects's timeline
	
	You cannot add more actions to the same DisplayObject later, the timeline callback is overwritten each time you call AddMovieClipActions. Make sure to gather all actions into one array before calling it.
	
	 Each action's Parameters = {
		label:String,			The timeline label to look for
		beforeLabel:Boolean, 	If you want to put the action before the label, use this
		stop:Boolean,			set a stop at that frame
		action:Function,		set a function to occur at that frame
		atEnd:Boolean			
	 }
*/
BPH5Toolbox.AddMovieClipActions = function( instance, actions ) {

	//Every time the frame changes, check whether an action must be performed
	instance.timeline.onChange = function() {
		var i;
		var position = instance.timeline.position;
		var actionPosition;

		for( i = 0 ; i < actions.length ; i++ ) {
			actionPosition = instance.timeline.resolve( actions[i].label );

			if( actions[i].beforeLabel ) {
				actionPosition = actionPosition - 1;
			}
			if( actions[i].label === '__END__' ) { //special label for the end of the timeline
				actionPosition = instance.timeline.duration-1; //set up to check atEnd param
			}
			if (actions[i].atEnd){
				var k = instance.timeline.duration;
				//search for the next label after this one
				for (var l in instance.timeline._labels){
					var temp = instance.timeline.resolve(l);
					if(temp > actionPosition && temp < k){
						k = temp;
					}
				}
				actionPosition = k - 1; //WARNING! This seems to stack with __END__ label - 1. Test for possible discrepancy
			}

			// at the frame label
			if( position === actionPosition ) {
				if( actions[i].stop ) { instance.stop(); }
				if( actions[i].action ) { actions[i].action.call( instance ); }
				break;
			}
		}
	};
};

//
//	InitializeBitmap( imageID:String, parameters:Object )
//
//	Initializes a createjs.Bitmap from an image.
//	Optional parameters object.
//  Returns a createjs.Bitmap.
//
//	parameters = {
//		xPosition:Number,
//		yPosition:Number,
//		scale:Number,
//		scaleX:Number,
//		scaleY:Number,
//		rotation:Number,
//		centerRegistration:Boolean
//	};
//
BPH5Toolbox.InitializeBitmap = function( imageArray, imageID, parameters ) {
	var bitmap = new createjs.Bitmap( imageArray[ imageID ] );
	
	if( parameters ) {
		if( parameters.centerRegistration ) {
			bitmap.regX = bitmap.image.width / 2;
			bitmap.regY = bitmap.image.height / 2;
		}
		if( parameters.xPosition ) { bitmap.x = parameters.xPosition; }
		if( parameters.yPosition ) { bitmap.y = parameters.yPosition; }
		if( parameters.scale ) { bitmap.scaleX = bitmap.scaleY = parameters.scale; }
		if( parameters.scaleX ) { bitmap.scaleX = parameters.scaleX; }
		if( parameters.scaleY ) { bitmap.scaleY = parameters.scaleY; }
		if( parameters.rotation ) { bitmap.rotation = parameters.rotation; }
	}

	return bitmap;
};

//
//	MakeButton( displayObject:createjs.DisplayObject, parameters:Object )
//
//	Adds button listeners to a createjs.DisplayObject.
//	Optional parameters object.
//	Returns nothing.
//
//	parameters = {
//		callback:Function,
//		normalState:String,
//		hoverState:String,
//		keepOldOnPress:Boolean,
//		noAutoHover:Boolean,	//prevents default hover behavior if true
//		hoverFunc:Function,
//		normalFunc:Function,
//		upFunc:Function,	//do something special when released
//		setHitArea:String, //values: ellipse, rectangle, or undefined by default.
//		passEvent:Boolean, 	//passes the event to callback
//		passObj:Object, 	//passes an object to the callback
//		passMC:Boolean,		//passes displayobject to the callback
//		passThroughObject:DisplayObject //special case when you want to call another object's onPress event when this one is clicked
//	};
//
BPH5Toolbox.MakeButton = function( displayObject, parameters ) {
	//if button is already registered, replace it with the new one
	if(_registeredButtons.indexOf(displayObject) > 0){ 
		BPH5Toolbox.RemoveInteractive(displayObject); 
	}
	if( !parameters ) { parameters = {}; }
	if( !parameters.normalState ) { parameters.normalState = "N"; }
	if( !parameters.hoverState ) { parameters.hoverState = "H"; }
	_registeredButtons.push(displayObject);

	if(displayObject.gotoAndStop){
		displayObject.gotoAndStop( parameters.normalState );		
	}
		
	if(parameters.setHitArea){
		var hitArea = new createjs.Shape();
		if(parameters.setHitArea == "ellipse"){
			hitArea.graphics.beginFill("#00F").drawEllipse(-1*displayObject.nominalBounds.width/2,-1*displayObject.nominalBounds.height/2,displayObject.nominalBounds.width,displayObject.nominalBounds.height);
		}
		else if(parameters.setHitArea == "rectangle"){
			hitArea.graphics.beginFill("#00F").drawRect(-1*displayObject.nominalBounds.width/2,-1*displayObject.nominalBounds.height/2,displayObject.nominalBounds.width,displayObject.nominalBounds.height);
		}		
		displayObject.hitArea = hitArea;
		console.log("Creating hit area: ",displayObject.hitArea);
	}
	// wrapped to keep old onPress available
	(function( oldOnPress ) {

		displayObject.onPress = function( event ) {
			displayObject.pressed = true;
			event.onMouseUp = function(ev){				
				displayObject.pressed = false;
				if(parameters.upFunc){
					if(parameters.passEvent){
						parameters.upFunc(ev);
					}
					else{
						parameters.upFunc();
					}
				}
				if(parameters.passThroughObject && parameters.passThroughObject.onMouseUp){
					ev.target = parameters.passThroughObject;
					parameters.passThroughObject.onMouseUp(ev);
				}
			};
			if(parameters.passMC){
				parameters.callback(displayObject);
			}
			else if(parameters.passObj){
				parameters.callback(parameters.passObj);
			}
			else if(parameters.passEvent){
				parameters.callback(event);
			}
			else{
				parameters.callback();
			}
			if( parameters.keepOldOnPress && oldOnPress ) { oldOnPress(); }
			if(parameters.passThroughObject && parameters.passThroughObject.onPress){
				event.target = parameters.passThroughObject;
				parameters.passThroughObject.onPress(event);
			}
			
		};

	})(displayObject.onPress);

	displayObject.onMouseOut = function( event ) {
		if(displayObject.timeline && !parameters.noAutoHover && !parameters.pressed) { //&& !parameters.pressed
			displayObject.gotoAndStop( parameters.normalState );
		}
		if(parameters.normalFunc){
			if(parameters.passMC){
				parameters.normalFunc(displayObject);
			}
			else{
				parameters.normalFunc();				
			}
		}
	};

	displayObject.onMouseOver = function( event ) {
		if(displayObject.timeline && !parameters.noAutoHover){
			displayObject.gotoAndStop( parameters.hoverState );
		}
		if(parameters.hoverFunc){
			if(parameters.passMC){
				parameters.hoverFunc(displayObject);
			}
			else{
				parameters.hoverFunc();
			}
		}
	};
};

//this stores every registered button
var _registeredButtons = []; 


//
//	MakeRadioButtonsFromDisplayObjects( displayObjects:Array, parameters:Object )
//
//	Adds radio button listeners to createjs.DisplayObjects.
//	Optional parameters object.
//	Returns nothing.
//
//	parameters = {
//		callback:Function,
//		normalState:String,
//		selectedState:String,
//		hoverState:String,
//		keepOldOnPress:Boolean
//	};
//
BPH5Toolbox.MakeRadioButtons = function( displayObjects, parameters ) {

	//
	// UNTESTED!
	//

	if( !parameters ) { parameters = {}; }
	if( !parameters.normalState ) { parameters.normalState = "N"; }
	if( !parameters.selectedState ) { parameters.selectedState = "N"; }
	if( !parameters.hoverState ) { parameters.hoverState = "H"; }

	var i;
	var displayObject;

	for( i = 0 ; i < displayObjects.length ; i++ ) {
		displayObject = displayObjects[ i ];

		// wrapped to keep old onPress available
		(function( oldOnPress ) {

			displayObject.onPress = function( event ) {
				var j;
				for( j = 0 ; j < displayObjects.length ; j++ ) {
					displayObjects[ j ].RBSetChosen( false );
				}
				displayObject.RBSetChosen( true );
				parameters.callback();
				if( parameters.keepOldOnPress && oldOnPress ) { oldOnPress(); }
			};

		})(displayObject.onPress);

		displayObject.onMouseOut = function( event ) {
			if( !displayObject._rbChosen ) {
				displayObject.gotoAndStop( parameters.normalState );
			}
			else {
				displayObject.gotoAndStop( parameters.selectedState );
			}
		};

		displayObject.onMouseOver = function( event ) {
			displayObject.gotoAndStop( parameters.hoverState );
		};

		displayObject.RBSetChosen = function( isChosen ) {
			displayObject._rbChosen = isChosen;
			if( isChosen ) {
				displayObject.gotoAndStop( parameters.selectedState );
			}
			else {
				displayObject.gotoAndStop( parameters.normalState );
			}
		};
	}
};

/*
	MakeMultipleChoice( displayObject:createjs.DisplayObject, options:Array, callback:Function, parameters:Object )

	This is based on as3 toolbox DropDownCreator.
	A flash-exported DisplayObject should contain all the option objects, unless it's a dropdown. 
	If it's a dropdown, it should contain an option and a slot object. 
	Each option object contains a text field and a background. Hover states are applied to the background object.
	
	Each displayObject in the createJS export needs to be named differently; set optionName, optionTFName, and optionBGName to deal with these differences.
	
	Optional parameters object.
	Returns nothing.
 		options array element
 		---------------------
		{ text:"", correct:false }

	parameters = {
		randomize:Boolean,			//default undefined
		submitBtn:createjs.DisplayObject	//default undefined
		optionName:String 			//default "option" 	
		optionTFName:String 		//default "tf"		
		optionBGName:String 		//default "bg"		
		validateEach:Boolean		//default undefined //waits until you pick the right one to continue
		clickCallback:Function 		//default undefined //called whenever a button is clicked, regardless of validation
		wrongCallback				//default undefined //used for dropdowns only. TODO: test and use in other cases
	
		normalState:String 			//default "N"
		hoverState:String 			//default "H"
		hoverSound:String 			//default "ButtonHover"
		wrongFrameLabel:String 		//default "W"
		rightFrameLabel:String 		//default "R"

		immediateAnswer:Boolean 	//default true 		//whether to wait for validation or not

		isDropdown:Boolean			//default undefined //Makes this behave like DropdownCreator from Flash toolbox
		optionClass:String 			//default undefined //The name of the function in the exported js that serves as the basis for the options
		slotName:String 			//default "slot" // Required for dropdown
		slotTFName:String 			//default "tf"	//required for dropdown
		slotBGName:String 			//default "bg" 	//required for dropdown

	};
*/

var _registeredMultipleChoice = [];

BPH5Toolbox.MakeMultipleChoice = function(displayObject, options, callback, parameters){
	//check params for consistency
	if(parameters == null){parameters = {};}
	if(!parameters.immediateAnswer){ parameters.immediateAnswer = true;}
	if(!parameters.optionName){ parameters.optionName = "option";}
	if(!parameters.optionTFName){ parameters.optionTFName = "tf";}
	if(!parameters.optionBGName){ parameters.optionBGName = "bg";}
	if(!parameters.wrongFrameLabel){parameters.wrongFrameLabel = "W";}	
	if(!parameters.rightFrameLabel){parameters.rightFrameLabel = "R";}
	if(!parameters.normalState){parameters.normalState = "N";}	
	if(!parameters.hoverState){parameters.hoverState = "H";}
	if(!parameters.hoverSound){parameters.hoverSound = "ButtonHover";}
	if(!parameters.clickSound){parameters.clickSound = "ClickSound";}
	parameters.displayObject = displayObject;
	parameters.callback = callback;
	parameters.options = options;

	//Change the order of the options but not the display objects themselves
	if(parameters.randomize){
		var newOptions = []; 
		var rand;
		while(options.length > 0){
			rand = Math.floor(Math.random()*options.length);
			newOptions.push(options[rand]);
			options.splice(rand,1);
		}
		options = newOptions;
	}

	//set up heights
	var diffY = 0;
	if(parameters.isDropdown){
		if(!parameters.slotName){ parameters.slotName = "slot";}
		if(!parameters.slotTFName){ parameters.slotTFName = "tf";}
		if(!parameters.slotBGName){ parameters.slotBGName = "bg";}
		diffY = displayObject[parameters.optionName].y - displayObject[parameters.slotName].y;
		displayObject[parameters.optionName].visible = false;
		displayObject[parameters.slotName][parameters.slotBGName].gotoAndStop(0);
		displayObject[parameters.slotName][parameters.slotTFName].text = "";
	}

	var i = 0;
	for(i = 0; i < options.length;i++){
		if(parameters.isDropdown){
			//use the assumed domain "lib", optionClass is a strig
			var optionClass = window["lib"][parameters.optionClass]; 
			if(optionClass == undefined){
				console.log("ERROR: option class not found");
				break;
			}
			displayObject[parameters.optionName + (i+1)] = new optionClass();
			displayObject[parameters.optionName + (i+1)].y = displayObject[parameters.optionName].y + ((i-0.5) * diffY);
			displayObject.addChild(displayObject[parameters.optionName+(i+1)]);
		}
		//displayObject[parameters.optionName+(i+1)].visible = true;
		displayObject[parameters.optionName+(i+1)][parameters.optionTFName].text = options[i].text;
		displayObject[parameters.optionName+(i+1)].correct = options[i].correct;
		displayObject[parameters.optionName+(i+1)].optionNum = i;		
		displayObject[parameters.optionName+(i+1)][parameters.optionBGName].gotoAndStop(parameters.normalState);
		if(parameters.isDropdown){
			console.log("DISPLAY OBJECT    ",displayObject);
			//add buttons for click option and click slot
			//Option button
			BPH5Toolbox.MakeButton(displayObject[parameters.optionName+(i+1)],{callback:selectOption,
				noAutoHover:true,
				passMC:true,
				hoverLabel: parameters.hoverState,
				normalState: parameters.normalState,
				rightFrameLabel:parameters.rightFrameLabel,
				wrongFrameLabel:parameters.wrongFrameLabel,
				hoverFunc:function(){choiceBackFunction(displayObject[parameters.optionName+(i+1)],parameters.optionBGName,parameters.hoverState);
					playSound(parameters.hoverSound);},
				normalFunc:function(){choiceBackFunction(displayObject[parameters.optionName+(i+1)],parameters.optionBGName,parameters.normalState);}
			});
		}
		else{

			BPH5Toolbox.MakeButton(displayObject[parameters.optionName+(i+1)],{callback:clickMultipleChoice,
				noAutoHover:true,
				passMC:true,
				normalState: parameters.normalState,
				rightFrameLabel:parameters.rightFrameLabel,
				wrongFrameLabel:parameters.wrongFrameLabel,
				hoverFunc:function(){choiceBackFunction(displayObject[parameters.optionName+(i+1)],parameters.optionBGName,parameters.hoverState);},
				normalFunc:choiceBackFunction(displayObject[parameters.optionName+(i+1)],parameters.optionBGName,parameters.normalState)
			});
		}
	}
	//i should end up at options.length. Reset unused display objects and hide them
	while(displayObject[parameters.optionName+(i+1)]){
		displayObject[parameters.optionName+(i+1)][parameters.optionTFName].text = "";
		displayObject[parameters.optionName+(i+1)][parameters.optionBGName].gotoAndStop(parameters.normalState);
		//displayObject[parameters.optionName+(i+1)].visible = false;
		i++;
	}

	if(parameters.isDropdown){
		hideOptions( parameters ); //this also sets slot button
	}

	_registeredMultipleChoice.push(parameters);
};

// 
// Functions for dropdowns
// 

var selectOption = function(displayObject){
	var params = findMultipleChoice(displayObject.parent);
	console.log( "PARAMS   ", params);
	params.currentOption = displayObject.optionNum;
	params.status = "wrong";

	hideOptions(params);
	params.displayObject[params.slotName][params.slotTFName].text = displayObject[params.optionTFName].text;
	//if there's a submit button, wait to validate
	if(!params.submitBtn){
		ValidateMC(params,displayObject); 
	}
	if(params.clickCallback){
		//this used to just pass displayObject but has been expanded for old dropdowncreator support
		params.clickCallback(params.displayObject, displayObject.optionNum);
	}
};

var showOptions = function(params){
	for(var i=1;i<=params.options.length;i++){
		params.displayObject[params.optionName+i].visible = true;
	}

	//hide all OTHER dropdowns
	for(i=0;i<_registeredMultipleChoice.length;i++){
		if(_registeredMultipleChoice[i].open){
			hideOptions(_registeredMultipleChoice[i]);
		}
	}
	params.open = true;
		BPH5Toolbox.MakeButton(params.displayObject[params.slotName],{
			callback:hideOptions,
			normalFunc:choiceBackFunction(params.displayObject[params.slotName],params.slotBGName,params.normalState),
			hoverFunc:choiceBackFunction(params.displayObject[params.slotName],params.slotBGName,params.hoverState),
			normalState: params.normalState,
			noAutoHover:true,
			passObj:params
		}); 
};

var hideOptions = function(params){
	for(var i = 1;i<= params.options.length;i++){
		params.displayObject[params.optionName+i].visible = false;
	}
	params.open = false; //this var is created here if it doesn't exist
	//make button for slot to reopen it
	if(params.status == "wrong"){
		BPH5Toolbox.MakeButton(params.displayObject[params.slotName],{
			callback:showOptions,
			normalFunc:choiceBackFunction(params.displayObject[params.slotName],params.slotBGName,params.wrongFrameLabel),
			hoverFunc:choiceBackFunction(params.displayObject[params.slotName],params.slotBGName,params.hoverState),
			noAutoHover:true,
			// hoverLabel: params.hoverState,
			// normalState: params.normalState,
			passObj:params
		}); 
	}
	else{
		console.log( params );
		BPH5Toolbox.MakeButton(params.displayObject[params.slotName],{
			callback:showOptions,
			normalFunc:choiceBackFunction(params.displayObject[params.slotName],params.slotBGName,params.normalState),
			hoverFunc:function(){choiceBackFunction(params.displayObject[params.slotName],params.slotBGName,params.hoverState); playSound(params.hoverSound);},
			upFunc: function(){playSound(params.clickSound);},
			noAutoHover:true,
			// hoverLabel: params.hoverState,
			// normalState: params.normalState,
			passObj:params
		}); 
	}
};

//function for normal multiple choice (all buttons exist on screen)
var clickMultipleChoice = function(displayObject){
	var params = findMultipleChoice(displayObject.parent); //get the button container
	if (!params){
		console.log("ERROR: Could not find multiple choice params");
		return;
	}

	if(params.submitBtn){ //assume this means wait to validate
		//reactivate all other buttons
		var i = 0;
		while(params.displayObject[params.optionName+(i+1)]){
			BPH5Toolbox.MakeButton(params.displayObject[params.optionName+(i+1)],{callback:clickMultipleChoice,noAutoHover:true,passMC:true,
				hoverFunc:choiceBackFunction(params.displayObject[params.optionName+(i+1)],params.optionBGName,params.hoverState),
				normalFunc:choiceBackFunction(params.displayObject[params.optionName+(i+1)],params.optionBGName,params.normalState)
			});
			params.displayObject[params.optionName+(i+1)][params.optionBGName].gotoAndStop(params.normalState);
			i++;
		}
		params.submitBtn.visible = true;
		BPH5Toolbox.RemoveInteractive(displayObject);
		displayObject[params.optionBGName].gotoAndStop(params.hoverState);
		BPH5Toolbox.MakeButton(params.submitBtn,{callback:function(){
			ValidateMC(params,displayObject);
		}});
	}
	else{
		ValidateMC(params,displayObject);
	}
	if(params.clickCallback){
		params.clickCallback(displayObject);
	}
};

var ValidateMC = function(paramObj,buttonClicked){
	var i = 1;
	var theButton;
	if(buttonClicked.correct){
		paramObj.status = "right";
		playSound("rightSound"); //this is hardcoded and should ideally be passed as a param
		buttonClicked[paramObj.optionBGName].gotoAndStop(paramObj.rightFrameLabel);
		if(paramObj.isDropdown){
			if(paramObj.displayObject[paramObj.slotName][paramObj.slotBGName].timeline.resolve(paramObj.rightFrameLabel)){
				paramObj.displayObject[paramObj.slotName][paramObj.slotBGName].gotoAndStop(paramObj.rightFrameLabel);
			}
			else{
				paramObj.displayObject[paramObj.slotName][paramObj.slotBGName].gotoAndStop(paramObj.normalState);
			}
		}
	}
	else{		
		paramObj.status = "wrong";
		playSound("wrongSound"); //this is hardcoded and should ideally be passed as a param
		buttonClicked[paramObj.optionBGName].gotoAndStop(paramObj.wrongFrameLabel);
		//If it's a dropdown, apply the wrong state to the slot too
		if(paramObj.isDropdown){
			paramObj.displayObject[paramObj.slotName][paramObj.slotTFName].text = "";
			paramObj.displayObject[paramObj.slotName][paramObj.slotBGName].gotoAndStop(paramObj.wrongFrameLabel);
		}
	}
	paramObj.answer = buttonClicked[paramObj.optionTFName].text; //save answer for external checking
	
	if(paramObj.isDropdown){
		hideOptions(paramObj);
		BPH5Toolbox.RemoveInteractive(buttonClicked);

		if(paramObj.status == "right"){
			BPH5Toolbox.RemoveInteractive(paramObj);
			paramObj.callback(paramObj.displayObject,buttonClicked.optionNum);
		}
		else if(paramObj.wrongCallback){
			paramObj.wrongCallback(paramObj.displayObject,buttonClicked.optionNum);
		}
	}
	else if(paramObj.validateEach){ //must click on all correct answers to proceed
		BPH5Toolbox.RemoveInteractive(buttonClicked);
		//Show the final callback if all the right ones are selected.
		i = 1;
		var done = true;
		while(theButton = paramObj.displayObject[paramObj.optionName + i]){
			if(theButton.correct && theButton[paramObj.optionBGName].currentFrame != theButton[paramObj.optionBGName].timeline.resolve(paramObj.rightFrameLabel)){
				done = false;
				break;
			}
			i++;
		}
		if(done){
			i = 1;
			while(theButton = paramObj.displayObject[paramObj.optionName + i]){
				BPH5Toolbox.RemoveInteractive(theButton);
				i++;
			}
			paramObj.callback();
		}
	}
	else{ //single choice validation		
		i = 1;
		theButton = paramObj.displayObject[paramObj.optionName + i];
		while(theButton){//also show the correct answers
			if(theButton.correct){
				theButton[paramObj.optionBGName].gotoAndStop(paramObj.rightFrameLabel);
			}
			BPH5Toolbox.RemoveInteractive(theButton);
			i++;
			theButton = paramObj.displayObject[paramObj.optionName + i];
		}
		paramObj.callback();
	}
};

//because we aren't changing the background of the displayObject itself
//We need to change the state of the background object instead
var choiceBackFunction = function(displayObject,bgName,label){
	return function(){displayObject[bgName].gotoAndStop(label);}
};

var findMultipleChoice = function(displayObject){
	for(var i = 0;i<_registeredMultipleChoice.length;i++){
		if(_registeredMultipleChoice[i].displayObject == displayObject){
			return _registeredMultipleChoice[i];
		}
	}
	return null;
};

//External accessor methods
BPH5Toolbox.GetStatus = function(displayObject){
	return(findMultipleChoice(displayObject).status);
};

BPH5Toolbox.GetAnswer = function(displayObject){
	return(findMultipleChoice(displayObject).answer);
};

//
// Shortcut for creating multiple draggables at once. They all have the same targets.
//
BPH5Toolbox.MakeDraggableMulti = function( displayObjectArray, collidesWith, callback, dropAnywhere, parameters ) {
	var i;
	for( i = 0 ; i < displayObjectArray.length ; i++ ) {
		BPH5Toolbox.MakeDraggable( displayObjectArray[i], collidesWith, callback, dropAnywhere, parameters );
	}
};

var _registeredDraggables = [];


//
//	MakeDraggable( displayObject:createjs.DisplayObject, collidesWith:Array, callback:Function, dropAnywhere:Boolean, parameters:Object)
//
//	Creates a draggable object with target collidesWith.
//	Returns nothing.
//
//	parameters = {
//		clickAction:Function, //happens when you first click the object
//		hitDebugContainer:Container
//		scaleChange:Number //overrides the normal scale change
//		moveAction:Function //happens on mouse move
// 		upAction:Function //happens when you release the mouse, regardless of hit or not
// 		missAction:Function //what it does when it doesn't hit a target
//		setHitArea:String //values: ellipse, rectangle, or undefined by default.
//	};
//
BPH5Toolbox.MakeDraggable = function( displayObject, collidesWith, callback, dropAnywhere, parameters ) {

	var self = this;
	_registeredDraggables.push(displayObject);
	if( !parameters ) { parameters = {}; }

	displayObject.dragging = false;
	displayObject.snapToPixel = true;
	stage.mouseMoveOutside = true;
	
	if(parameters.setHitArea){
		var hitArea = new createjs.Shape();
		if(parameters.setHitArea == "ellipse"){
			hitArea.graphics.beginFill("#00F").drawEllipse(-1*displayObject.nominalBounds.width/2,-1*displayObject.nominalBounds.height/2,displayObject.nominalBounds.width,displayObject.nominalBounds.height);
		}
		else if(parameters.setHitArea == "rectangle"){
			hitArea.graphics.beginFill("#00F").drawRect(-1*displayObject.nominalBounds.width/2,-1*displayObject.nominalBounds.height/2,displayObject.nominalBounds.width,displayObject.nominalBounds.height);
		}		
		displayObject.hitArea = hitArea;
	}
	displayObject.preDragScale = displayObject.scaleX;

	displayObject.onPress = function( event ) {
		displayObject.dragging = true;
		displayObject.preDragX = displayObject.x;
		displayObject.preDragY = displayObject.y;
		displayObject.origParent = displayObject.parent; //adding it back to the parent is the easiest way to preserve bounds and position
		//if we want to not add it back to parent:
		//var originalPosition = displayObject.localToGlobal( displayObject.nominalBounds.x, displayObject.nominalBounds.y );
		//displayObject.preDragX = originalPosition.x+displayObject.nominalBounds.width/2;
		//displayObject.preDragY = originalPosition.y+displayObject.nominalBounds.height/2;
		if(parameters.scaleChange){
			displayObject.scaleX = displayObject.scaleY = displayObject.preDragScale * parameters.scaleChange;
		}
		else{
			displayObject.scaleX = displayObject.scaleY = displayObject.preDragScale * 1.1;
		}
		stage.addChild( displayObject );
		if(parameters.clickAction){
			parameters.clickAction();
		}
		displayObject.x = event.stageX;
		displayObject.y = event.stageY;
		event.onMouseMove = function( ev ) {
			displayObject.x = ev.stageX || displayObject.x;
			displayObject.y = ev.stageY || displayObject.y;
			if(parameters.moveAction){
				parameters.moveAction(displayObject);
			}
			stage.update();
		};
		event.onMouseUp = function( ev ) {
			var i;
			var collided = false;
			var doPt, cwPt;
			var doRect, cwRect;
			displayObject.dragging = false;
			console.log("scaled back to",displayObject.scaleX);
			if( collidesWith ) {
				// do rectangle collision here
				doPt = displayObject.localToGlobal( displayObject.nominalBounds.x, displayObject.nominalBounds.y );
				doRect = { x:doPt.x, y:doPt.y, width:displayObject.nominalBounds.width*displayObject.scaleX, height:displayObject.nominalBounds.height*displayObject.scaleY };
				for( i = 0 ; i < collidesWith.length ; i++ ) {
					cwPt = collidesWith[i].localToGlobal( collidesWith[i].nominalBounds.x, collidesWith[i].nominalBounds.y );
					cwRect = { x:cwPt.x, y:cwPt.y, width:collidesWith[i].nominalBounds.width*collidesWith[i].scaleX, height:collidesWith[i].nominalBounds.height*collidesWith[i].scaleY };
					console.log( "precollision ", displayObject, collidesWith[i], "doRect", doRect, "cwRect",cwRect);
					if(parameters.hitDebugContainer){
						self.DrawHitRectangles(doRect,cwRect,parameters.hitDebugContainer);
					}
					if( BPH5Toolbox.RectanglesIntersect( doRect, cwRect ) ) {
						displayObject.x = cwRect.x;
						displayObject.y = cwRect.y;
						console.log( "collided! ", "doRect", doRect, "cwRect",cwRect, collidesWith[i].nominalBounds.width,collidesWith[i].nominalBounds.height );
						collided = true;
						displayObject.scaleX = displayObject.scaleY = displayObject.preDragScale;
						displayObject.origParent.addChild(displayObject);
						callback( displayObject,collidesWith[i] );
						if(parameters.upAction){
							parameters.upAction(displayObject);
						}
						return;
					}
				}
			}
			console.log( "didn't collide" );
			if( !dropAnywhere ) {
				displayObject.scaleX = displayObject.scaleY = displayObject.preDragScale;
				BPH5Toolbox.SnapBack(displayObject);
			}
			if(parameters.missAction){
				parameters.missAction(displayObject);
			}
			if(parameters.upAction){
				parameters.upAction(displayObject);
			}
			displayObject.origParent.addChild(displayObject);//always add back to parent
		};

		stage.update();
	};
};

//Public function to set an object to snap back to its pre-dragged position (saved when first set up)
BPH5Toolbox.SnapBack = function(displayObject){	
	console.log( "snapping back to " + displayObject.preDragX + " " + displayObject.preDragY );
	displayObject.x = displayObject.preDragX;
	displayObject.y = displayObject.preDragY;
};


/*
	Allows an object to be pulled/dragged to a certain object, while animating
	it along its timeline
	Added by Deary Hudson (AS3 port)

	@parameters
	animatedObj: MovieClip
	frameLabel: String
	endFunc: Function
	distToDrag: int
	goBackOnRelease: Boolean
	transitionType: String
	animByDistance: Boolean
	params: JSON Object
*/
BPH5Toolbox.MakePullable = function(animatedObj, frameLabel, endFunc, distToDrag, goBackOnRelease, transitionType, animByDistance, params){
	var __mc;		
	var __mci;
	var __goBackOnRelease = false;
	var __mouseDiff = 0;
	var __mouseStartX = 0;
	var __mouseStartY = 0;
	var __animByDistance = false;		
	var __dragRatio = 1; //pixels per frame
	var __frameLabel = "";
	var __endFunc;
	var __params; 
	var __initialFrame; //updates each time you click, if forwardOnly
	var __direction;

	var __tweenCounter = {};
	var __transitionType;

	var __remainderTime = 0;
	var __lastTime = 0;
	var __framesLeft = 0;
	var __framesDuration;

	setupAnimation(animatedObj, frameLabel, endFunc, distToDrag, goBackOnRelease, transitionType, animByDistance, params);

	function setupAnimation(animatedObj, frameLabel, endFunc, distToDrag, goBackOnRelease, transitionType, animByDistance, params){
		if( params == null){ params = {} };
		animatedObj.onPress = function(event){clickMove(event)};
		__frameLabel = frameLabel;
		__mc = animatedObj;
		__animByDistance = animByDistance;
		__goBackOnRelease = goBackOnRelease;
		__transitionType = transitionType;
		__endFunc = endFunc;
		__initialFrame = animatedObj.timeline.resolve(frameLabel);
		__params = params;
		__framesDuration = BPH5Toolbox.getFrameLabelDuration( animatedObj, frameLabel );
		if( distToDrag != 0 ){
			__dragRatio = distToDrag / BPH5Toolbox.getFrameLabelDuration( animatedObj, frameLabel);
			console.log( "Drag Ratio: ", __dragRatio );
		}
	}
	function clickMove(mouseEvent){
		console.log("!CLICK MOVE!");
		console.log(mouseEvent);
		__direction = "";
		if( __params.forwardOnly == true ){
			if( __mc.currentFrame > __mc.timeline.resolve(__frameLabel) ){
				__initialFrame = __mc.currentFrame;
			}
			else{
				__initialFrame = __mc.timeline.resolve(__frameLabel);
			}
			__mc.gotoAndStop(__initialFrame);
		}
		else{
			__mc.gotoAndStop( __mc.timeline.resolve(__frameLabel) );
		}

		__mouseStartX = mouseEvent.stageX;
		__mouseStartY = mouseEvent.stageY;
		__mc.getStage().onMouseMove= function(event){drag(event)};

		if( !__params.noRelease ){
			__mc.getStage().onMouseUp = function(event){releaseMove(event)};
		}

		if( __params.startFunc ){
			__params.startFunc();
		}
	}
	function drag(event){
		if( __params.useY == true ){
			__mouseDiff = __mouseStartY - event.stageY;
		}else{
			__mouseDiff = __mouseStartX - event.stageX;
		}

		var frameNum = __initialFrame + Math.floor( __mouseDiff / __dragRatio );
		var maxFrame = __mc.timeline.resolve(__frameLabel) + BPH5Toolbox.getFrameLabelDuration(__mc, __frameLabel);
		if( frameNum >= maxFrame ){
			frameNum = maxFrame;
			__mc.gotoAndStop(frameNum-1);
			if( __mc.onMouseMove != null | 
				__mc.onMouseUp != null | 
				__mc.onPress != null){
				finish(event);
			}
		}

		else if(frameNum < __mc.timeline.resolve(__frameLabel)){
			frameNum = __mc.timeline.resolve(__frameLabel);
		}
		else{ /*frameNum == maxNum*/
			__mc.gotoAndStop(frameNum);
		}

		if( __params.hideMouse ) {
			event.off();
		}
	}

	function finish(event){
		console.log("!Finishing!");
		console.log(event);
		__mc.onMouseMove = null;
		__mc.onMouseUp = null;
		__mc.onPress = null;
		// BPH5Toolbox.RemoveInteractive(__mc);
		// BPH5Toolbox.RemoveAllInteractive( );
		__mc.removeAllEventListeners();
		__endFunc();
	}

	function releaseMove(event){
		console.log("!RELEASING!");
		__mc.getStage().onMouseMove = null;
		if(!__params.noRelease){
			__mc.getStage().onMouseUp = null;
		}

		if( __goBackOnRelease ){
			if(__mc.currentFrame < ( BPH5Toolbox.getFrameLabelDuration(__mc, __frameLabel) + __initialFrame ) - 1 ){
				animateBack();				
			}
		}

		if( __params.hideMouse ){
			event.show();
		}
	}

	function enterFrame(){
		console.log('!EnterFrame!');
		if( __mc.currentFrameLabel != __frameLabel ){
			var currentTime = getTimer();
			if(__lastTime == 0){ __lastTime = currentTime;}
			var timeDiff = currentTime - __lastTime;
			__remainderTime += timeDiff;

			console.log("Remainder Time: ", __remainderTime);

			while(__remainderTime > __msPerFrame){
				__remainderTime -= __msPerFrame;
				if( __direction == "forward"){
					__mc.nextFrame();
				}else if(__direction == "backward"){
					__mc.prevFrame();
				}
			}
			__lastTime = currentTime;
		}else{
			__mc.stop();
			__lastTime = 0;
			__mc.getStage().removeEventListener
		}
	}

	function animateBack(){
		console.log('!Animate Back!');
		setDirection();
		var frameNum = __initialFrame + Math.floor( __mouseDiff / __dragRatio );
		var counter = frameNum;
		if( __mc.timeline.resolve(__frameLabel) != __mc.currentFrame){
			__tweenCounter.frame = __mc.currentFrame;
			var tween = createjs.Tween.get( __mc ).to({frame:__initialFrame}, 1000);
			tween.addEventListener('change', function(){
				console.log("!On change!");
				tweeny();
				__tweenCounter.frame--;
			});
		}
	}

	function tweeny(){
		if(__mc.currentFrame != __mc.timeline.resolve(__frameLabel)){
			__mc.gotoAndStop(Math.floor(__tweenCounter.frame));
		}else{
			__mc.stop();
		}
	}

	function setDirection(){
		if( __mc.timeline.resolve(__frameLabel) > __mc.currentFrame ){
			__direction = "forward";
		}else if( __mc.timeline.resolve(__frameLabel) < __mc.currentFrame ){
			__direction = "backward";
		}
	}
}

BPH5Toolbox.getFrameLabelDuration = function (animatedObj, forLabel){
		var time = animatedObj.timeline._labels;
		var timeline = Object.keys( time );
		var frames = new Array();
		if( timeline.length > 1){
			for(var i = 0; i < timeline.length;i++){
			     if( i == timeline.length - 1 ){
			         frames.push( animatedObj.timeline.duration - time[timeline[i]] );
			     }else{
			         frames.push( time[timeline[i+1]] - time[timeline[i]] );
			     }
			}

			var count = 0
				,frameDuration = 0;
			for( var key in time ){
				if( key == forLabel ){
					frameDuration = frames[count];
				}else{
					count++;
				}
			}
		}else{
			return animatedObj.timline.duration;
		}

		return frameDuration;
	}

//
// Draggable functions
//
BPH5Toolbox.RectanglesIntersect = function( rect1, rect2 ) {
   	var tempRect1 = { width:rect1.width, height:rect1.height};	
   	var tempRect2 = { width:rect2.width, height:rect2.height};
	tempRect2.width += rect2.x;
	tempRect1.width += rect1.x;
	if( rect2.x > tempRect1.width || rect1.x > tempRect2.width ) { return false; }
	tempRect2.height += rect2.y;
	tempRect1.height += rect1.y;
	if( rect2.y > tempRect1.height || rect1.y > tempRect2.height ) { return false; }
	return true;
};

//For debugging purposes, show the collision bounds
BPH5Toolbox.DrawHitRectangles = function(rect1,rect2, rectContainer){

	var g = new createjs.Graphics();
	g.beginStroke("#0FF");
	g.setStrokeStyle(5);
	var newRect = rectContainer.globalToLocal(rect1.x,rect1.y);
	g.drawRect(newRect.x, newRect.y, rect1.width, rect1.height);
	var border1 = new createjs.Shape(g);
	border1.snapToPixel = true;

	rectContainer.addChild(border1);

	g.beginStroke("#FF0");
	g.setStrokeStyle(5);
	newRect = rectContainer.globalToLocal(rect2.x,rect2.y);
	g.drawRect(newRect.x, newRect.y, rect2.width, rect2.height);
	var border2 = new createjs.Shape(g);
	border2.snapToPixel = true;

	rectContainer.addChild(border2);
	stage.update(); 

};

//
// RemoveInteractive(displayObject:createjs.DisplayObject)
//
// Removes event listeners from a createjs.DisplayObject
// No parameters.
// Returns nothing.
//
// Note: Currently the way MakeButton is set up, this function cannot reset onPress to oldOnPress
//
BPH5Toolbox.RemoveInteractive = function(displayObject){
	if(displayObject == undefined){
		console.log("WARNING: Attempted to remove undefined object");
		return;
	}
	displayObject.onPress = null;
	displayObject.onMouseMove = null;
	displayObject.onMouseUp = null;
	displayObject.onMouseOut = null;
	displayObject.onMouseOver = null;
	if(_registeredButtons.indexOf(displayObject)>=0){
		_registeredButtons.splice(_registeredButtons.indexOf(displayObject),1);
	}
	if(_registeredDraggables.indexOf(displayObject)>=0){
		_registeredDraggables.splice(_registeredDraggables.indexOf(displayObject),1);
	}
	if(_registeredMultipleChoice.indexOf(displayObject)>=0){
		//need to remove its buttons too
		var params = _registeredMultipleChoice[_registeredMultipleChoice.indexOf(displayObject)];
		if(params.isDropdown){
			for(var i= 0;i<params.options.length;i++){
				BPH5Toolbox.RemoveInteractive(params.displayObject[params.optionName+(i+1)]);
			}
			BPH5Toolbox.RemoveInteractive(params.displayObject[params.slotName]);
		}
		_registeredMultipleChoice.splice(_registeredMultipleChoice.indexOf(displayObject),1);
	}
};

//Shortcuts for removing multiple interactive objects at once

BPH5Toolbox.RemoveAllDraggables = function(){	
	while(_registeredDraggables.length){
		BPH5Toolbox.RemoveInteractive(_registeredDraggables[0]);
	}
};

BPH5Toolbox.RemoveAllButtons = function(){
	while(_registeredButtons.length){
		BPH5Toolbox.RemoveInteractive(_registeredButtons[0]);
	}
};

BPH5Toolbox.RemoveAllMultipleChoice = function(){
	while(_registeredMultipleChoice.length){
		if(_registeredMultipleChoice[0].isDropdown){
			var params = _registeredMultipleChoice[0];
			for(var i= 0;i<params.options.length;i++){
				BPH5Toolbox.RemoveInteractive(params.displayObject[params.optionName+(i+1)]);
			}
			BPH5Toolbox.RemoveInteractive(params.displayObject[params.slotName]);
		}
		BPH5Toolbox.RemoveInteractive(_registeredMultipleChoice[0]);
	}
};

BPH5Toolbox.RemoveAllInteractive = function(){
	BPH5Toolbox.RemoveAllDraggables();
	BPH5Toolbox.RemoveAllButtons();
	BPH5Toolbox.RemoveAllMultipleChoice();
};