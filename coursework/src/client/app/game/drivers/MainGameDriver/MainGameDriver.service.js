'use strict';

angular.module('bridgeApp')
  .service('MainGameDriver', function ($rootScope, SimulationDriver, SimulationCONST, SimulationConfig,
                                       Bridge, BridgeNode, BridgeEdge, StorageManager) {
    const G = SimulationCONST.groups;

    class MainGameDriver extends SimulationDriver {
      constructor(engine) {
        super(engine);
        this.controlDown = false;
        this.startPoint = null;
        this.drawingEdge = null;
        let editorState = StorageManager.editorState.load();
        this.redoStack = editorState.redo;
        this.undoStack = editorState.undo;
        this.bridgeBuilder = editorState.builder;
        //listen to settings updates
        this.off = $rootScope.$on('world-settings-update', (ev, fresh, clear) => {
          if (clear) {
            this.clearBuilder();
            this.rewind();
          }
          this.loadSettings(fresh, true);
        });
      }

      loadAssets(mappingTable) {
        let urls = [
          'textures/undo.png',
          'textures/redo.png',
          'textures/play.png',
          'textures/edit.png',
          'textures/reset.png',
          'textures/trash.png',
        ];

        let promises = this.loadTextures(mappingTable, urls);

        promises.unshift(super.loadAssets(mappingTable));

        //after loading all textures and assets
        return Promise.all(promises)
          .then(() => {
            let _this = this;
            //create buttons
            this.buttons = [
              {
                get active() {
                  return _this.isDesigning;
                },
                texture: 'textures/play.png',
                onClick: _this.startSimulation.bind(_this),
                rect: [38, 18, 40, 20]
              },
              {
                get active() {
                  return _this.isDesigning && _this.undoStack.length > 0;
                },
                texture: 'textures/undo.png',
                onClick: _this.undo.bind(_this),
                rect: [34, 18, 36, 20]
              },
              {
                get active() {
                  return _this.isDesigning && _this.redoStack.length > 0;
                },
                texture: 'textures/redo.png',
                onClick: _this.redo.bind(_this),
                rect: [36, 18, 38, 20]
              },
              {
                get active() {
                  return _this.isDesigning;
                },
                texture: 'textures/trash.png',
                onClick: () => {
                  _this.commitBuilder();
                  _this.bridgeBuilder = {nodes: [], connections: []};
                  _this.resetWorld();
                },
                rect: [38, 16, 40, 18]
              },
              {
                get active() {
                  return !_this.isDesigning;
                },
                texture: 'textures/edit.png',
                onClick: _this.rewind.bind(_this),
                rect: [38, 18, 40, 20]
              },
              {
                get active() {
                  return !_this.isDesigning;
                },
                texture: 'textures/reset.png',
                onClick: _this.resetWorld.bind(_this),
                rect: [36, 18, 38, 20]
              },
            ].map(b => {
              //create sprites by applying the texture to rect
              b.sprite = this.sprite.create({
                texture: this.textures[b.texture],
                width: b.rect[2] - b.rect[0],
                height: b.rect[3] - b.rect[1],
                origin: [0, 0],
                x: b.rect[0],
                y: b.rect[1]
              });
              return b;
            });

            this.nodeSprite = this.sprite.create({
              color: [0, 0, 0, 1],
              width: 0.2,
              height: 0.2,
              origin: [0.1, 0.1],
            });
          });
      }


      setupInput() {
        super.setupInput();

        let onKeyDown = (keycode) => {
          if (keycode === this.inputDevice.keyCodes.LEFT_CONTROL ||
            keycode === this.inputDevice.keyCodes.RIGHT_CONTROL) {
            this.controlDown = true;
          } else if (keycode === this.inputDevice.keyCodes.LEFT_ALT) {
            this.altDown = true;
          } else if (this.isSimulating && keycode === this.inputDevice.keyCodes.R) {
            this.resetWorld();
          } else if (keycode === this.inputDevice.keyCodes.SPACE) {
            if (this.isDesigning) {
              this.startSimulation();
            } else {
              this.rewind();
            }
          } else if (this.isDesigning && this.controlDown && keycode === this.inputDevice.keyCodes.Z) {
            this.undo();
          } else if (this.isDesigning && this.controlDown && keycode === this.inputDevice.keyCodes.Y) {
            this.redo();
          }
        };
        this.inputDevice.addEventListener('keydown', onKeyDown.bind(this));

        let onKeyUp = (keycode) => {
          if (keycode === this.inputDevice.keyCodes.LEFT_CONTROL ||
            keycode === this.inputDevice.keyCodes.RIGHT_CONTROL) {
            this.controlDown = false;
          } else if (keycode === this.inputDevice.keyCodes.LEFT_ALT) {
            this.altDown = false;
          }
        };
        this.inputDevice.addEventListener('keyup', onKeyUp.bind(this));


        let onMouseDown = (code, x, y) => {
          //start dragging
          if (this.isDesigning && !this.altDown && code === this.inputDevice.mouseCodes.BUTTON_0) {
            //mark the current grid location as the starting point
            this.startPoint = this.draw.viewportMap(x, y).map(Math.round);
            this.mathDevice.v2Sub(this.startPoint, this.platforms.getStart(), this.startPoint);
          }
        };
        this.inputDevice.addEventListener('mousedown', onMouseDown.bind(this));

        let makeEndpoint = (x, y) => {
          //clamps the edge to max length
          let endPoint = this.draw.viewportMap(x, y).map(Math.round);
          this.mathDevice.v2Sub(endPoint, this.platforms.getStart(), endPoint);

          let edgeVector = this.mathDevice.v2Sub(endPoint, this.startPoint);

          if (this.mathDevice.v2Length(edgeVector) > this.bridgeMaterial.userData.maxLength) {
            this.mathDevice.v2Normalize(edgeVector, edgeVector);
            this.mathDevice.v2ScalarMul(edgeVector, this.bridgeMaterial.userData.maxLength, edgeVector);
            edgeVector = edgeVector.map(this.mathDevice.truncate);
            this.mathDevice.v2Add(edgeVector, this.startPoint, endPoint);
          }
          return endPoint;
        };

        let onMouseUp = (code, x, y) => {
          if (code === this.inputDevice.mouseCodes.BUTTON_0) {
            //alt is down this is a delete action
            if (this.isDesigning && this.altDown) {
              let touchingBodies = [];
              //query bodies at that point
              let count = this.world.bodyPointQuery(this.draw.viewportMap(x, y), touchingBodies);

              for (let i = 0; i < count; i++) {
                let touchingBody = touchingBodies[i];
                if (!touchingBody.userData) {
                  continue;
                }

                //if its an edge then delete it
                if (touchingBody.isDynamic() &&
                  typeof touchingBody.userData.group !== 'undefined' &&
                  touchingBody.userData.group === G.BRIDGE) {
                  this.commitBuilder();

                  let e = touchingBody.userData;
                  let a = this.nodeIndex(e.a);
                  let b = this.nodeIndex(e.b);
                  let edgeIndex = this.bridgeBuilder.connections.findIndex(c => c.a === a && c.b === b);
                  this.bridgeBuilder.connections.splice(edgeIndex, 1);

                  //remove lonely nodes
                  let empties = this.countNodeConnections(this.bridgeBuilder).filter(v => v.ns.length === 0);
                  empties.reverse().forEach(v => this.stripNode(this.bridgeBuilder, v.i));
                  this.resetWorld();
                }
              }

              this.startPoint = null;
              return;
            } //else
            let [px, py] = this.draw.viewportMap(x, y);
            let activeButtons = this.buttons.filter(b => b.active);
            //check buttons
            for (let button of activeButtons) {
              if (px >= button.rect[0] && px <= button.rect[2] && py >= button.rect[1] && py <= button.rect[3]) {
                button.onClick();
              }
            }

            //if this is a drag
            if (this.startPoint) {
              //clamp the edge
              let endPoint = makeEndpoint(x, y);

              if (this.drawingEdge) {
                this.drawingEdge.clear(this.world);
                this.drawingEdge = null;
              }

              //if it wasn't a drag then do nothing
              if (endPoint[0] === this.startPoint[0] && endPoint[1] === this.startPoint[1]) {
                this.startPoint = null;
                return;
              }

              //save the builder
              this.commitBuilder();

              let startNode = new BridgeNode(this.startPoint[0], this.startPoint[1]);
              let startIndex;
              if ((startIndex = this.nodeIndex(startNode)) < 0) {
                //this will be a new node
                startIndex = this.bridgeBuilder.nodes.length;
                this.bridgeBuilder.nodes.push(startNode);
              }

              let endNode = new BridgeNode(endPoint[0], endPoint[1]);
              let endIndex;
              if ((endIndex = this.nodeIndex(endNode)) < 0) {
                //new node
                endIndex = this.bridgeBuilder.nodes.length;
                this.bridgeBuilder.nodes.push(endNode);
              }

              //add connection
              this.bridgeBuilder.connections.push(
                {a: startIndex, b: endIndex, e: new BridgeEdge(this.bridgeMaterial, !this.controlDown)}
              );

              this.makeBridge();


              this.startPoint = null;
            }
          }
        };
        this.inputDevice.addEventListener('mouseup', onMouseUp.bind(this));

        let onMouseOver = (x, y) => {
          if (!this.platforms) return;
          let endPoint = this.draw.viewportMap(x, y).map(Math.round);
          this.mathDevice.v2Sub(endPoint, this.platforms.getStart(), endPoint);

          if (this.drawingEdge) {
            this.drawingEdge.clear(this.world);
          }

          if (this.startPoint && !(endPoint[0] === this.startPoint[0] && endPoint[1] === this.startPoint[1])) {
            //make a clamped drawn edge
            endPoint = makeEndpoint.bind(this)(x, y);

            this.drawingEdge = new BridgeEdge(this.bridgeMaterial, false, true);
            new BridgeNode(this.startPoint[0], this.startPoint[1]).setPlatform(this.platforms)
              .connect(new BridgeNode(endPoint[0], endPoint[1]).setPlatform(this.platforms), this.drawingEdge);
            this.drawingEdge.makeBody(null, this);

          }
        };
        this.inputDevice.addEventListener('mouseover', onMouseOver.bind(this));
      }


      doDraw() {
        super.doDraw();
        if (!this.isDebugDrawing && this.isDesigning && this.bridge) {
          //draw black dots for nodes
          for (let node of this.bridge.nodes) {
            [this.nodeSprite.x, this.nodeSprite.y] = node.absolute;
            this.draw.drawSprite(this.nodeSprite);
          }
        }
        //and buttons
        for (let button of this.buttons) {
          if (button.active) this.draw.drawSprite(button.sprite);
        }
      }


      doDrawOther() {
        //draw some text
        if (this.bridge) {
          this.drawText(0.2, 18, `${this.bridge.cost}$`, 2);
        }
        if (this.isSimulating && this.simulationSettled) {
          this.drawText(0.2, 16, `${this.maxLoad.toFixed(2)}%`, 2);
        }
      }

      nodeIndex(node) {
        return this.bridgeBuilder.nodes.findIndex(n => n.equals(node));
      }

      get carState() {
        return this.car ? this.car.state : 'nil';
      }

      get carEndTime() {
        return this.car ? this.car.endTime : -0.1;
      }

      undo() {
        let builder = this.undoStack.pop();
        if (angular.isUndefined(builder)) return;
        this.redoStack.push(this.bridgeBuilder);
        this.bridgeBuilder = builder;
        this.resetWorld();
      }

      redo() {
        let builder = this.redoStack.pop();
        if (angular.isUndefined(builder)) return;
        this.undoStack.push(this.bridgeBuilder);
        this.bridgeBuilder = builder;
        this.resetWorld();
      }

      commitBuilder() {
        //adds builders to the undostack and makes sure that its shorter than 50
        if (!this.bridgeBuilder) return;
        this.undoStack.push(angular.copy(this.bridgeBuilder));
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
      }

      setBuilder(builder) {
        //for loading stuff
        this.commitBuilder();
        this.bridgeBuilder = angular.copy(builder);
        this.resetWorld();
      }

      clearBuilder() {
        //empty nodes and conns
        if (this.bridgeBuilder && (this.bridgeBuilder.nodes.length > 0 || this.bridgeBuilder.connections.length > 0)) {
          this.commitBuilder();
          this.bridgeBuilder = {
            nodes: [],
            connections: []
          };
        }
      }

      stripNode(builder, index) {
        //clear a node and make sure indices are still valid
        let fresh = {
          nodes: angular.copy(builder.nodes),
          connections: []
        };

        fresh.nodes.splice(index, 1);

        for (let conn of angular.copy(builder.connections)) {
          if (conn.a === index || conn.b === index) continue;

          if (conn.a > index) conn.a--;
          if (conn.b > index) conn.b--;
          fresh.connections.push(conn);
        }

        builder.nodes = fresh.nodes;
        builder.connections = fresh.connections;
      }

      countNodeConnections(builder) {
        let connCnt = [];
        for (var i = 0; i < builder.nodes.length; i++) {
          connCnt[i] = {i, ns: []};
        }

        for (let conn of builder.connections) {
          connCnt[conn.a].ns.push(conn.b);
          connCnt[conn.b].ns.push(conn.a);
        }

        return connCnt;
      }

      onunload() {
        StorageManager.editorState.save({
          builder: this.bridgeBuilder,
          undo: this.undoStack,
          redo: this.redoStack
        });
        this.off();

        super.onunload();
      }
    }

    return MainGameDriver;
  });
