'use strict';

angular.module('bridgeApp')
  .service('SimulationDriver', function ($log, tzUtils, BaseGameDriver, SimulationCONST, SimulationConfig, Car, Bridge,
                                         Platforms, SettingsManager) {
    const G = SimulationCONST.groups;
    const S = SimulationCONST.states;
    let conf = SimulationConfig;

    class SimulationDriver extends BaseGameDriver {
      constructor(engine) {
        super(engine);
      }

      onload() {
        this.setup();
        //after loading is finished
        this.waitForLoad()
          //run the main loop
          .then(this.runMainLoop.bind(this))
          //or fail
          .catch(this.loadFailed.bind(this));
      }

      setup() {
        super.setup();
        this.setupInput();
      }

      vars() {
        super.vars();
        this.simulationSpeed = 1;

        this.stageWidth = 40;
        this.stageHeight = 20;

        this.load = 0;
        this.maxLoad = 0;
        this.finished = false;

        this.state = S.designing;

        this.realTime = 0;
        this.prevTime = this.engine.time;

        this.textures = {};

        this.loadSettings(SettingsManager.world.load(), false);
      }

      loadSettings(ws, reset) {
        this.settings = ws;
        this.gravity = [0, ws.gravitation];
        Car.weight = ws.weight;

        if (reset) {
          this.createWorld();
          this.resetWorld();
        }
      }


      setupTurbulenz() {
        super.setupTurbulenz();

        this.requestHandler = tzUtils.RequestHandler.create({});

        this.fontManager = tzUtils.FontManager.create
        (this.graphicsDevice, this.requestHandler);
        this.shaderManager = tzUtils.ShaderManager.create
        (this.graphicsDevice, this.requestHandler);

        this.loadPromise = new Promise((resolve, reject) => {
          this.gameSession = this.turbulenzServices.createGameSession
          (this.requestHandler, () => {
            this.turbulenzServices.createMappingTable(this.requestHandler, this.gameSession,
              (mappingTable) => {
                let urlMapping = mappingTable.urlMapping;
                let assetPrefix = mappingTable.assetPrefix;
                this.shaderManager.setPathRemapping(urlMapping, assetPrefix);
                this.fontManager.setPathRemapping(urlMapping, assetPrefix);
                this.loadAssets(mappingTable)
                  .then(resolve)
                  .catch(reject);
              });
          });
        });
      }

      setupPostTurbulenz() {
        this.bridgeMaterial = this.physics.createMaterial({
          density: conf.density,
          userData: {
            maxLength: 4.9,
            cost: 5,
          },
        });
      }

      createWorld() {
        super.createWorld();
        this.world.simulatedTime = this.realTime;
      }

      setupInput() {
        this.inputDevice = this.engine.createInputDevice({});
      }

      loadAssets(mappingTable) {
        let urls = [
          'textures/lorry.png',
          'textures/wheel.png',
          'textures/bg.png',
          'textures/bga.png',
          'textures/platforms.png',
        ];

        let promises = this.loadTextures(mappingTable, urls);

        promises.push(new Promise((resolve, reject) => {
          this.fontManager.load('fonts/hero.fnt', (fontObject) => {
            if (fontObject) {
              this.font = fontObject;
              resolve();
            } else {
              reject();
            }
          });
        }));

        promises.push(new Promise((resolve, reject) => {
          this.shaderManager.load('shaders/font.cgfx', (shaderObject) => {
            if (shaderObject) {
              this.fontShader = shaderObject;
              this.fontTechnique = shaderObject.getTechnique('font');
              //turbulenz boilerplate
              this.fontTechniqueParameters = this.graphicsDevice.createTechniqueParameters({
                clipSpace: this.mathDevice.v4BuildZero(),
                alphaRef: 0.01,
                color: this.mathDevice.v4BuildOne()
              });

              resolve();
            } else {
              reject();
            }
          });
        }));

        //after assets loaded make sprites
        return Promise.all(promises)
          .then(() => {
            this.bgSprite = this.sprite.create({
              texture: this.textures['textures/bg.png'],
              width: 40,
              height: 20,
              x: 0,
              y: 0,
              origin: [0, 0]
            });
            this.bgaSprite = this.sprite.create({
              texture: this.textures['textures/bga.png'],
              width: 40,
              height: 20,
              x: 0,
              y: 0,
              origin: [0, 0]
            });
          });
      }

      //maps a list of urls to a list of promises for textures
      loadTextures(mappingTable, urls) {
        return urls.map(u => {
          return new Promise((succ, fail) => {
            let _this = this;
            this.graphicsDevice.createTexture({
              src: mappingTable.getURL(u),
              mipmaps: true,
              onload: (texture) => {
                if (texture) {
                  _this.textures[u] = texture;
                  succ(texture);
                } else {
                  fail('texture couldn\'t be loaded');
                }
              }
            });
          });
        });
      }

      loadFailed(reason) {
        $log.error(`loading failed; reason: ${reason}`);
      }

      loadLoop() {
        $log.debug('loading...');
      }


      waitForLoad() {
        this.currentInterval = this.engine.setInterval(this.loadLoop.bind(this), 100);
        return this.loadPromise;
      }

      resetWorld() {
        super.resetWorld();

        //border
        {
          let thickness = 0.01;
          let border = this.physics.createRigidBody({
            type: 'static',
            userData: {group: G.WORLD},
            shapes: [
              this.physics.createPolygonShape({
                group: G.WORLD,
                vertices: this.physics.createRectangleVertices
                (0, 0, thickness, this.stageHeight)
              }),
              this.physics.createPolygonShape({
                group: G.WORLD,
                vertices: this.physics.createRectangleVertices
                (0, 0, this.stageWidth, thickness)
              }),
              this.physics.createPolygonShape({
                group: G.WORLD,
                vertices: this.physics.createRectangleVertices
                (0, this.stageHeight, this.stageWidth, this.stageHeight - thickness)
              }),
              this.physics.createPolygonShape({
                group: G.WORLD,
                vertices: this.physics.createRectangleVertices
                (this.stageWidth - thickness, 0, this.stageWidth, this.stageHeight)
              }),
            ]
          });
          this.world.addRigidBody(border);
        }

        this.platforms = new Platforms(this, {
          distance: this.settings.distance,
          elevation: this.settings.elevation,
          width: this.stageWidth,
          height: this.stageHeight,
          sprite: true
        });

        this.resetCar();

        this.makeBridge();

        //settle after first update
        this.simulationSettled = false;
      }

      makeBridge() {
        if (this.bridge) {
          this.bridge.clear(this.world);
        }
        if (this.bridgeBuilder) {
          this.bridge = new Bridge(this.bridgeBuilder, this);
        }
      }

      resetCar() {
        if (this.isSimulating) {
          if (this.car) {
            this.car.reset();
          } else {
            this.car = new Car(this);
          }
        } else {
          this.car = null;
        }
      }

      //returns to designing
      rewind() {
        this.state = S.designing;
        this.resetWorld();
      }


      updateWorld() {
        this.car.update();

        if (!this.simulationSettled) {
          this.simulationSettled = true;
          this.maxLoad = 0;
          this.load = 0;
        } else if (this.isSimulating) {
          this.load = this.bridge.getLoad();
          if (this.load > this.maxLoad) {
            this.maxLoad = this.load;
          }
        }
      }

      update() {
        //update inputs
        this.inputDevice.update();

        if (this.isSimulating) {
          //boilerplate
          let curTime = this.engine.time;
          let timeDelta = (curTime - this.prevTime);

          if (timeDelta > (1 / 20)) {
            timeDelta = (1 / 20);
          }
          //speedup = multiplying time
          this.realTime += (timeDelta * this.simulationSpeed);
          this.prevTime = curTime;


          while (this.world.simulatedTime < this.realTime) {
            this.world.step(1 / 60);
            this.updateWorld();
          }
        }
      }

      //draws text starting from (x,y) of some height
      drawText(x, y, text, height) {
        this.graphicsDevice.setTechnique(this.fontTechnique);
        this.mathDevice.v4Build(2 / this.graphicsDevice.width, -2 / this.graphicsDevice.height, -1, 1,
          this.fontTechniqueParameters.clipSpace);
        this.graphicsDevice.setTechniqueParameters(this.fontTechniqueParameters);

        //map coords to screen coords
        let topLeft = this.draw.viewportUnmap(x, y);
        let bottomRight = this.draw.viewportUnmap(x + 10, y + height);
        //calculate scaling from viewport size
        let normalHeight = this.font.calculateTextDimensions(text, 1, 0).height;
        let targetHeight = bottomRight[1] - topLeft[1];
        let scaling = targetHeight / normalHeight;
        this.font.drawTextRect(text, {
          rect: [topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]],
          scale: scaling,
          spacing: 0,
          alignment: 0
        });
      }

      doDraw() {
        if (!this.isDebugDrawing) {
          //draw the appropriate bg sprite
          if (this.isDesigning) {
            this.draw.drawSprite(this.bgaSprite);
            super.doDraw();
          } else {
            this.draw.drawSprite(this.bgSprite);
          }
          //and all body sprites
          for (let body of this.world.rigidBodies) {
            for (let shape of body.shapes) {
              if (shape.userData && shape.userData.sprite) {
                let sprite = shape.userData.sprite;
                if (sprite.update) sprite.update();

                this.draw.drawSprite(shape.userData.sprite);
              }
            }
          }
        } else {
          //debugdrawing does not require any drawing here
          super.doDraw();
        }
      }

      //kick things into action
      startSimulation() {
        if (this.isDesigning) {
          this.state = S.simulating;
          this.simulationSettled = false;
          this.resetWorld();
        } else {
          $log.error('wrong state');
        }
      }

      get isDesigning() {
        return this.state === S.designing;
      }

      get isSimulating() {
        return this.state === S.simulating;
      }
    }

    return SimulationDriver;
  });
