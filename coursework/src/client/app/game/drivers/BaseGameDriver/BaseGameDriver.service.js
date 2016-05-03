'use strict';
/* jshint bitwise: false */

angular.module('bridgeApp')
  .service('BaseGameDriver', function (tzUtils) {
    class BaseGameDriver {

      constructor(engine) {
        this.engine = engine;
      }

      setup() {
        this.vars();

        this.setupTurbulenz();
        this.setupDraw();

        this.setupPostTurbulenz();
      }

      /**
       * override should setup width, height
       **/
      vars() {
        //variables set up here to allow overriding
        this.isDrawing = true;
        this.isDebugDrawing = false;

        this.targetFrameRate = 60;

        this.stageWidth = 0;
        this.stageHeight = 0;

        this.gravity = [0, 30];

        this.clearColor = [0.3, 0.3, 0.3, 1];
      }

      setupTurbulenz() {
        this.turbulenzServices = tzUtils.TurbulenzServices;

        this.graphicsDevice = this.engine.createGraphicsDevice({});
        this.mathDevice = this.engine.createMathDevice({});

        this.physics = tzUtils.Physics2DDevice.create();
        this.sprite = tzUtils.Draw2DSprite;
      }

      setupPostTurbulenz() {
      }

      setupDraw() {
        this.draw = tzUtils.Draw2D.create({
          graphicsDevice: this.graphicsDevice
        });
        this.draw.configure({
          viewportRectangle: [0, 0, this.stageWidth, this.stageHeight],
          scaleMode: 'scale'
        });

        this.debugDraw = tzUtils.Physics2DDebugDraw.create({
          graphicsDevice: this.graphicsDevice
        });
        this.debugDraw.setPhysics2DViewport([0, 0, this.stageWidth, this.stageHeight]);
        this.debugDraw.showContacts = false;
        this.debugDraw.showConstraints = false;
        this.debugDraw.showContactImpulses = false;
        this.debugDraw.showBodyDetail = false;
        this.debugDraw.showShapeDetail = false;

        this.createWorld();
      }

      createWorld() {
        this.world = this.physics.createWorld({gravity: this.gravity});
      }

      resetWorld() {
        this.world.clear();

        this.refBody = this.physics.createRigidBody({type: 'static'});
        this.world.addRigidBody(this.refBody);
      }

      doDraw() {
        //draws grid
        var thickness = 0.05;
        var color = [0.2, 0.2, 0.2, 0.5];
        let i;
        for (i = 0; i <= this.stageWidth; i++) {
          this.draw.draw({
            destinationRectangle: [i - thickness, 0, i + thickness, this.stageHeight],
            color: color
          });
        }
        for (i = 0; i <= this.stageHeight; i++) {
          this.draw.draw({
            destinationRectangle: [0, i - thickness, this.stageWidth, i + thickness],
            color: color
          });
        }
      }

      doDrawOther() {
        //abstract
      }

      update() {
        //abstract
      }

      mainLoop() {
        if (!this.graphicsDevice.beginFrame()) {
          return;
        }

        this.update();

        this.graphicsDevice.clear(this.clearColor);

        this.draw.begin('alpha', 'deferred');
        if (this.isDrawing) {
          this.doDraw();
        }
        this.draw.end();

        if (this.isDebugDrawing) {
          this.debugDraw.setScreenViewport(this.draw.getScreenSpaceViewport());

          this.debugDraw.begin();
          this.debugDraw.drawWorld(this.world);
          this.debugDraw.end();
        }

        if (this.isDrawing) {
          this.doDrawOther();
        }

        this.graphicsDevice.endFrame();
      }

      runMainLoop() {
        this.resetWorld();
        if (this.currentInterval) this.engine.clearInterval(this.currentInterval);
        this.currentInterval = this.engine.setInterval(this.mainLoop.bind(this), 1000 / this.targetFrameRate);
        this.mainLoop();
      }

      onload() {
        this.setup();
        this.runMainLoop();
      }

      onunload() {
        if (this.currentInterval) {
          this.engine.clearInterval(this.currentInterval);
        }

        if (this.gameSession) {
          this.gameSession.destroy();
          this.gameSession = null;
        }
      }
    }

    return BaseGameDriver;
  });
