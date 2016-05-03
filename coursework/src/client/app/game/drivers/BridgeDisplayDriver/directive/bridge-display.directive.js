'use strict';

angular.module('bridgeApp')
  .directive('bridgeDisplay', function (BridgeDisplayDriver) {
    let canvas;
    let chainPromise;
    let done;

    let swapElem = (old, fresh) => {
      //replace old with fresh in the DOM
      let parent = old.parentNode;
      parent.removeChild(old);
      parent.appendChild(fresh);
    };

    return {
      restrict: 'A',
      require: 'tzCanvas',
      priority: 1,
      scope: {
        //the builder will be passed on the directive attribute
        builder: '=bridgeDisplay'
      },
      compile: () => ({
        pre: (scope, element, attrs, tz) => {
          element = element[0];

          if (!canvas) {
            //this will be the only canvas
            canvas = element;
            //make it free
            chainPromise = Promise.resolve(canvas);
          } else {
            //after the canvas becomes free
            chainPromise = chainPromise.then(() => {
              //reset promise
              chainPromise = new Promise(resolve => done = resolve);
              //already swapped abort
              if (!element.parentNode || !element.parentNode.parentNode) return false;
              let ctx = canvas.getContext('webgl');
              //if the context is lost then recreate it, by making a new cloned canvas
              if (ctx.isContextLost()) {
                console.log('context lost, new canvas');
                canvas = canvas.cloneNode(false);
              }
              //swap it in place
              swapElem(element, canvas);
              //allow tz to resize it
              canvas.width = 0;
              canvas.height = 0;
              return canvas;
            });
          }

          tz.setGameDriver(
            //create a prepopulated driver
            BridgeDisplayDriver(scope.builder, () => {
              //after the bridge is drawn snapshot it
              let data = canvas.toDataURL('image/png');
              let img = new Image();
              img.src = data;
              img.setAttribute('flex', '');
              //and replace it with the canvas
              swapElem(canvas, img);
              //make the canvas free
              if (done) done(canvas);
            }, chainPromise)
          );

        }
      })
    };
  });
