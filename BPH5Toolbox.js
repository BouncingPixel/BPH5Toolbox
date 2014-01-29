/*
 * BPH5Toolbox.js
 *
 * (c) 2012 Bouncing Pixel
 *
 */

"use strict";

//
// 
//
var BPH5Toolbox = {};

//
//
//
BPH5Toolbox.AddMovieClipActions = function( instance, actions ) {
	instance.timeline.onChange = function() {
		var i;
		var position = instance.timeline.position;
		var actionPosition;

		for( i = 0 ; i < actions.length ; i++ ) {
			actionPosition = instance.timeline.resolve( actions[i].label );

			if( actions[i].beforeLabel ) {
				actionPosition = actionPosition - 1;
			}
			if( actions[i].label === '__END__' ) {
				actionPosition = instance.timeline.duration-1;
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
//		noAutoHover:Boolean,
//		hoverFunc:Function,
//		normalFunc:Function,
//		upFunc:Function,//do something special when released
//		setHitArea:String //values: ellipse, rectangle, or undefined by default.
//	};
//
BPH5Toolbox.MakeButton = function( displayObject, parameters ) {
	//if in array, replace with the new one
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
				//displayObject.gotoAndStop( parameters.normalState );
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
		if( !parameters.noAutoHover && !parameters.pressed) { //&& !parameters.pressed
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
		if(!parameters.noAutoHover){
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

	This is based on as3 toolbox DropDownCreator, but assumes object exists on stage.
	Optional parameters object.
	Returns nothing.
 		options array element
 		---------------------
		{ text:"", correct:false }

	parameters = {
		randomize:Boolean,			//default undefined
		submitBtn:createjs.DisplayObject	//default undefined
		optionName:String 			//default "option" 	//these will see a lot of use
		optionTFName:String 		//default "tf"		//because things must be named
		optionBGName:String 		//default "bg"		//differently in javascript
		validateEach:Boolean		//default undefined //waits until you pick the right one to continue
		clickCallback:Function 		//default undefined //called whenever a button is clicked, regardless of validation
	};
*/

var _registeredMultipleChoice = [];

BPH5Toolbox.MakeMultipleChoice = function(displayObject, options, callback, parameters){
	//check params for consistency
	if(parameters == null){parameters = {};}
	if(!parameters.optionName){ parameters.optionName = "option";}
	if(!parameters.optionTFName){ parameters.optionTFName = "tf";}
	if(!parameters.optionBGName){ parameters.optionBGName = "bg";}
	parameters.displayObject = displayObject;
	parameters.callback = callback;

	console.log(options.toString());
	if(parameters.randomize){
		var newOptions = []; 
		var rand;
		while(options.length > 0){
			rand = Math.floor(Math.random()*options.length);
			newOptions.push(options[rand]);
			options.splice(rand,1);
			console.log("options",options.toString(),"New",newOptions.toString());
		}
		options = newOptions;
		console.log("Switched to new options",options,newOptions);
	}

	var i = 0;
	for(i = 0; i < options.length;i++){
		displayObject[parameters.optionName+(i+1)][parameters.optionTFName].text = options[i].text;
		displayObject[parameters.optionName+(i+1)].correct = options[i].correct;
		displayObject[parameters.optionName+(i+1)][parameters.optionBGName].gotoAndStop("N");
		BPH5Toolbox.MakeButton(displayObject[parameters.optionName+(i+1)],{callback:clickMultipleChoice,noAutoHover:true,passMC:true,
			hoverFunc:choiceBackFunction(displayObject[parameters.optionName+(i+1)],parameters.optionBGName,"H"),
			normalFunc:choiceBackFunction(displayObject[parameters.optionName+(i+1)],parameters.optionBGName,"N")
		});
	}
	_registeredMultipleChoice.push(parameters);
};

var clickMultipleChoice = function(displayObject){
	var params = findMultipleChoice(displayObject.parent); //need to get the button container
	console.log("Click multiple choice",params);
	if (!params){
		console.log("ERROR: Could not find multiple choice params");
		return;
	}

	if(params.submitBtn){ //assume this means wait to validate.
		//reactivate all other buttons
		var i = 0;
		//make sure this doesn't add it to the list twice. I think it does.
		while(params.displayObject[params.optionName+(i+1)]){
			BPH5Toolbox.MakeButton(params.displayObject[params.optionName+(i+1)],{callback:clickMultipleChoice,noAutoHover:true,passMC:true,
				hoverFunc:choiceBackFunction(params.displayObject[params.optionName+(i+1)],params.optionBGName,"H"),
				normalFunc:choiceBackFunction(params.displayObject[params.optionName+(i+1)],params.optionBGName,"N")
			});
			params.displayObject[params.optionName+(i+1)][params.optionBGName].gotoAndStop("N");
			i++;
		}
		params.submitBtn.visible = true;
		BPH5Toolbox.RemoveInteractive(displayObject);
		displayObject[params.optionBGName].gotoAndStop("H");
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
	console.log("validate, good sirs",paramObj,buttonClicked);
	//warning: must be R or W frame labels to work.
	var i = 1;
	var theButton;
	if(buttonClicked.correct){
		paramObj.status = "right";
		playSound("rightSound");
		buttonClicked[paramObj.optionBGName].gotoAndStop("R");
	}
	else{		
		paramObj.status = "wrong";
		playSound("wrongSound");
		buttonClicked[paramObj.optionBGName].gotoAndStop("W");
	}
	paramObj.answer = buttonClicked[paramObj.optionTFName].text;
	
	if(paramObj.validateEach){
		BPH5Toolbox.RemoveInteractive(buttonClicked);
		//Show the final callback if all the right ones are selected.
		i = 1;
		var done = true;
		while(theButton = paramObj.displayObject[paramObj.optionName + i]){
			if(theButton.correct && theButton[paramObj.optionBGName].currentFrame != theButton[paramObj.optionBGName].timeline.resolve("R")){
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
	else{		// || paramObj.status == "right")
		//also show the correct answer
		i = 1;
		theButton = paramObj.displayObject[paramObj.optionName + i];
		while(theButton){
			if(theButton.correct){
				theButton[paramObj.optionBGName].gotoAndStop("R");
			}
			BPH5Toolbox.RemoveInteractive(theButton);
			i++;
			theButton = paramObj.displayObject[paramObj.optionName + i];
		}
		paramObj.callback();
	}
	console.log("Button list",_registeredButtons);
};

BPH5Toolbox.GetStatus = function(displayObject){
	return(findMultipleChoice(displayObject).status);
}

BPH5Toolbox.GetAnswer = function(displayObject){
	return(findMultipleChoice(displayObject).answer);
}

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

//
//
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
		//console.log("Creating hit area: ",displayObject.hitArea);
	}
	//console.log("Troubleshoot scale:", displayObject.scaleX, parameters.scaleChange);
	displayObject.preDragScale = displayObject.scaleX;

	displayObject.onPress = function( event ) {
		displayObject.dragging = true;
		displayObject.preDragX = displayObject.x;
		displayObject.preDragY = displayObject.y;
		displayObject.origParent = displayObject.parent;
		//if we want to not add it back to parent
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
		console.log("obj starts at",displayObject.x,displayObject.y,displayObject.preDragX,displayObject.preDragY);
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
			//console.log( "MouseUp" );
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
						//always add back to parent
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
			displayObject.origParent.addChild(displayObject);
		};

		stage.update();
	};/*
	displayObject.onMouseOut = function( event ) {
		//displayObject.scaleX = displayObject.scaleY = displayObject.scaleX / 1.1;
	};
	displayObject.onMouseOver = function( event ) {
		//displayObject.scaleX = displayObject.scaleY = displayObject.scaleX * 1.1;
	};*/
};

BPH5Toolbox.SnapBack = function(displayObject){	
	console.log( "snapping back to " + displayObject.preDragX + " " + displayObject.preDragY );
	displayObject.x = displayObject.preDragX;
	displayObject.y = displayObject.preDragY;
};

//
//
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
		/*
		var parameters = findMultipleChoice(displayObject);
		var i = 1;
		while(displayObject[parameters.optionName+String(i)]){
			BPH5Toolbox.RemoveInteractive(displayObject[parameters.optionName+String(i)]);
			i++;
		}*/
		_registeredMultipleChoice.splice(_registeredMultipleChoice.indexOf(displayObject),1);
	}
};

BPH5Toolbox.RemoveAllDraggables = function(){	
	while(_registeredDraggables.length){
		BPH5Toolbox.RemoveInteractive(_registeredDraggables[0]);
	}
	//_registeredDraggables = [];
};

BPH5Toolbox.RemoveAllButtons = function(){
	while(_registeredButtons.length){
		BPH5Toolbox.RemoveInteractive(_registeredButtons[0]);
	}
	//_registeredButtons = [];
};

BPH5Toolbox.RemoveAllMultipleChoice = function(){
	while(_registeredMultipleChoice.length){
		BPH5Toolbox.RemoveInteractive(_registeredMultipleChoice[0]);
	}
	//_registeredButtons = [];
};

BPH5Toolbox.RemoveAllInteractive = function(){
	BPH5Toolbox.RemoveAllDraggables();
	BPH5Toolbox.RemoveAllButtons();
	BPH5Toolbox.RemoveAllMultipleChoice();
};