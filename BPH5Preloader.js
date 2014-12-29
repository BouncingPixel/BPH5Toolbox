/*
 * BPH5Preloader.js
 *
 * (c) 2012 Bouncing Pixel
 *
 */

"use strict";

//
// 
//
var BPH5Preloader = {};

//
//
//
BPH5Preloader.create = function( options ) {
	var preloadContainer, preloadedCallback, imagesObject;
	var labelForLoop, labelForLoopEnd, labelForOut, labelForOutEnd;
	var allComplete = false;

	preloadContainer = options.preloadContainer;
	preloadedCallback = options.preloadCallback;
	imagesObject = options.imagesObject;

	labelForLoop = options.labelForLoop 				|| "loop";
	labelForLoopEnd = options.labelForLoopEnd 	|| "loop:end";
	labelForOut = options.labelForOut 					|| "out";
	labelForOutEnd = options.labelForOutEnd			|| "out:end";

	preloadContainer.onChange = function() {
		var endOfLoop = this.instance.timeline.resolve( labelForLoopEnd );
		var endOfOut = this.instance.timeline.resolve( labelForOutEnd );

		if( this.instance.timeline.position === endOfLoop ) {
			if( !allComplete ) {
				this.instance.gotoAndPlay( labelForLoop );
			}
			else {
				this.instance.gotoAndPlay( labelForOut );
			}
		}
		if( this.instance.timeline.position === endOfOut ) {
			preloadedCallback();
		}
	};
	preloadContainer.instance.timeline.onChange = function() { preloadContainer.onChange() };

	var preload = new createjs.PreloadJS();

	preload.onError = function( event ) {
		console.log( 'handleFileError' );
	};

	preload.onProgress = function( event ) {
		// console.log( 'handleProgress percent: ' + event.loaded*100 );
	}

	preload.onFileLoad = function( event ) {
		var img;
		if( event.type === 'image' ) {
			img = new Image();
			img.src = event.src;
			img.onload = function( event ) {
				//totalLoaded++;
				console.log( 'handleFileLoadComplete w: ' + this.width + ' h: ' + this.height );
			};

			console.log( "Image: " + event.id + imagesObject );

			imagesObject[ event.id ] = event.result;
		}
		else {
			//totalLoaded++;
		}
		console.log( 'handleFileLoad src: ' + event.src );
	};

	preload.onComplete = function( event ) {
		console.log( 'handleComplete' );
		allComplete = true;
		stage.update();
	};

	preload.installPlugin( createjs.SoundJS );

	return preload;
};

//
//
//
BPH5Preloader.cleanup = function( options ) {
	var preloadContainer = options.preloadContainer;
	var preload = options.preload;

	preloadContainer.onChange = null;
	preloadContainer.instance.timeline.onChange = null;
	preload.onError= null;
	preload.onProgress = null;
	preload.onFileLoad = null;
	preload.onComplete = null;
};
