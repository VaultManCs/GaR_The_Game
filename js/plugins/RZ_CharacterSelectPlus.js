/*:
 * @target MZ
 * @plugindesc Creates a character selection screen at the start of a new game 
 * with added features not available in the free version.
 * @author Rebel Zodiac
 *
 * @param InfoPosition
 * @text Info Position
 * @desc Choose the style for messages: 
 * Default = Info on Bottom | Swapped = Info on Top
 * @type select
 * @option Default
 * @value default
 * @option Swapped
 * @value swapped
 * @default default
 *
 * @param BackgroundImage
 * @text Background Image
 * @desc Choose a background image from img/titles1 for the character selection screen.
 * @type file
 * @dir img/titles1/
 * @default 
 *
 * @param ChooseText
 * @text Choose Character Text
 * @desc Text displayed for the character selection prompt.
 * @default Please choose a character
 *
 * @param CharacterSpawns
 * @text Character Spawns
 * @desc Customize actor spawns and selection image.
 * @type struct<CharacterSpawn>[]
 * @default []
 *
  * @help This is an advanced version of my character selection plugin.
 * It adds features which are listed below.
 *
 * You can also swap the "Please Choose" and "Actor Info" message boxes.
 * This info displays the actor name and class!
 *
 * This advanced version allows you to choose the spawn map and coordinates 
 * for the selected actor. You can set an alternate image for your actors.
 * This will default to the face image if another is not set. Additionally you 
 * can use a mouse in this version which was not available before.
 * You can also customize the "please choose character" text.
 *
 * Recommended alternate image size 144 x 144
 *
 *
 * Thank you for choosing my plugin!! See more of my stuff at rebelzodiac.itch.io
 */

/*~struct~CharacterSpawn:
 * @param ActorId
 * @text Actor ID
 * @desc The ID of the actor this spawn point is for.
 * @type actor
 *
 * @param MapId
 * @text Map ID
 * @desc The ID of the map where the actor starts.
 * @type number
 * @default 1
 *
 * @param X
 * @text X Coordinate
 * @desc X coordinate on the map.
 * @type number
 * @default 10
 *
 * @param Y
 * @text Y Coordinate
 * @desc Y coordinate on the map.
 * @type number
 * @default 10
 *
 * @param ImageOverride
 * @text Image Override
 * @desc Optional: Override the actor's face with an image from img/pictures/.
 * @type file
 * @dir img/pictures/
 * @default 
 */

(() => {
    const parameters = PluginManager.parameters("RZ_CharacterSelectPlus");
    const chooseText = parameters["ChooseText"] || "Please choose a character";
    const characterSpawns = JSON.parse(parameters["CharacterSpawns"] || "[]").map(entry => {
        const data = JSON.parse(entry);
        return {
            actorId: Number(data.ActorId),
            mapId: Number(data.MapId),
            x: Number(data.X),
            y: Number(data.Y),
            image: data.ImageOverride || ""
        };
    });

    const actorSpawnPoints = {};
    for (const spawn of characterSpawns) {
        actorSpawnPoints[spawn.actorId] = {
            mapId: spawn.mapId,
            x: spawn.x,
            y: spawn.y,
            image: spawn.image
        };
    }

    class Scene_CharacterSelect extends Scene_Base {
        static infoPosition = parameters["InfoPosition"] || "default";
        static backgroundImage = parameters["BackgroundImage"] || "";

        initialize() {
            super.initialize();
            this._lastHoveredIndex = -1;
        }

        create() {
            super.create();
            this.createBackground();
            this.createCharacterList();
            this.createMessage();
            this.createActorDescription();
            this.updateSelectorPosition();
            this.createMouseHandlers();
        }

        createBackground() {
            if (Scene_CharacterSelect.backgroundImage) {
                this._background = new Sprite(ImageManager.loadTitle1(Scene_CharacterSelect.backgroundImage));
            } else {
                this._background = new Sprite(new Bitmap(Graphics.width, Graphics.height));
                this._background.bitmap.fillAll("black");
            }
            this.addChild(this._background);
        }

        createCharacterList() {
            this._characters = $dataActors.filter(actor => actor && actor.id > 0);
            this._characterSprites = [];

            const faceWidth = 144;
            const faceHeight = 144;
            const maxPerRow = 6;
            const availableWidth = Graphics.width - 50;
            const availableHeight = Graphics.height - 200;

            const totalActors = this._characters.length;
            const totalRows = Math.ceil(totalActors / maxPerRow);

            const scaleFactorX = Math.min(1, availableWidth / (maxPerRow * faceWidth));
            const scaleFactorY = Math.min(1, availableHeight / (totalRows * faceHeight));
            const scaleFactor = Math.min(1, Math.max(scaleFactorX, scaleFactorY) * 0.8);

            const adjustedFaceWidth = faceWidth * scaleFactor;
            const adjustedFaceHeight = faceHeight * scaleFactor;
            const spacingX = adjustedFaceWidth + 10;
            const spacingY = adjustedFaceHeight + 20;

            const gridWidth = Math.min(totalActors, maxPerRow) * spacingX;
            const gridHeight = totalRows * spacingY;

            const startX = (Graphics.width - gridWidth) / 2;
            const startY = (Graphics.height - gridHeight) / 2;

            for (let i = 0; i < totalActors; i++) {
                const actor = this._characters[i];
                const override = actorSpawnPoints[actor.id]?.image;

                let sprite;
                if (override) {
                    const bmp = ImageManager.loadPicture(override);
                    sprite = new Sprite(bmp);
                } else {
                    const bmp = ImageManager.loadFace(actor.faceName);
                    sprite = new Sprite(bmp);
                    const faceIndex = actor.faceIndex;
                    const row = Math.floor(faceIndex / 4);
                    const col = faceIndex % 4;
                    sprite.setFrame(col * 144 + 1, row * 144, 144, 144);
                }

                sprite.x = startX + (i % maxPerRow) * spacingX;
                sprite.y = startY + Math.floor(i / maxPerRow) * spacingY;
                sprite.scale.set(scaleFactor, scaleFactor);

                this.addChild(sprite);
                this._characterSprites.push(sprite);
            }

            this._selectedIndex = this._characters.findIndex(actor => actor.id === 1);
            if (this._selectedIndex === -1) this._selectedIndex = 0;
            this.updateSelectorPosition();
        }

        createMouseHandlers() {
            this._background.interactive = true;
            this._background.on("mousemove", this.handleMouseMove.bind(this));
            this._background.on("mousedown", this.handleMouseClick.bind(this));
            this._background.on("rightdown", this.handleRightClick.bind(this));
        }

        handleMouseMove(event) {
            const point = event.data.global;
            const index = this._characterSprites.findIndex(sprite => sprite.getBounds().contains(point.x, point.y));
            if (index >= 0 && this._selectedIndex !== index) {
                this._selectedIndex = index;
                this.updateSelectorPosition();
                this.updateActorDescription();
                if (this._lastHoveredIndex !== index) {
                    SoundManager.playCursor();
                    this._lastHoveredIndex = index;
                }
            }
        }

        handleMouseClick(event) {
            const point = event.data.global;
            const index = this._characterSprites.findIndex(sprite => sprite.getBounds().contains(point.x, point.y));
            if (index >= 0) {
                this._selectedIndex = index;
                this.updateSelectorPosition();
                this.updateActorDescription();
                this.confirmSelection();
            }
        }

        handleRightClick() {
            SoundManager.playCancel();
            SceneManager.goto(Scene_Title);
        }

        createMessage() {
            const messageHeight = 60;
            const messageY = Scene_CharacterSelect.infoPosition === "default" ? 0 : Graphics.height - messageHeight;
            this._message = new Window_Base(new Rectangle(0, messageY, Graphics.width, messageHeight));
            this._message.drawText(chooseText, 0, 0, Graphics.width, "center");
            this.addChild(this._message);
        }

        createActorDescription() {
            const messageHeight = 60;
            const messageY = Scene_CharacterSelect.infoPosition === "default" ? Graphics.height - messageHeight : 0;
            this._actorDescription = new Window_Base(new Rectangle(0, messageY, Graphics.width, messageHeight));
            this.updateActorDescription();
            this.addChild(this._actorDescription);
        }

        updateActorDescription() {
            const selectedActor = this._characters[this._selectedIndex];
            const actorClass = $dataClasses[selectedActor.classId]?.name || "Unknown";
            this._actorDescription.contents.clear();
            this._actorDescription.drawText(`This is ${selectedActor.name}, the ${actorClass}`, 0, 0, Graphics.width, "center");
        }

        updateSelectorPosition() {
            this._characterSprites.forEach((sprite, index) => {
                sprite.filters = [new PIXI.filters.ColorMatrixFilter()];
                sprite.filters[0].brightness(index === this._selectedIndex ? 1.2 : 0.5, false);
            });
        }

        processCursorMove() {
            if (Input.isRepeated("right")) {
                this.selectNext();
                SoundManager.playCursor();
            } else if (Input.isRepeated("left")) {
                this.selectPrevious();
                SoundManager.playCursor();
            } else if (Input.isRepeated("down")) {
                this.selectBelow();
                SoundManager.playCursor();
            } else if (Input.isRepeated("up")) {
                this.selectAbove();
                SoundManager.playCursor();
            }
        }

        processOk() {
            if (Input.isTriggered("ok") || TouchInput.isTriggered()) {
                this.confirmSelection();
            }
        }

        processCancel() {
            if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
                SoundManager.playCancel();
                SceneManager.goto(Scene_Title);
            }
        }

        update() {
            super.update();
            this.processCursorMove();
            this.processOk();
            this.processCancel();
        }

        selectNext() {
            this._selectedIndex = (this._selectedIndex + 1) % this._characters.length;
            this.updateSelectorPosition();
            this.updateActorDescription();
        }

        selectPrevious() {
            this._selectedIndex = (this._selectedIndex - 1 + this._characters.length) % this._characters.length;
            this.updateSelectorPosition();
            this.updateActorDescription();
        }

        selectBelow() {
            const maxPerRow = 6;
            this._selectedIndex = (this._selectedIndex + maxPerRow) % this._characters.length;
            this.updateSelectorPosition();
            this.updateActorDescription();
        }

        selectAbove() {
            const maxPerRow = 6;
            this._selectedIndex = (this._selectedIndex - maxPerRow + this._characters.length) % this._characters.length;
            this.updateSelectorPosition();
            this.updateActorDescription();
        }

        confirmSelection() {
            AudioManager.stopBgm();
            const selectedActor = this._characters[this._selectedIndex];
            $gameParty.setupStartingMembers();
            $gameParty._actors = [selectedActor.id];

            const spawn = actorSpawnPoints[selectedActor.id] || { mapId: 1, x: 10, y: 10 };
            $gamePlayer.reserveTransfer(spawn.mapId, spawn.x, spawn.y, 2, 0);

            SceneManager.goto(Scene_Map);
        }
    }

    Scene_Title.prototype.commandNewGame = function() {
        DataManager.setupNewGame();
        SceneManager.goto(Scene_CharacterSelect);
    };
})();
