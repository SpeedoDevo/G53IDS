/*jshint strict:true*/
//"use strict";
/*global TurbulenzEngine*/
/*global Draw2D*/
/*global RequestHandler*/
/*global TurbulenzServices*/
/*global TextureManager*/
/*global Physics2DDevice*/
/*global Physics2DDebugDraw*/
/*global Draw2DSprite*/
/*global alert*/
/*global console*/
/*global FontManager*/
/*global inputDevice*/

/*{# Copyright (c) 2014 Florian Wirtz #}*/
/*
 * @title: Game 1
 */

/*{{ javascript("jslib/draw2d.js") }}*/
/*{{ javascript("jslib/utilities.js") }}*/
/*{{ javascript("jslib/requesthandler.js") }}*/
/*{{ javascript("jslib/services/turbulenzservices.js") }}*/
/*{{ javascript("jslib/services/turbulenzbridge.js") }}*/
/*{{ javascript("jslib/services/gamesession.js") }}*/
/*{{ javascript("jslib/physics2ddevice.js") }}*/
/*{{ javascript("jslib/physics2ddebugdraw.js") }}*/
/*{{ javascript("jslib/boxtree.js") }}*/
/*{{ javascript("jslib/services/mappingtable.js") }}*/
/*{{ javascript("jslib/texturemanager.js") }}*/
/*{{ javascript("jslib/fontmanager.js") }}*/
/*{{ javascript("jslib/observer.js") }}*/

TurbulenzEngine.onload = function onLoadFn() {
//==//===Variables=======================================
    //=====================================
    //========== VARIABLES START ==========
    //=====================================
    //=====================================
    var bgColor = [0.1, 0.1, 0.2, 1]; //The background color the canvas gets cleared out every frame before drawing
    var screen = 0; //Used to display several menu screens (e.g. Level/World Selection)
    var ui_open = false; //stores whether the UI_Menu is open or closed
    var ui_music_playing = true; //stores whether the Music is playing or muted
    var loadedItems = 0; //displays the amount of items loaded //TODO replace loading of assets by appropriate (Texture-)Manager(s) & remove var
    
    //Containers (global vars to reference from functions [listed here for readability purposes])
    var car; //car object
    var cool_floor; //level terrain //TODO create a "real" level-loading mechanism & remove var
    var carpos; //position of the car gets stored in here
    var carL; //left wheel of the car
    var carR; //right wheel of the car
    var startMusicSound; //background-music played
    var font; //font
    var gameSession; //gameSession object (created by Turbulenz)
    var menu_background, menu_overlay, car_body, car_wheel_left, car_wheel_right; //Menu & Car Elements (Draw2DSprites)
    var ui_button_pause, ui_button_score, ui_button_position_restart, ui_button_position_menu,
        ui_button_position_mute, ui_button_position_info, ui_background_line, ui_background_solid,
        ui_text_restart, ui_text_menu, ui_text_mute, ui_text_info; //UI Elements (Draw2DSprites)
    var thirdPoint, myShape; //used for createPolygonShapeFromPoints()
    var intervalID; //needed for calling the renderLoop
    var carpos_old, curTime, timeDelta, xOffsetDelta_m, xOffsetDelta_px, yOffsetDelta_m, yOffsetDelta_px, vertices; //used for calculations in RenderLoop related to side-scrolling etc.

    //Viewport dimensions
    var viewport = {
        scale : 30,
        x : 0,
        y : 0,
        px_width : 1920,
        px_height : 1080,
        m_width : 1920 / 30,
        m_height : 1080 / 30
    };
    var draw2DViewportRectangle = [viewport.x, viewport.y-250, viewport.px_width, viewport.px_height-250];
    var physicsDebugViewport = [(viewport.x / 30), (viewport.y-250) / 30, viewport.m_width, (viewport.px_height-250)/30];

    //UI_variables (used to store width, height & position of UI elements like buttons etc.)
    var i_button_pause = {
        x: 32,
        y: 32,
        width: 188,
        height: 188
    };
    var i_button_score = {
        x: 254,
        y: 32,
        width: 386,
        height: 188
    };
    var i_button_position_restart = {
        x: 0,
        y: 311,
        width: 608,
        height: 142
    };
    var i_button_position_menu = {
        x: -73,
        y: 505,
        width: 608,
        height: 142
    };
    var i_button_position_mute = {
        x: -146,
        y: 698,
        width: 608,
        height: 142
    };
    var i_button_position_info = {
        x: -219,
        y: 883,
        width: 608,
        height: 142
    };
    var i_text_restart = {
        x: 32,
        y: 350,
        width: 457,
        height: 70
    };
    var i_text_menu = {
        x: 32,
        y: 544,
        width: 457,
        height: 70
    };
    var i_text_mute = {
        x: 32,
        y: 737,
        width: 457,
        height: 70
    };
    var i_text_info = {
        x: 32,
        y: 922,
        width: 457,
        height: 70
    };
    var i_background_line = {
        x: 344,
        y: 0,
        width: 496,
        height: 1080
    };
    var i_background_solid = {
        x: 0,
        y: 0,
        width: 780,
        height: 1080
    };
    //=====================================
    //=====================================
    //==========  VARIABLES END  ==========
    //=====================================
    //=====================================



//==//===General Initialization==========================
    //   Turbulenz Initialization                       =
    //===================================================
    //create all necessary devices & adapters
    var graphicsDevice = TurbulenzEngine.createGraphicsDevice({});
    var mathDevice = TurbulenzEngine.createMathDevice({});
    var soundDevice = TurbulenzEngine.createSoundDevice({linearDistance : false});
    var requestHandler = RequestHandler.create({});
    var textureManager = TextureManager.create(graphicsDevice, requestHandler);
    //TODO var soundManager = soundManager.create(soundDevice, requestHandler);
    var fontManager = FontManager.create(graphicsDevice, requestHandler);
    var inputDevice = TurbulenzEngine.createInputDevice({});

    //handle the mappingTable (pathRemapping etc.)
    var mappingTableReceived = function mappingTableReceivedFn(mappingTable) {
        var url = mappingTable.urlMapping;
        var prefix = mappingTable.assetPrefix;
        textureManager.setPathRemapping(url, prefix);
        //TODO soundManager.setPathRemapping(url, prefix);
        fontManager.setPathRemapping(url, prefix);
        loadAssets(mappingTable);
    };

    //create a gameSession
    function sessionCreated(gameSession) {
        TurbulenzServices.createMappingTable(requestHandler, gameSession, mappingTableReceived);
    }
    gameSession = TurbulenzServices.createGameSession(requestHandler, sessionCreated);



//==//===Phys2D==========================================
    //   Phys2D                                         =
    //===================================================
    //create a phys2D device
    var phys2D = Physics2DDevice.create();
    
    //setup DebugDraw //TODO remove for final build - just for debugging purposes
    var p_debug = Physics2DDebugDraw.create({
        graphicsDevice : graphicsDevice
    });
    p_debug.setPhysics2DViewport([viewport.x, viewport.y, viewport.m_width, viewport.m_height]);

    //create a world
    var world = phys2D.createWorld({
        gravity : [0, 35]
    });



//==//===Draw2D==========================================
    //   Draw2D                                         =
    //===================================================
    //setup
    var draw2D = Draw2D.create({
        graphicsDevice : graphicsDevice
    });

    //configure
    draw2D.configure({
        viewportRectangle : [viewport.x, viewport.y, viewport.px_width, viewport.px_height],
        scaleMode : "scale"
    });



//==//===Sound===========================================
    //   Sound                                          =
    //===================================================
    //always same position
    var startMusicSource = soundDevice.createSource({
        position : mathDevice.v3Build(0, 0, 0),
        relative : true,
        looping : true
    });



//==//===Input===========================================
    //   Input                                          =
    //===================================================
    var keyCodes = inputDevice.keyCodes;
    var mouseCodes = inputDevice.mouseCodes;

    var onKeyDown = function onKeyDownFn(keynum) {
        if (keynum === keyCodes.RIGHT || keynum === keyCodes.D) {
            //move right if car not flying
            if(!car.flying()) {
                car.movement = 1;
            }
            else {
                car.movement = 0;
            }
        } else if (keynum === keyCodes.LEFT || keynum === keyCodes.A) {
            car.movement = 2; //TODO remove for final build - just for debugging purposes
        } else if (keynum === keyCodes.UP) {
            car.rigidBody.applyImpulse([0, -500]); //TODO remove for final build - just for debugging purposes
        }
    };
    inputDevice.addEventListener("keydown", onKeyDown);

    var onKeyUp = function onKeyUpFn(keynum) {
        if (keynum === keyCodes.LEFT || keynum === keyCodes.A) { //TODO remove for final build - just for debugging purposes
            //stop LEFT movement //TODO remove for final build - just for debugging purposes
            car.movement = 0; //TODO remove for final build - just for debugging purposes
        } else if (keynum === keyCodes.RIGHT || keynum === keyCodes.D) {
            //Stop RIGHT movement
            car.movement = 0;
        } else if (keynum === keyCodes.R) {
            restart();
        }
    };
    inputDevice.addEventListener("keyup", onKeyUp);

    var onMouseDown = function onMouseDownFn(mouseCode, input_x, input_y) {
        var point = draw2D.viewportMap(input_x, input_y);
        point[0] = (point[0]-draw2DViewportRectangle[0]);
        point[1] = (point[1]-draw2DViewportRectangle[1]);

        if (mouseCode === mouseCodes.BUTTON_0 || mouseCodes.BUTTON_1) {
            screen++;
            //=========================================================
            //===== UI checking whether buttons are pressed       =====
            //=====    (this should be realised by phys2D shapes  ===== 
            //=====        in the future because collisions are   ===== 
            //=====        easier there...)                       =====
            //=========================================================
            if(screen >= 4) {
                if(point[0] < (i_button_pause.width+i_button_pause.x) && point[1] < (i_button_pause.y + i_button_pause.height)) {
                    //Pause button clicked -> toggle the UI
                    ui_open = !ui_open;
                    console.log("UI OPEN: " + ui_open);
                }
                if(ui_open) {
                    if (point[1] > i_button_position_restart.y && point[1] < (i_button_position_restart.y + i_button_position_restart.height) && point[0] < (i_button_position_restart.width - i_button_position_restart.x)) {
                        //Restart clicked -> restart the level
                        ui_open = !ui_open;
                        restart();
                    }
                    else if (point[1] > i_button_position_menu.y && point[1] < (i_button_position_menu.y+i_button_position_menu.height) && point[0] < (i_button_position_menu.width + i_button_position_menu.x)) {
                        //Menu clicked -> go back to the start screen (screen = 1)
                        ui_open = false;
                        screen = 1;
                        world.clear();
                        draw2DViewportRectangle = [viewport.x, viewport.y, viewport.px_width, viewport.px_height];
                        physicsDebugViewport = [viewport.x / 30, viewport.y / 30, viewport.m_width, viewport.m_height];
                        intervalID = TurbulenzEngine.setInterval(menu, 1000 / 60);
                    }
                    else if (point[1] > i_button_position_mute.y && point[1] < (i_button_position_mute.y +i_button_position_mute.height) && point[0] < (i_button_position_mute.width + i_button_position_mute.x)) {
                        //Mute clicked -> toggle playing the music
                        if(ui_music_playing) {
                            startMusicSource.stop(startMusicSound);
                        }
                        else {
                            startMusicSource.play(startMusicSound);
                        }
                        ui_music_playing = !ui_music_playing;
                    }
                    else if (point[1] > i_button_position_info.y && point[1] < (i_button_position_info.y + i_button_position_info.height) && point[0] < (i_button_position_info.width + i_button_position_info.x)) {
                        //TODO Info clicked -> Do something super awesome (Dunno what yet, more like a placeholder...)
                        console.log("Game1 by (C)FWirtz");
                    }
                }
            }
        }
    };
    inputDevice.addEventListener("mousedown", onMouseDown);



//==//===Loading=========================================
    //   load Assets                                   =
    //==================================================
    var loadAssets = function loadAssetsFn(mappingTable) {
        //textures
        textureManager.load("assets/Game1_Sprite1_v020.png");
        textureManager.load("assets/Game1_Sprite2_v020.png");

        //font
        fontManager.load("font/ArialBlack.fnt", function (fontObject) {
            font = fontObject;
        });

        //sound //TODO use soundManager to do that....... <.<
        var soundURL = mappingTable.getURL("assets/welcome.mp3");
        soundDevice.createSound({
            src : soundURL,
            onload : function(sound) {
                if (sound) {
                    startMusicSound = sound;
                } else {
                    console.log("Failed to load sound...");
                }
                loadedItems++;
            }
        });
    };



//==//===GameLoop========================================
    //   Main Loop                                      =
    //===================================================
    var realTime = 0;
    var prevTime = TurbulenzEngine.time;

    function mainLoop() {
        //Update carpos //TODO replace this by carpos_old = carpos @ the end of mainLoop, but find a way to initialize it once properly
        carpos_old = car.rigidBody.getPosition();

        //Time calculations
        curTime = TurbulenzEngine.time;
        timeDelta = (curTime - prevTime);
        if (timeDelta > (1 / 20)) {
            timeDelta = (1 / 20);
        }
        realTime += timeDelta;
        prevTime = curTime;

        //Update Sound&Input devices
        soundDevice.update();
        inputDevice.update();

        //Do some serious drawing (where the magic happens)
        if (graphicsDevice.beginFrame()) {
            graphicsDevice.clear(bgColor, 1.0); //Clear the whole frame out

            while (world.simulatedTime < realTime) {
                //when the UI is open step the world //TODO fix that, it crashed the whole Tab
                //if(!ui_open) {
                    world.step(1 / 60); //Step the physics simulation
                //}
            }

            //Update the positions of the car & wheels
            carpos = car.rigidBody.getPosition();
            carL = car.wheelL_rB.getPosition();
            carR = car.wheelR_rB.getPosition();

            //calculate offset of elements(side-scrolling effect)
            xOffsetDelta_m = carpos[0] - carpos_old[0];
            xOffsetDelta_px = xOffsetDelta_m * 30;
               yOffsetDelta_m = carpos[1] - carpos_old[1];
               yOffsetDelta_px = yOffsetDelta_m * 30;
            draw2DViewportRectangle[0] += xOffsetDelta_px;
               draw2DViewportRectangle[1] += yOffsetDelta_px;
            draw2DViewportRectangle[2] += xOffsetDelta_px;
               draw2DViewportRectangle[3] += yOffsetDelta_px;
            physicsDebugViewport[0] += xOffsetDelta_m; //TODO remove in final build
               physicsDebugViewport[1] += yOffsetDelta_m; //TODO remove in final build
            physicsDebugViewport[2] += xOffsetDelta_m; //TODO remove in final build
               physicsDebugViewport[3] += yOffsetDelta_m; //TODO remove in final build
            //apply offset
            draw2D.configure({
                viewportRectangle : draw2DViewportRectangle,
                scaleMode : "scale"
            });
            p_debug.setPhysics2DViewport(physicsDebugViewport); //TODO remove in final build


            //CALCULATIONS
            //Draw2D Sprite Placement
            car_body.x = carpos[0] * 30;
            car_body.y = carpos[1] * 30;
            car_body.rotation = car.rigidBody.getRotation();
            car_wheel_left.x = carL[0] * 30;
            car_wheel_left.y = carL[1] * 30;
            car_wheel_left.rotation = car.wheelL_rB.getRotation();
            car_wheel_right.x = carR[0] * 30;
            car_wheel_right.y = carR[1] * 30;
            car_wheel_right.rotation = car.wheelR_rB.getRotation();
            //UI positions
            ui_button_pause.x = draw2DViewportRectangle[0]+i_button_pause.x;
            ui_button_pause.y = draw2DViewportRectangle[1]+i_button_pause.y;
            ui_button_score.x = draw2DViewportRectangle[0]+i_button_score.x;
            ui_button_score.y = draw2DViewportRectangle[1]+i_button_score.y;
            ui_button_position_restart.x = draw2DViewportRectangle[0]+i_button_position_restart.x;
            ui_button_position_restart.y = draw2DViewportRectangle[1]+i_button_position_restart.y;
            ui_button_position_menu.x = draw2DViewportRectangle[0] + i_button_position_menu.x;
            ui_button_position_menu.y = draw2DViewportRectangle[1] + i_button_position_menu.y;
            ui_button_position_mute.x = draw2DViewportRectangle[0] + i_button_position_mute.x;
            ui_button_position_mute.y = draw2DViewportRectangle[1] + i_button_position_mute.y;
            ui_button_position_info.x = draw2DViewportRectangle[0] + i_button_position_info.x;
            ui_button_position_info.y = draw2DViewportRectangle[1] + i_button_position_info.y;
            ui_text_restart.x = draw2DViewportRectangle[0] + i_text_restart.x;
            ui_text_restart.y = draw2DViewportRectangle[1] + i_text_restart.y;
            ui_text_menu.x = draw2DViewportRectangle[0] + i_text_menu.x;
            ui_text_menu.y = draw2DViewportRectangle[1] + i_text_menu.y;
            ui_text_mute.x = draw2DViewportRectangle[0] + i_text_mute.x;
            ui_text_mute.y = draw2DViewportRectangle[1] + i_text_mute.y;
            ui_text_info.x = draw2DViewportRectangle[0] + i_text_info.x;
            ui_text_info.y = draw2DViewportRectangle[1] + i_text_info.y;
            ui_background_line.x = draw2DViewportRectangle[0] + i_background_line.x;
            ui_background_line.y = draw2DViewportRectangle[1] + i_background_line.y;
            ui_background_solid.x = draw2DViewportRectangle[0] + i_background_solid.x;
            ui_background_solid.y = draw2DViewportRectangle[1] + i_background_solid.y;

            
            //DebugDraw Drawing //TODO remove in final build
            p_debug.setScreenViewport(draw2D.getScreenSpaceViewport()); //TODO remove in final build
            p_debug.begin(); //TODO remove in final build
            p_debug.drawWorld(world); //TODO remove in final build
            p_debug.end(); //TODO remove in final build

            //Draw2D Sprite Drawing
            draw2D.begin("alpha");
            draw2D.drawSprite(car_body);
            draw2D.drawSprite(car_wheel_left);
            draw2D.drawSprite(car_wheel_right);
            
            if(ui_open) {
                //Draw awesome UI
                draw2D.drawSprite(ui_background_line);
                draw2D.drawSprite(ui_background_solid);
                draw2D.drawSprite(ui_button_score);
                draw2D.drawSprite(ui_button_position_restart);
                draw2D.drawSprite(ui_button_position_menu);
                draw2D.drawSprite(ui_button_position_mute);
                draw2D.drawSprite(ui_button_position_info);
                draw2D.drawSprite(ui_text_restart);
                draw2D.drawSprite(ui_text_menu);
                draw2D.drawSprite(ui_text_mute);
                draw2D.drawSprite(ui_text_info);
            }
            draw2D.drawSprite(ui_button_pause);

            //Text (just playing around)
            /*vertices = font.generateTextVertices(("Hello this is TextMate :o"), {
                rect: [10, 10, 500, 500],
                scale: 2.0,
                spacing: 0,
                alignment: 1
            }, 0);
            if(vertices) {
                font.drawTextVertices(vertices, 0);
            }*/
            draw2D.end();

            //Move car (physics object)
            if (car.movement === 1) {
                //right
                if (car.speed < 50) {
                    car.speed++;
                }
                car.rigidBody.applyImpulse([car.speed, 0]);
            }
            if (car.movement === 2) {
                //left
                if (car.speed < 50) {
                    car.speed++;
                }
                car.rigidBody.applyImpulse([-car.speed, 0]);
            }
            if (car.movement === 0) {
                if(car.speed > 0) {
                    car.speed --;
                }
            }
            
            //Restart the game when the car is very far (500m) to the right (end of terrain) //TODO remove in final build (!!!)
            if(carpos[0] > 500) {
                restart();
            }

            graphicsDevice.endFrame();
        }


//==//===END OF ONLOAD===================================
    }

//=======Assisting functions=============================
    //TurbulenzEngine.unload - called when the user closes the frame
    TurbulenzEngine.onunload = function onUnloadFn() {
        if (intervalID) {
            TurbulenzEngine.clearInterval(intervalID);
        }

        //TODO clean everything up nicely (assign null values to each and every variable... <.<)
        world.clear();
    };

    //TurbulenzEngine.onerror - called when an Error occurs
    TurbulenzEngine.onerror = function gameErrorFn(msg) {
        window.alert(msg);
    };

    //function menu() - renderLoop for the Menu
    /* IMPORTANT INFORMATION
     *     The menu is not yet finished; In fact I am completely NOT satisfied with the way it looks atm.
     *     However, as I don't quite enjoy creating rich graphics I will do nothing about the menu until
     *     some action is required...
     *     In the future [dunno when yet], the user shall be able to choose a world & level to play from here.
     */
    function menu() {
        if (screen < 1) {
            return;
        }

        //Play some background music
        startMusicSource.play(startMusicSound);

        //Update the needed devices
        soundDevice.update();
        inputDevice.update();

        //Do some drawing
        if (graphicsDevice.beginFrame()) {
            graphicsDevice.clear(bgColor, 1.0);

            if (screen === 1) {
                //Welcome screen
                draw2D.begin();
                draw2D.drawSprite(menu_background);
                draw2D.end();

                draw2D.begin("alpha");
                draw2D.drawSprite(menu_overlay);
                draw2D.end();
            } else if (screen === 2) {
                //World-Selection screen //TODO create
                draw2D.begin();
                draw2D.drawSprite(menu_background);
                draw2D.end();
            } else if (screen === 3) {
                //Level-Selection screen //TODO create
                draw2D.begin();
                draw2D.drawSprite(menu_background);
                draw2D.end();
            } else if (screen === 4) {
                //Load the level
                createDefaultLevel(); //TODO exchange by custom level loading
                createCar();
                TurbulenzEngine.clearInterval(intervalID);
                intervalID = TurbulenzEngine.setInterval(mainLoop, 1000 / 60);
            }

            graphicsDevice.endFrame();
        }
    }

    //function load() - Waits for all Resources to finish loading & then starts the game
    function load() {
        if (loadedItems === 1 && textureManager.getNumPendingTextures() === 0) {
            screen = 1;
            draw2DItems();
            TurbulenzEngine.clearInterval(intervalID);
            intervalID = TurbulenzEngine.setInterval(menu, 1000 / 60);
        }
    }


    //Physics
    //function createDefaultLevel() - used to create a default/demo Level. This will be replaced by a custom level loading mechanism later.
    function createDefaultLevel() {
        //TODO create custom Level loading
        cool_floor = {
            width : 2000 / viewport.scale,
            height : 1080 / viewport.scale,
            position : [0, 1080 / viewport.scale]
        };
        cool_floor.shape0 = phys2D.createPolygonShape({
            vertices : [[-100 / viewport.scale, 0], [-100 / viewport.scale, -1080 / viewport.scale], [0, -1080 / viewport.scale], [0, 0]]
        });
        cool_floor.shape1 = phys2D.createPolygonShape({
            vertices : [[0, 0], [0, -400 / viewport.scale], [200 / viewport.scale, -400 / viewport.scale], [200 / viewport.scale, 0]]
        });
        cool_floor.shape2 = phys2D.createPolygonShape({
            vertices : [[200 / viewport.scale, -300 / viewport.scale], [200 / viewport.scale, -400 / viewport.scale], [400 / viewport.scale, -300 / viewport.scale]]
        });
        cool_floor.shape3 = phys2D.createPolygonShape({
            vertices : [[400 / viewport.scale, -200 / viewport.scale], [400 / viewport.scale, -300 / viewport.scale], [800 / viewport.scale, -300 / viewport.scale], [800 / viewport.scale, -200 / viewport.scale]]
        });
        cool_floor.shape4 = phys2D.createPolygonShape({
            vertices : [[800 / viewport.scale, -300 / viewport.scale], [1200 / viewport.scale, -500 / viewport.scale], [1200 / viewport.scale, -500 / viewport.scale]]
        });
        cool_floor.shape5 = phys2D.createPolygonShape({
            vertices : [[1200 / viewport.scale, -50 / viewport.scale], [1200 / viewport.scale, -500 / viewport.scale], [2000 / viewport.scale, -50 / viewport.scale]]
        });
        cool_floor.shape6 = phys2D.createPolygonShape({
            vertices: [[2000/viewport.scale, 0], [2000/viewport.scale, -50/viewport.scale], [3500/viewport.scale, -50/viewport.scale], [3500/viewport.scale, 0]]
        });
        cool_floor.shape7 = phys2D.createPolygonShape({
            vertices: [[3500/viewport.scale, -50/viewport.scale], [5000/viewport.scale, -420/viewport.scale], [5000/viewport.scale, -50/viewport.scale]]
        });
        cool_floor.shape8 = phys2D.createPolygonShape({
            vertices: [[5000/viewport.scale, 0], [5000/viewport.scale, -50/viewport.scale], [20000/viewport.scale, -50/viewport.scale], [20000/viewport.scale, 0]]
        });
        cool_floor.shape9 = phys2D.createPolygonShape({
            vertices: [[20000/viewport.scale, 0], [20000/viewport.scale, -1080/viewport.scale], [20100/viewport.scale, -1080/viewport.scale], [20100/viewport.scale, 0]]
        });
        cool_floor.rB = phys2D.createRigidBody({
            type : "static",
            shapes : [cool_floor.shape0, cool_floor.shape1, cool_floor.shape2, cool_floor.shape3, cool_floor.shape4, cool_floor.shape5, cool_floor.shape6, cool_floor.shape7, cool_floor.shape8, cool_floor.shape9],
            position : cool_floor.position
        });
        world.addRigidBody(cool_floor.rB);
    }

    //function createCar() - creates a Car at a default position (same for every level)
    function createCar() {
        //car
        car = {
            position : [15, viewport.m_height / 3]
        };
        car.shape1 = phys2D.createPolygonShape({
            vertices : [[-217 / viewport.scale, 69.5 / viewport.scale], [-217 / viewport.scale, 19.5 / viewport.scale], [140 / viewport.scale, 19.5 / viewport.scale], [140 / viewport.scale, 69.5 / viewport.scale]],
            group : 4,
            mask : 9
        });
        car.shape2 = phys2D.createPolygonShape({
            vertices : [[-217 / viewport.scale, 19.5 / viewport.scale], [-217 / viewport.scale, -12.5 / viewport.scale], [219 / viewport.scale, -12.5 / viewport.scale], [219 / viewport.scale, 19.5 / viewport.scale]],
            group : 4,
            mask : 9
        });
        // car.shape3 = phys2D.createPolygonShape({}); removed cause unnecessary
        car.shape4 = phys2D.createPolygonShape({
            vertices : [[70 / viewport.scale, -12.5 / viewport.scale], [70 / viewport.scale, -31.5 / viewport.scale], [185 / viewport.scale, -22 / viewport.scale], [185 / viewport.scale, -12.5 / viewport.scale]]
        });
        car.shape5 = phys2D.createPolygonShape({
            vertices : [[-217 / viewport.scale, -12.5 / viewport.scale], [-217 / viewport.scale, -95.5 / viewport.scale], [40 / viewport.scale, -95.5 / viewport.scale], [40 / viewport.scale, -12.5 / viewport.scale]]
        });
        car.shape6 = phys2D.createPolygonShape({
            vertices : [[40 / viewport.scale, -12.5 / viewport.scale], [40 / viewport.scale, -95.5 / viewport.scale], [70 / viewport.scale, -31.5 / viewport.scale], [70 / viewport.scale, -12.5 / viewport.scale]]
        });
        car.shape7 = phys2D.createPolygonShape({
            vertices : [[-217 / viewport.scale, -95.5 / viewport.scale], [-217 / viewport.scale, -113.5 / viewport.scale], [8 / viewport.scale, -113.5 / viewport.scale], [8 / viewport.scale, -95.5 / viewport.scale]]
        });
        // car.shape8 = phys2D.createPolygonShape({}); removed cause unnecessary
        car.wheelL = phys2D.createCircleShape({
            radius : 50 / viewport.scale,
            origin : [0, 0],
            group : 4,
            mask : 9
        });
        car.wheelL_rB = phys2D.createRigidBody({
            type : "dynamic",
            shapes : [car.wheelL],
            position : [viewport.m_width / 3, viewport.m_height / 2]
        });
        car.wheelR = phys2D.createCircleShape({
            radius : 50 / viewport.scale,
            origin : [0, 0],
            group : 4,
            mask : 9
        });
        car.wheelR_rB = phys2D.createRigidBody({
            type : "dynamic",
            shapes : [car.wheelR],
            position : [viewport.m_width / 3 * 2, viewport.m_height / 2]
        });
        car.rigidBody = phys2D.createRigidBody({
            type : "dynamic",
            shapes : [car.shape1, car.shape2, car.shape4, car.shape5, car.shape6, car.shape7],
            position : car.position
        });
        //constraints
        car.aConstraint = phys2D.createAngleConstraint({
            bodyA : car.wheelR_rB,
            bodyB : car.wheelL_rB,
            ratio : 1
        });
        car.dConstraint1 = phys2D.createDistanceConstraint({
            bodyA : car.wheelL_rB,
            bodyB : car.rigidBody,
            anchorB : [-153 / viewport.scale, 0],
            lowerBound : 80 / viewport.scale,
            upperBound : 100 / viewport.scale
        });
        car.dConstraint2 = phys2D.createDistanceConstraint({
            bodyA : car.wheelL_rB,
            bodyB : car.rigidBody,
            anchorB : [-113 / viewport.scale, 0],
            lowerBound : 80 / viewport.scale,
            upperBound : 100 / viewport.scale
        });
        car.dConstraint3 = phys2D.createDistanceConstraint({
            bodyA : car.wheelR_rB,
            bodyB : car.rigidBody,
            anchorB : [143 / viewport.scale, 0],
            lowerBound : 80 / viewport.scale,
            upperBound : 100 / viewport.scale
        });
        car.dConstraint4 = phys2D.createDistanceConstraint({
            bodyA : car.wheelR_rB,
            bodyB : car.rigidBody,
            anchorB : [183 / viewport.scale, 0],
            lowerBound : 80 / viewport.scale,
            upperBound : 100 / viewport.scale
        });
        car.lConstraint1 = phys2D.createLineConstraint({
            bodyA : car.rigidBody,
            bodyB : car.wheelL_rB,
            axis : [0, 1],
            anchorA : [-133 / viewport.scale, -12.5 / viewport.scale],
            lowerBound : 1,
            upperBound : 4
        });
        car.lConstraint2 = phys2D.createLineConstraint({
            bodyA : car.rigidBody,
            bodyB : car.wheelR_rB,
            axis : [0, 1],
            anchorA : [163 / viewport.scale, -12.5 / viewport.scale],
            lowerBound : 1,
            upperBound : 4
        });
        car.movement = 0;
        /*
         * 0 -> not moving
         * 1 -> moving right
         * 2 -> moving left
         */
        car.speed = 10;
        car.airTime = 0; //needed?
        car.wheelL.vars = {
            flying: true,
            lastCollisionStart: 0,
            lastCollisionEnd: 0,
            startCollision: function startCollsionFn() {
                               car.wheelL.vars.flying = false;
                               car.wheelL.vars.lastCollisionStart = TurbulenzEngine.time;
                            },
            endCollision: function endCollisionFn() {
                              car.wheelL.vars.flying = true;
                              car.wheelL.vars.lastCollisionEnd = TurbulenzEngine.time;
                          },
            duringCollision: function duringCollisionFn() {
                                 car.wheelL.vars.flying = false;
                             }
        };
        car.wheelR.vars = {
            flying: true,
            lastCollisionStart: 0,
            lastCollisionEnd: 0,
            startCollision: function startCollsionFn() {
                               car.wheelR.vars.flying = false;
                               car.wheelR.vars.lastCollisionStart = TurbulenzEngine.time;
                            },
            endCollision: function endCollisionFn() {
                              car.wheelR.vars.flying = true;
                              car.wheelR.vars.lastCollisionEnd = TurbulenzEngine.time;
                          },
            duringCollision: function duringCollisionFn() {
                                 car.wheelR.vars.flying = false;
                             }
        };
        car.flying = function flyingFn() {
                         if(car.wheelL.vars.flying && car.wheelR.vars.flying) {
                            return true;
                         }
                         return false;
                     };
        car.prevPos = Math.floor((car.wheelL_rB.getPosition())[0]);

        car.shape7.addEventListener("begin", function () {
            TurbulenzEngine.clearInterval(intervalID);
            restart();
        });

        car.wheelL.addEventListener("begin", car.wheelL.vars.startCollision);
        car.wheelL.addEventListener("end", car.wheelL.vars.endCollision);
        car.wheelL.addEventListener("progress", car.wheelL.vars.duringCollision);
        car.wheelR.addEventListener("begin", car.wheelR.vars.startCollision);
        car.wheelR.addEventListener("end", car.wheelR.vars.endCollision);
        car.wheelR.addEventListener("progress", car.wheelR.vars.duringCollision);

        world.addRigidBody(car.rigidBody);
        world.addRigidBody(car.wheelL_rB);
        world.addRigidBody(car.wheelR_rB);
        world.addConstraint(car.aConstraint);
        world.addConstraint(car.dConstraint1);
        world.addConstraint(car.dConstraint2);
        world.addConstraint(car.dConstraint3);
        world.addConstraint(car.dConstraint4);
        world.addConstraint(car.lConstraint1);
        world.addConstraint(car.lConstraint2);
    }

    //Helper-functions
    //function restart() - restarts the demo Level (should restart the current Level in the future)
    function restart() {
        //Stop calling any Loop
        if (intervalID) {
            TurbulenzEngine.clearInterval(intervalID);
        }

        //TODO Unload the current level
        world.clear();

        //Build
        draw2DViewportRectangle = [viewport.x, viewport.y, viewport.px_width, viewport.px_height];
        physicsDebugViewport = [viewport.x / 30, viewport.y / 30, viewport.m_width, viewport.m_height];
        draw2DItems();
        createDefaultLevel();
        createCar();
        ui_open = false;

        //Start calling the gameLoop again
        TurbulenzEngine.clearInterval(intervalID);
        intervalID = TurbulenzEngine.setInterval(mainLoop, 1000 / 60);
    }

    //function draw2DItems() - initializes all Draw2D Sprites & creates them
    function draw2DItems() {
        //Menu Sprites
        menu_background = Draw2DSprite.create({
            texture : textureManager.get("assets/Game1_Sprite1_v020.png"),
            textureRectangle : [0, 0, 1920, 1080],
            origin : [0, 0],
            x : 0,
            y : 0,
            width : 1920,
            height : 1080
        });
        menu_overlay = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite1_v020.png"),
            textureRectangle: [0, 1085, 1138, 1826],
            x: viewport.px_width / 2,
            y: viewport.px_height / 2.75,
            width: 1138,
            height: 741,
            origin: [1138/2, 741/2]
        });
        
        //UserInterface Sprites
        ui_button_pause = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [0, 0, 188, 188],
            x: i_button_pause.x, //gets changed every tick
            y: i_button_pause.y,
            width: i_button_pause.width,
            height: i_button_pause.height,
            origin: [0, 0]
        });
        ui_button_score = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [193, 0, 579, 188],
            x: i_button_score.x, //gets changed every tick
            y: i_button_score.y,
            width: i_button_score.width,
            height: i_button_score.height,
            origin: [0, 0]
        });
        ui_button_position_restart = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [584, 0, 1192, 142],
            x: i_button_position_restart.x,
            y: i_button_position_restart.y,
            width: i_button_position_restart.width,
            height: i_button_position_restart.height,
            origin: [0, 0]
        });
        ui_button_position_menu = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [584, 0, 1192, 142],
            x: i_button_position_menu.x,
            y: i_button_position_menu.y,
            width: i_button_position_menu.width,
            height: i_button_position_menu.height,
            origin: [0, 0]
        });
        ui_button_position_mute = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [584, 0, 1192, 142],
            x: i_button_position_mute.x,
            y: i_button_position_mute.y,
            width: i_button_position_mute.width,
            height: i_button_position_mute.height,
            origin: [0, 0]
        });
        ui_button_position_info = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [584, 0, 1192, 142],
            x: i_button_position_info.x,
            y: i_button_position_info.y,
            width: i_button_position_info.width,
            height: i_button_position_info.height,
            origin: [0, 0]
        });
        ui_text_restart = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [0, 193, 457, 263],
            x: i_text_restart.x,
            y: i_text_restart.y,
            width: i_text_restart.width,
            height: i_text_restart.height,
            origin: [0, 0]
        });
        ui_text_menu = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [462, 193, 919, 263],
            x: i_text_menu.x,
            y: i_text_menu.y,
            width: i_text_menu.width,
            height: i_text_menu.height,
            origin: [0, 0]
        });
        ui_text_mute = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [924, 193, 1381, 263],
            x: i_text_mute.x,
            y: i_text_mute.y,
            width: i_text_mute.width,
            height: i_text_mute.height,
            origin: [0, 0]
        });
        ui_text_info = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [1386, 193, 1843, 263],
            x: i_text_info.x,
            y: i_text_info.y,
            width: i_text_info.width,
            height: i_text_info.height,
            origin: [0, 0]
        });
        ui_background_line = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [785, 268, 1281, 1348],
            x: i_background_line.x,
            y: i_background_line.y,
            width: i_background_line.width,
            height: i_background_line.height,
            origin: [0, 0]
        });
        ui_background_solid = Draw2DSprite.create({
            texture: textureManager.get("assets/Game1_Sprite2_v020.png"),
            textureRectangle: [0, 268, 780, 1348],
            x: i_background_solid.x,
            y: 540, //0 ?! :o i_background_solid.y
            width: i_background_solid.width,
            height: i_background_solid.height,
            origin: [0, 0]
        });

        //Car sprites
        car_body = Draw2DSprite.create({
            texture : textureManager.get("assets/Game1_Sprite1_v020.png"),
            textureRectangle : [1143, 1085, 1587, 1282],
            x : viewport.px_width / 2,
            y : viewport.px_height / 2,
            width : 444,
            height : 197,
            origin : [444 / 2, (197 / 2) + 30]
        });
        car_wheel_left = Draw2DSprite.create({
            texture : textureManager.get("assets/Game1_Sprite1_v020.png"),
            textureRectangle : [1592, 1085, 1692, 1185],
            x : viewport.px_width / 2,
            y : viewport.px_height / 2,
            width : 100,
            height : 100,
            origin : [50, 50]
        });
        car_wheel_right = Draw2DSprite.create({
            texture : textureManager.get("assets/Game1_Sprite1_v020.png"),
            textureRectangle : [1592, 1085, 1692, 1185],
            x : viewport.px_width / 2,
            y : viewport.px_height / 2,
            width : 100,
            height : 100,
            origin : [50, 50]
        });
    }

    //Functions to load & create custom levels //TODO use them... :D
    //NOT IN USE YET
    //function breakdownJSONToPoints() - breaks down the given JSON file (Level) into two corresponding points [used internally by loadLevel()]
    function breakdownJSONToPoints(Level) {
        var currentPoint, previousPoint = null;
        var myLevel = [];
        for(var i=0; i < Level.points.length; i++) {
            currentPoint = Level.points[i];
            if(previousPoint !== null) {
                //if a previous point is existing do the following
                myLevel[i] = createPolygonShapeFromPoints(previousPoint, currentPoint);
                myLevel[i] = phys2D.createRigidBody({
                    type: "static",
                    shapes: [myLevel[i]],
                    position: [0, 1080/30]
                });
                world.addRigidBody(myLevel[i]);
            }
            previousPoint = currentPoint;
        }
    }

    //NOT IN USE YET
    //function createPolygonShapeFromPoints() - used internally by breakdownJSONToPoints() to create convex shapes
    function createPolygonShapeFromPoints(point1, point2) {
        //check if point1 & point have same y-value (same height -> create RectangleShape)
        if(point1[1] === point2[1]) {
            var fixedHeight = 3; //Fixed Height. Remove var from here & adjust.
            myShape = phys2D.createPolygonShape({
                vertices : [[point1[0], point1[1]], [point2[0], point2[1]], [point2[0], (point2[1]+fixedHeight)], [point1[0], (point1[1]+fixedHeight)]]
            });
        }
        //else create a triangular shape [more complicated... O.o]
        else {
            //check if point1 is higher than point2 (higher y-value)
            if(point1[1] > point2[1]) {
                thirdPoint = [point2[0], point1[1]];
            }
            else {
               thirdPoint = [point1[0], point2[1]];
            }
            myShape = phys2D.createPolygonShape({
               vertices : [[point1[0], point1[1]], [point2[0], point2[1]], [thirdPoint[0], thirdPoint[1]]]
            });
        }

        return myShape;
    }

    //NOT IN USE YET
    //function loadLevel() - loads a specified level from JSON file
    function loadLevel(levelsource) {
        var selectedLevelSrc = "staticmax/123456.json"; //selected by User before / will be switched to levelsource
        var currentLevel = null; //changed by request
        var callContext = {
            src: selectedLevelSrc,
            onload: function onLoadFn(level, status, callContext) {
                if(status === 200 && level) {
                    currentLevel = level;
                    breakdownJSONToPoints(JSON.parse(level));
                }
                else {
                    console.error("Failed to load Level " + selectedLevelSrc);
                }
            }
        };
        requestHandler.request(callContext);
    }

    //When eeeeeeeverything is done start calling the load() loop
    intervalID = TurbulenzEngine.setInterval(load, 1000 / 60);
};