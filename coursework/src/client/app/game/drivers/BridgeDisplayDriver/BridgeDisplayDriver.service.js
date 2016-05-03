'use strict';

angular.module('bridgeApp')
  .service('BridgeDisplayDriver', function ($timeout, BaseGameDriver, Platforms, Bridge) {
    class BridgeDisplayDriver extends BaseGameDriver {
      constructor(engine) {
        super(engine);
        //not needed, canvas is replaced
        window.removeEventListener('resize', engine.resizeCanvas, false);
      }

      setBuilder(builder, then) {
        this.builder = angular.copy(builder);
        //bounding rect
        this.min = [100, 100];
        this.max = [-100, -100];
        for (let node of builder.nodes) {
          if (node.x < this.min[0]) this.min[0] = node.x;
          if (node.y < this.min[1]) this.min[1] = node.y;
          if (node.x > this.max[0]) this.max[0] = node.x;
          if (node.y > this.max[1]) this.max[1] = node.y;
        }
        this.drawn = then;
      }


      vars() {
        super.vars();

        this.diff = [0, 0];
        this.targetFrameRate = 1;
        //clamp bounding rect
        this.stageWidth = this.max[0] - this.min[0] + 2;
        if (this.stageWidth < 10) {
          this.diff[0] = 10 - this.stageWidth;
          this.stageWidth = 10;
        }
        this.stageHeight = this.max[1] - this.min[1] + 2;
        if (this.stageHeight < 5) {
          this.diff[1] = 5 - this.stageHeight;
          this.stageHeight = 5;
        }

        //white
        this.clearColor = [1, 1, 1, 1];
      }

      resetWorld() {
        super.resetWorld();

        let _this = this;
        //mock platform that centers the bridge
        this.platforms = {
          getStart() {
            return [1 - _this.min[0] + (_this.diff[0] / 2),
              _this.stageHeight - _this.max[1] - 1 - (_this.diff[1] / 2)];
          }
        };

        this.bridge = new Bridge(this.builder, this);
      }

      doDraw() {
        for (let body of this.world.rigidBodies) {
          for (let shape of body.shapes) {
            if (shape.userData && shape.userData.sprite) {
              //draw all (edge) sprites
              let sprite = shape.userData.sprite;
              if (sprite.update) sprite.update();

              this.draw.drawSprite(shape.userData.sprite);
            }
          }
        }
      }


      runMainLoop() {
        //once
        if (!this.engine.canvas.parentNode) return;
        this.resetWorld();
        this.mainLoop();
        //resolve promise
        this.drawn();
      }


      onunload() {
        super.onunload();
        this.engine.destroy();
      }
    }

    return (builder, then, canvas) => {
      //prepopulate builder
      function BDDConstructor(engine) {
        var bdd = new BridgeDisplayDriver(engine);
        bdd.setBuilder(builder, then);
        return bdd;
      }

      BDDConstructor.canvas = canvas;

      return BDDConstructor;
    };
  });
