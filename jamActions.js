/*

 <javascriptresource>
 <name>Get Layer Style...</name>
 <about>Get Layer Style v1.6

 Layer styles utility script using the "JSON Action Manager" scripting library. © 2013 Michel MARIANI.
 </about>
 <menu>automate</menu>
 <category>JSON Action Manager Layer Styles Utility</category>
 </javascriptresource>

 */
//------------------------------------------------------------------------------
// File: Get Layer Style.js
// Version: 1.6
// Release Date: 2013-10-21
// Copyright: © 2011-2013 Michel MARIANI <http://www.tonton-pixel.com/blog/>
// Licence: GPL <http://www.gnu.org/licenses/gpl.html>
//------------------------------------------------------------------------------
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//------------------------------------------------------------------------------
// Version History:
//  1.6:
//  - Used new version of jamEngine scripting library module.
//  1.5:
//  - Used new version of scripting library modules.
//  1.4:
//  - Used new version of jamStyles scripting library module.
//  - Added specific button to export associated patterns.
//  1.3:
//  - Used new version of jamStyles scripting library module.
//  1.2:
//  - Used new version of jamStyles scripting library module.
//  - Allowed support for CS2 by performing direct file saving without fancy 
//    dialog.
//  1.1:
//  - Used new version of jamStyles scripting library module.
//  1.0:
//  - Initial release.
//------------------------------------------------------------------------------
// jamActions.jsxinc v3.6 (minified)
if (!this.jamActions) {
    this.jamActions = {};
    (function () {
        jamActions.isActionsFile = function (file) {
            return (file.type === '8BAC') || file.name.match(/\.atn$/i);
        };
        jamActions.isActionsPalette = function (file) {
            var fName = File.decode(file.name);
            return ((file.type === '8BPF') && fName.match(/^Actions Palette$/i)) || fName.match(/^Actions Palette.psp$/i);
        };

        function readBEInt(file, byteCount) {
            var bytes = file.read(byteCount);
            var intValue = 0;
            for (var index = 0; index < byteCount; index++) {
                intValue = (intValue << 8) + bytes.charCodeAt(index);
            }
            return intValue;
        }

        function readBytes(file, byteCount) {
            return file.read(byteCount);
        }

        function readByteString(file) {
            var stringLength = readBEInt(file, 4);
            return readBytes(file, stringLength);
        }

        function readUnicodeString(file) {
            var unicodeString = "";
            var unicodeLength = readBEInt(file, 4);
            for (var index = 0; index < unicodeLength; index++) {
                var unicodeChar = readBEInt(file, 2);
                if (unicodeChar !== 0) {
                    unicodeString += String.fromCharCode(unicodeChar);
                }
            }
            return unicodeString;
        }

        function readEventId(file) {
            var eventId = 0;
            var eventType = readBytes(file, 4);
            switch (eventType) {
                case 'TEXT':
                    eventId = app.stringIDToTypeID(readByteString(file));
                    break;
                case 'long':
                    eventId = app.charIDToTypeID(readBytes(file, 4));
                    break;
                default:
                    throw new Error("Unrecognized event type: '" + eventType + "'");
                    break;
            }
            return eventId;
        }

        function skipDouble(file) {
            file.seek(8, 1);
        }

        function skipDoubles(file, doubleCount) {
            file.seek(doubleCount * 8, 1);
        }

        function skipInt8(file) {
            file.seek(1, 1);
        }

        function skipInt16(file) {
            file.seek(2, 1);
        }

        function skipInt32(file) {
            file.seek(4, 1);
        }

        function skipInt64(file) {
            file.seek(8, 1);
        }

        function skipBytes(file, byteCount) {
            file.seek(byteCount, 1);
        }

        function skipByteString(file) {
            var stringLength = readBEInt(file, 4);
            skipBytes(file, stringLength);
        }

        function skipUnicodeString(file) {
            var unicodeLength = readBEInt(file, 4);
            skipBytes(file, unicodeLength * 2);
        }

        function skipId(file) {
            var idLength = readBEInt(file, 4);
            if (idLength) {
                skipBytes(file, idLength);
            } else {
                skipBytes(file, 4);
            }
        }

        function skipClass(file) {
            skipUnicodeString(file);
            skipId(file);
        }

        function skipObject(file) {
            skipClass(file);
            var itemCount = readBEInt(file, 4);
            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                skipId(file);
                skipItem(file);
            }
        }

        function skipList(file) {
            var itemCount = readBEInt(file, 4);
            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                skipItem(file);
            }
        }

        function skipItem(file) {
            var typeId = readBytes(file, 4);
            switch (typeId) {
                case 'obj ':
                    skipReference(file);
                    break;
                case 'Objc':
                case 'GlbO':
                    skipObject(file);
                    break;
                case 'type':
                case 'GlbC':
                    skipClass(file);
                    break;
                case 'VlLs':
                    skipList(file);
                    break;
                case 'doub':
                    skipDouble(file);
                    break;
                case 'UntF':
                    skipBytes(file, 4);
                    skipDouble(file);
                    break;
                case 'TEXT':
                    skipUnicodeString(file);
                    break;
                case 'enum':
                    skipId(file);
                    skipId(file);
                    break;
                case 'long':
                    skipInt32(file);
                    break;
                case 'comp':
                    skipInt64(file);
                    break;
                case 'bool':
                    skipInt8(file);
                    break;
                case 'alis':
                    skipByteString(file);
                    break;
                case 'Pth ':
                    skipByteString(file);
                    break;
                case 'tdta':
                    skipByteString(file);
                    break;
                case 'ObAr':
                    var objCount = readBEInt(file, 4);
                    skipClass(file);
                    var itemCount = readBEInt(file, 4);
                    for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                        skipId(file);
                        skipInt32(file);
                        skipInt32(file);
                        var doublesCount = readBEInt(file, 4);
                        skipDoubles(file, doublesCount);
                    }
                    break;
                default:
                    throw new Error("Unrecognized item type: '" + typeId + "'");
                    break;
            }
        }

        function skipReference(file) {
            var itemCount = readBEInt(file, 4);
            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                var formId = readBytes(file, 4);
                skipClass(file);
                switch (formId) {
                    case 'Clss':
                        break;
                    case 'prop':
                        skipId(file);
                        break;
                    case 'Enmr':
                        skipId(file);
                        skipId(file);
                        break;
                    case 'rele':
                        skipInt32(file);
                        break;
                    case 'Idnt':
                        skipInt32(file);
                        break;
                    case 'indx':
                        skipInt32(file);
                        break;
                    case 'name':
                        skipUnicodeString(file);
                        break;
                    default:
                        throw new Error("Unrecognized item form: '" + formId + "'");
                        break;
                }
            }
        }

        jamActions.readActionDescriptor = function (file, insertVersionPrefix) {
            var versionPrefix = "\x00\x00\x00\x10";
            var start = file.tell();
            if (!insertVersionPrefix) {
                if (file.read(4) === versionPrefix) {
                    versionPrefix = "";
                } else {
                    throw new Error('\n[jamActions.readActionDescriptor] Unrecognized version prefix');
                }
            }
            skipObject(file);
            var end = file.tell();
            file.seek(start, 0);
            var stream = versionPrefix + file.read(end - start);
            var actionDescriptor = new ActionDescriptor();
            actionDescriptor.fromStream(stream);
            return actionDescriptor;
        };
        jamActions.dataFromActionsFile = function (actionsFile, isPalette) {
            var that = this;

            function parseActionSet(file) {
                var actionSet = {};
                actionSet.name = localize(readUnicodeString(file));
                actionSet.expanded = (readBEInt(file, 1) !== 0);
                var actionCount = readBEInt(file, 4);
                actionSet.actions = [];
                for (var actionIndex = 0; actionIndex < actionCount; actionIndex++) {
                    var action = {};
                    action.functionKey = readBEInt(file, 2);
                    action.shiftKey = (readBEInt(file, 1) !== 0);
                    action.commandKey = (readBEInt(file, 1) !== 0);
                    action.colorIndex = readBEInt(file, 2);
                    action.name = localize(readUnicodeString(file));
                    action.expanded = (readBEInt(file, 1) !== 0);
                    var commandCount = readBEInt(file, 4);
                    action.commands = [];
                    for (var commandIndex = 0; commandIndex < commandCount; commandIndex++) {
                        var command = {};
                        command.expanded = (readBEInt(file, 1) !== 0);
                        command.enabled = (readBEInt(file, 1) !== 0);
                        command.withDialog = (readBEInt(file, 1) !== 0);
                        command.dialogOptions = readBEInt(file, 1);
                        command.eventId = readEventId(file);
                        command.dictionaryName = readByteString(file);
                        if (readBEInt(file, 4) !== 0) {
                            command.actionDescriptor = that.readActionDescriptor(file, true);
                        }
                        action.commands.push(command);
                    }
                    actionSet.actions.push(action);
                }
                return actionSet;
            }

            var file;
            if (typeof actionsFile === 'string') {
                file = new File(actionsFile);
            } else if (actionsFile instanceof File) {
                file = actionsFile;
            } else {
                throw new Error('\n[jamActions.dataFromActionsFile] Invalid argument');
            }
            var fileData;
            if (file.open("r")) {
                try {
                    file.encoding = 'BINARY';
                    var fileVersion = readBEInt(file, 4);
                    if (fileVersion === 16) {
                        fileData = {};
                        fileData.version = fileVersion;
                        if (isPalette) {
                            fileData.actionSets = [];
                            var actionSetCount = readBEInt(file, 4);
                            for (var actionSetIndex = 0; actionSetIndex < actionSetCount; actionSetIndex++) {
                                fileData.actionSets.push(parseActionSet(file));
                            }
                        } else {
                            fileData.actionSet = parseActionSet(file);
                        }
                    } else {
                        fileData = "Unsupported actions file version: " + fileVersion;
                    }
                } catch (e) {
                    fileData = e.message;
                } finally {
                    file.close();
                }
            } else {
                fileData = "Cannot open file";
            }
            return fileData;
        };
        jamActions.isLocalPlayCommand = function (command, actionSetName) {
            var localPlayCommand = null;
            if (command.eventId === app.stringIDToTypeID("play")) {
                var targetId = app.stringIDToTypeID("target");
                if (command.actionDescriptor.hasKey(targetId)) {
                    var localReference = command.actionDescriptor.getReference(targetId);
                    do {
                        try {
                            var desiredClassId = localReference.getDesiredClass();
                        } catch (e) {
                            break;
                        }
                        switch (desiredClassId) {
                            case app.stringIDToTypeID("command"):
                                var localCommandIndex = localReference.getIndex() - 1;
                                break;
                            case app.stringIDToTypeID("action"):
                                var localActionName = localReference.getName();
                                break;
                            case app.stringIDToTypeID("actionSet"):
                                var localActionSetName = localReference.getName();
                                break;
                        }
                        localReference = localReference.getContainer();
                    } while (localReference);
                }
                var continueId = app.stringIDToTypeID("continue");
                if (command.actionDescriptor.hasKey(continueId)) {
                    var localContinue = command.actionDescriptor.getBoolean(continueId);
                }
                if ((typeof localActionSetName !== 'undefined') && (localActionSetName === actionSetName)) {
                    localPlayCommand = [localActionName, localCommandIndex, localContinue];
                }
            }
            return localPlayCommand;
        };
        jamActions.determineDialogMode = function (command) {
            var dialogMode;
            switch (command.dialogOptions) {
                case 0:
                    dialogMode = command.withDialog ? DialogModes.ALL : DialogModes.NO;
                    break;
                case 2:
                    dialogMode = DialogModes.NO;
                    break;
                case 1:
                case 3:
                    dialogMode = DialogModes.ALL;
                    break;
            }
            return dialogMode;
        }
        var globalCommandHandler = null;
        jamActions.setCommandHandler = function (commandHandler) {
            globalCommandHandler = commandHandler;
        };
        jamActions.traverseAction = function (actionSet, actionLocator, fromCommandIndex, continuePlay) {
            function handleCommands(commands) {
                var commandMax = (continuePlay) ? commands.length : fromCommandIndex + 1;
                for (var commandIndex = fromCommandIndex; commandIndex < commandMax; commandIndex++) {
                    if (globalCommandHandler !== null) {
                        globalCommandHandler(commands[commandIndex]);
                    }
                }
            }

            if (typeof fromCommandIndex === 'undefined') {
                fromCommandIndex = 0;
                continuePlay = true;
            }
            var actions = actionSet.actions;
            if (typeof actionLocator === 'string') {
                var actionName = actionLocator;
                for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                    var action = actions[actionIndex];
                    if (action.name === actionName) {
                        handleCommands(action.commands);
                        break;
                    }
                }
            } else if (typeof actionLocator === 'number') {
                var actionIndex = actionLocator;
                if ((actionIndex >= 0) && (actionIndex < actions.length)) {
                    handleCommands(actions[actionIndex].commands);
                }
            }
        };
    }());
}
// jamEngine.jsxinc v3.6.3 (minified)
if (!this.jamEngine) {
    this.jamEngine = {};
    (function () {
        var that;
        jamEngine.meaningfulIds = false;
        jamEngine.parseFriendly = false;
        var conflictingStringIdStrs = {
            "'Algn'": ["align", "alignment"],
            "'AntA'": ["antiAlias", "antiAliasedPICTAcquire"],
            "'BckL'": ["backgroundLayer", "backgroundLevel"],
            "'BlcG'": ["blackGenerationType", "blackGenerationCurve"],
            "'BlcL'": ["blackLevel", "blackLimit"],
            "'Blks'": ["blacks", "blocks"],
            "'BlrM'": ["blurMethod", "blurMore"],
            "'BrgC'": ["brightnessEvent", "brightnessContrast"],
            "'BrsD'": ["brushDetail", "brushesDefine"],
            "'Brsh'": ["brush", "brushes"],
            "'Clcl'": ["calculation", "calculations"],
            "'ClrP'": ["colorPalette", "coloredPencil"],
            "'Cnst'": ["constant", "constrain"],
            "'CntC'": ["centerCropMarks", "conteCrayon"],
            "'Cntr'": ["center", "contrast"],
            "'CrtD'": ["createDroplet", "createDuplicate"],
            "'CstP'": ["customPalette", "customPhosphors"],
            "'Cstm'": ["custom", "customPattern"],
            "'Drkn'": ["darken", "darkness"],
            "'Dstr'": ["distort", "distortion", "distribute", "distribution"],
            "'Dstt'": ["desaturate", "destWhiteMax"],
            "'FlIn'": ["fileInfo", "fillInverse"],
            "'Gd  '": ["good", "guide"],
            "'GnrP'": ["generalPreferences", "generalPrefs", "preferencesClass"],
            "'GrSt'": ["grainStippled", "graySetup"],
            "'Grdn'": ["gradientClassEvent", "gridMinor"],
            "'Grn '": ["grain", "green"],
            "'Grns'": ["graininess", "greens"],
            "'HstP'": ["historyPreferences", "historyPrefs"],
            "'HstS'": ["historyState", "historyStateSourceType"],
            "'ImgP'": ["imageCachePreferences", "imagePoint"],
            "'In  '": ["in", "stampIn"],
            "'IntW'": ["interfaceWhite", "intersectWith"],
            "'Intr'": ["interfaceIconFrameDimmed", "interlace", "interpolation", "intersect"],
            "'JPEG'": ["JPEG", "JPEGFormat"],
            "'LghD'": ["lightDirection", "lightDirectional"],
            "'LghO'": ["lightOmni", "lightenOnly"],
            "'LghS'": ["lightSource", "lightSpot"],
            "'Lns '": ["lens", "lines"],
            "'Mgnt'": ["magenta", "magentas"],
            "'MrgL'": ["mergeLayers", "mergedLayers"],
            "'Mxm '": ["maximum", "maximumQuality"],
            "'NTSC'": ["NTSC", "NTSCColors"],
            "'NmbL'": ["numberOfLayers", "numberOfLevels"],
            "'PlgP'": ["pluginPicker", "pluginPrefs"],
            "'Pncl'": ["pencilEraser", "pencilWidth"],
            "'Pnt '": ["paint", "point"],
            "'Prsp'": ["perspective", "perspectiveIndex"],
            "'PrvM'": ["previewMacThumbnail", "previewMagenta"],
            "'Pstr'": ["posterization", "posterize"],
            "'RGBS'": ["RGBSetup", "RGBSetupSource"],
            "'Rds '": ["radius", "reds"],
            "'ScrD'": ["scratchDisks", "screenDot"],
            "'ShdI'": ["shadingIntensity", "shadowIntensity"],
            "'ShpC'": ["shapeCurveType", "shapingCurve"],
            "'ShrE'": ["sharpenEdges", "shearEd"],
            "'Shrp'": ["sharpen", "sharpness"],
            "'SplC'": ["splitChannels", "supplementalCategories"],
            "'Spot'": ["spot", "spotColor"],
            "'SprS'": ["separationSetup", "sprayedStrokes"],
            "'StrL'": ["strokeLength", "strokeLocation"],
            "'Strt'": ["saturation", "start"],
            "'TEXT'": ["char", "textType"],
            "'TIFF'": ["TIFF", "TIFFFormat"],
            "'TglO'": ["toggleOptionsPalette", "toggleOthers"],
            "'TrnG'": ["transparencyGamutPreferences", "transparencyGrid", "transparencyGridSize"],
            "'TrnS'": ["transferSpec", "transparencyShape", "transparencyStop"],
            "'Trns'": ["transparency", "transparent"],
            "'TxtC'": ["textClickPoint", "textureCoverage"],
            "'TxtF'": ["textureFile", "textureFill"],
            "'UsrM'": ["userMaskEnabled", "userMaskOptions"],
            "'c@#^'": ["inherits", "pInherits"],
            "'comp'": ["comp", "sInt64"],
            "'doub'": ["floatType", "IEEE64BitFloatingPoint", "longFloat"],
            "'long'": ["integer", "longInteger", "sInt32"],
            "'magn'": ["magnitude", "uInt32"],
            "'null'": ["null", "target"],
            "'shor'": ["sInt16", "sMInt", "shortInteger"],
            "'sing'": ["IEEE32BitFloatingPoint", "sMFloat", "shortFloat"]
        };
        jamEngine.getConflictingStringIdStrs = function (charIdStr) {
            return conflictingStringIdStrs[charIdStr] || null;
        };
        jamEngine.uniIdStrToId = function (uniIdStr) {
            var id = 0;
            if (typeof uniIdStr === 'string') {
                if ((uniIdStr.length === (1 + 4 + 1)) && (uniIdStr.charAt(0) === "'") && (uniIdStr.charAt(5) === "'")) {
                    id = app.charIDToTypeID(uniIdStr.substring(1, 5));
                } else {
                    id = app.stringIDToTypeID(uniIdStr);
                }
            }
            return id;
        };
        var smallestHashValue = app.charIDToTypeID("    ");
        jamEngine.idToUniIdStrs = function (id) {
            var charIdStr = "";
            var stringIdStr = app.typeIDToStringID(id);
            if (id >= smallestHashValue) {
                charIdStr = "'" + app.typeIDToCharID(id) + "'";
                if (stringIdStr !== "") {
                    if (charIdStr in conflictingStringIdStrs) {
                        stringIdStr = conflictingStringIdStrs[charIdStr];
                    }
                }
            }
            return [charIdStr, stringIdStr];
        };
        jamEngine.equivalentUniIdStrs = function (uniIdStr1, uniIdStr2) {
            return this.uniIdStrToId(uniIdStr1) === this.uniIdStrToId(uniIdStr2);
        };

        function putInReference(ref, containers) {
            if (containers.constructor === Array) {
                var count = containers.length;
                for (var i = 0; i < count; i++) {
                    var container = that.parseCompact(containers[i]);
                    var desiredClassId = that.uniIdStrToId(container[0]);
                    var typedValue = that.parseCompact(container[1]);
                    var form = typedValue[0];
                    var value = typedValue[1];
                    switch (form) {
                        case "<class>":
                            ref.putClass(desiredClassId);
                            break;
                        case "<enumerated>":
                            var enumerated = that.parseCompact(value);
                            ref.putEnumerated(desiredClassId, that.uniIdStrToId(enumerated[0]), that.uniIdStrToId(enumerated[1]));
                            break;
                        case "<identifier>":
                            ref.putIdentifier(desiredClassId, value);
                            break;
                        case "<index>":
                            ref.putIndex(desiredClassId, value);
                            break;
                        case "<name>":
                            ref.putName(desiredClassId, value);
                            break;
                        case "<offset>":
                            ref.putOffset(desiredClassId, value);
                            break;
                        case "<property>":
                            ref.putProperty(desiredClassId, that.uniIdStrToId(value));
                            break;
                        default:
                            throw new Error("\n[jamEngine putInReference] Unknown reference form: " + form);
                            break;
                    }
                }
            } else {
                throw new Error("\n[jamEngine putInReference] JavaScript array expected");
            }
        }

        function putInList(list, items) {
            if (items.constructor === Array) {
                var count = items.length;
                for (var i = 0; i < count; i++) {
                    var item = that.parseCompact(items[i]);
                    var type = item[0];
                    var value = item[1];
                    switch (type) {
                        case "<boolean>":
                            list.putBoolean(value);
                            break;
                        case "<class>":
                            list.putClass(that.uniIdStrToId(value));
                            break;
                        case "<data>":
                            list.putData(value);
                            break;
                        case "<double>":
                            list.putDouble(value);
                            break;
                        case "<enumerated>":
                            var enumerated = that.parseCompact(value);
                            list.putEnumerated(that.uniIdStrToId(enumerated[0]), that.uniIdStrToId(enumerated[1]));
                            break;
                        case "<integer>":
                            list.putInteger(value);
                            break;
                        case "<largeInteger>":
                            list.putLargeInteger(value);
                            break;
                        case "<list>":
                            var actionList = new ActionList();
                            putInList(actionList, value);
                            list.putList(actionList);
                            break;
                        case "<object>":
                            var object = that.parseCompact(value);
                            if (object[1]) {
                                var actionDescriptor = new ActionDescriptor();
                                putInDescriptor(actionDescriptor, object[1]);
                                list.putObject(that.uniIdStrToId(object[0]), actionDescriptor);
                            } else {
                                list.putClass(that.uniIdStrToId(object[0]));
                            }
                            break;
                        case "<path>":
                            var fileRef = new File(value);
                            list.putPath(fileRef);
                            break;
                        case "<reference>":
                            var actionReference = new ActionReference();
                            putInReference(actionReference, value);
                            list.putReference(actionReference);
                            break;
                        case "<string>":
                            list.putString(value);
                            break;
                        case "<unitDouble>":
                            var unitDouble = that.parseCompact(value);
                            list.putUnitDouble(that.uniIdStrToId(unitDouble[0]), unitDouble[1]);
                            break;
                        default:
                            throw new Error("\n[jamEngine putInList] Unknown list type: " + type);
                            break;
                    }
                }
            } else {
                throw new Error("\n[jamEngine putInList] JavaScript array expected");
            }
        }

        function putInDescriptor(desc, members) {
            if (members.constructor === Object) {
                for (var key in members) {
                    if (members.hasOwnProperty(key)) {
                        var keyID = that.uniIdStrToId(key);
                        var member = that.parseCompact(members[key]);
                        var type = member[0];
                        var value = member[1];
                        switch (type) {
                            case "<boolean>":
                                desc.putBoolean(keyID, value);
                                break;
                            case "<class>":
                                desc.putClass(keyID, that.uniIdStrToId(value));
                                break;
                            case "<data>":
                                desc.putData(keyID, value);
                                break;
                            case "<double>":
                                desc.putDouble(keyID, value);
                                break;
                            case "<enumerated>":
                                var enumerated = that.parseCompact(value);
                                desc.putEnumerated(keyID, that.uniIdStrToId(enumerated[0]), that.uniIdStrToId(enumerated[1]));
                                break;
                            case "<integer>":
                                desc.putInteger(keyID, value);
                                break;
                            case "<largeInteger>":
                                desc.putLargeInteger(keyID, value);
                                break;
                            case "<list>":
                                var actionList = new ActionList();
                                putInList(actionList, value);
                                desc.putList(keyID, actionList);
                                break;
                            case "<object>":
                                var object = that.parseCompact(value);
                                if (object[1]) {
                                    var actionDescriptor = new ActionDescriptor();
                                    putInDescriptor(actionDescriptor, object[1]);
                                    desc.putObject(keyID, that.uniIdStrToId(object[0]), actionDescriptor);
                                } else {
                                    desc.putClass(keyID, that.uniIdStrToId(object[0]));
                                }
                                break;
                            case "<path>":
                                var fileRef = new File(value);
                                desc.putPath(keyID, fileRef);
                                break;
                            case "<reference>":
                                var actionReference = new ActionReference();
                                putInReference(actionReference, value);
                                desc.putReference(keyID, actionReference);
                                break;
                            case "<string>":
                                desc.putString(keyID, value);
                                break;
                            case "<unitDouble>":
                                var unitDouble = that.parseCompact(value);
                                desc.putUnitDouble(keyID, that.uniIdStrToId(unitDouble[0]), unitDouble[1]);
                                break;
                            default:
                                throw new Error("\n[jamEngine putInDescriptor] Unknown descriptor type: " + type);
                                break;
                        }
                    }
                }
            } else {
                throw new Error("\n[jamEngine putInDescriptor] JavaScript object expected");
            }
        }

        var contextRules = {
            "'Algn'": {
                "<classKey>": {
                    "bevelEmboss": "align",
                    "frameFX": "align",
                    "gradientFill": "align",
                    "patternFill": "align"
                },
                "<event>": "align",
                "<key>": "alignment"
            },
            "'AntA'": {
                "<class>": "antiAliasedPICTAcquire",
                "<key>": "antiAlias"
            },
            "'BckL'": {
                "<class>": "backgroundLayer",
                "<key>": "backgroundLevel"
            },
            "'BlcG'": {
                "<enumType>": "blackGenerationType",
                "<key>": "blackGenerationCurve"
            },
            "'BlcL'": {
                "<classKey>": {
                    "'GEfc'": "blackLevel",
                    "CMYKSetup": "blackLimit"
                },
                "<eventKey>": {
                    "reticulation": "blackLevel"
                }
            },
            "'Blks'": {
                "<typeValue>": {
                    "colors": "blacks",
                    "extrudeType": "blocks"
                }
            },
            "'BlrM'": {
                "<enumType>": "blurMethod",
                "<event>": "blurMore",
                "<key>": "blurMethod"
            },
            "'BrgC'": {
                "<class>": "brightnessContrast",
                "<event>": "brightnessContrast"
            },
            "'BrsD'": {
                "<enumValue>": "brushesDefine",
                "<key>": "brushDetail"
            },
            "'Brsh'": {
                "<class>": "brush",
                "<key>": "brushes"
            },
            "'Clcl'": {
                "<class>": "calculation",
                "<enumValue>": "calculations",
                "<key>": "calculation"
            },
            "'ClrP'": {
                "<typeValue>": {
                    "'GEft'": "coloredPencil"
                },
                "<enumType>": "colorPalette",
                "<event>": "coloredPencil"
            },
            "'Cnst'": {
                "<classKey>": {
                    "channelMatrix": "constant"
                },
                "<unknown>": "constrain"
            },
            "'CntC'": {
                "<typeValue>": {
                    "'GEft'": "conteCrayon"
                },
                "<event>": "conteCrayon",
                "<key>": "centerCropMarks"
            },
            "'Cntr'": {
                "<classKey>": {
                    "'GEfc'": "contrast",
                    "brightnessContrast": "contrast",
                    "document": "center",
                    "polygon": "center",
                    "quadrilateral": "center"
                },
                "<eventKey>": {
                    "adaptCorrect": "contrast",
                    "brightnessEvent": "contrast",
                    "grain": "contrast",
                    "halftoneScreen": "contrast",
                    "sumie": "contrast",
                    "tornEdges": "contrast",
                    "waterPaper": "contrast"
                },
                "<enumValue>": "center"
            },
            "'CrtD'": {
                "<enumValue>": "createDuplicate",
                "<event>": "createDroplet"
            },
            "'CstP'": {
                "<class>": "customPhosphors",
                "<key>": "customPalette"
            },
            "'Cstm'": {
                "<enumValue>": "customPattern",
                "<event>": "custom",
                "<key>": "custom"
            },
            "'Drkn'": {
                "<enumValue>": "darken",
                "<key>": "darkness"
            },
            "'Dstr'": {
                "<classKey>": {
                    "'GEfc'": "distortion"
                },
                "<eventKey>": {
                    "glass": "distortion",
                    "addNoise": "distribution"
                },
                "<enumType>": "distribution",
                "<enumValue>": "distort",
                "<event>": "distribute"
            },
            "'Dstt'": {
                "<enumValue>": "desaturate",
                "<event>": "desaturate",
                "<key>": "destWhiteMax"
            },
            "'FlIn'": {
                "<typeValue>": {
                    "fillColor": "fillInverse",
                    "menuItemType": "fileInfo"
                },
                "<class>": "fileInfo",
                "<key>": "fileInfo"
            },
            "'Gd  '": {
                "<class>": "guide",
                "<enumValue>": "good"
            },
            "'GnrP'": {
                "<class>": "preferencesClass",
                "<enumValue>": "generalPreferences",
                "<key>": "generalPrefs"
            },
            "'GrSt'": {
                "<class>": "graySetup",
                "<enumValue>": "grainStippled",
                "<key>": "graySetup"
            },
            "'Grdn'": {
                "<class>": "gradientClassEvent",
                "<event>": "gradientClassEvent",
                "<key>": "gridMinor"
            },
            "'Grn '": {
                "<typeValue>": {
                    "'GEft'": "grain"
                },
                "<classKey>": {
                    "'GEfc'": "grain",
                    "RGBColor": "green",
                    "blackAndWhite": "green",
                    "channelMatrix": "green",
                    "channelMixer": "green"
                },
                "<eventKey>": {
                    "blackAndWhite": "green",
                    "channelMixer": "green",
                    "filmGrain": "grain"
                },
                "<enumValue>": "green",
                "<event>": "grain"
            },
            "'Grns'": {
                "<enumValue>": "greens",
                "<key>": "graininess"
            },
            "'HstP'": {
                "<enumValue>": "historyPreferences",
                "<key>": "historyPrefs"
            },
            "'HstS'": {
                "<class>": "historyState",
                "<enumType>": "historyStateSourceType"
            },
            "'ImgP'": {
                "<class>": "imagePoint",
                "<enumValue>": "imageCachePreferences"
            },
            "'In  '": {
                "<enumValue>": "stampIn",
                "<key>": "in"
            },
            "'IntW'": {
                "<event>": "intersectWith",
                "<key>": "interfaceWhite"
            },
            "'Intr'": {
                "<typeValue>": {
                    "shapeOperation": "intersect"
                },
                "<classKey>": {
                    "GIFFormat": "interlace",
                    "SaveForWeb": "interlace",
                    "application": "interfaceIconFrameDimmed",
                    "computedBrush": "interpolation",
                    "gradientClassEvent": "interpolation",
                    "photoshopEPSFormat": "interpolation"
                },
                "<eventKey>": {
                    "convertMode": "interpolation",
                    "imageSize": "interpolation",
                    "transform": "interpolation"
                },
                "<event>": "intersect"
            },
            "'JPEG'": {
                "<class>": "JPEGFormat",
                "<enumValue>": "JPEG"
            },
            "'LghD'": {
                "<enumType>": "lightDirection",
                "<enumValue>": "lightDirectional",
                "<key>": "lightDirection"
            },
            "'LghO'": {
                "<typeValue>": {
                    "diffuseMode": "lightenOnly",
                    "lightType": "lightOmni"
                }
            },
            "'LghS'": {
                "<class>": "lightSource",
                "<enumValue>": "lightSpot",
                "<key>": "lightSource"
            },
            "'Lns '": {
                "<enumType>": "lens",
                "<enumValue>": "lines",
                "<key>": "lens"
            },
            "'Mgnt'": {
                "<typeValue>": {
                    "channel": "magenta",
                    "colors": "magentas",
                    "guideGridColor": "magenta"
                },
                "<key>": "magenta"
            },
            "'MrgL'": {
                "<enumValue>": "mergedLayers",
                "<event>": "mergeLayers"
            },
            "'Mxm '": {
                "<enumValue>": "maximumQuality",
                "<event>": "maximum",
                "<key>": "maximum"
            },
            "'NTSC'": {
                "<enumValue>": "NTSC",
                "<event>": "NTSCColors"
            },
            "'NmbL'": {
                "<classKey>": {
                    "'GEfc'": "numberOfLevels",
                    "document": "numberOfLayers"
                },
                "<eventKey>": {
                    "cutout": "numberOfLevels"
                }
            },
            "'PlgP'": {
                "<class>": "pluginPrefs",
                "<enumValue>": "pluginPicker",
                "<key>": "pluginPrefs"
            },
            "'Pncl'": {
                "<enumValue>": "pencilEraser",
                "<key>": "pencilWidth"
            },
            "'Pnt '": {
                "<typeValue>": {
                    "textType": "point"
                },
                "<class>": "point",
                "<event>": "paint"
            },
            "'Prsp'": {
                "<enumValue>": "perspective",
                "<key>": "perspectiveIndex"
            },
            "'PrvM'": {
                "<enumValue>": "previewMagenta",
                "<key>": "previewMacThumbnail"
            },
            "'Pstr'": {
                "<class>": "posterize",
                "<event>": "posterize",
                "<key>": "posterization"
            },
            "'RGBS'": {
                "<enumType>": "RGBSetupSource",
                "<key>": "RGBSetup"
            },
            "'Rds '": {
                "<enumValue>": "reds",
                "<key>": "radius"
            },
            "'ScrD'": {
                "<enumValue>": "screenDot",
                "<key>": "scratchDisks"
            },
            "'ShdI'": {
                "<classKey>": {
                    "'GEfc'": "shadowIntensity"
                },
                "<eventKey>": {
                    "watercolor": "shadowIntensity"
                },
                "<unknown>": "shadingIntensity"
            },
            "'ShpC'": {
                "<classKey>": {
                    "application": "shapingCurve"
                },
                "<class>": "shapingCurve",
                "<key>": "shapeCurveType"
            },
            "'ShrE'": {
                "<event>": "sharpenEdges",
                "<key>": "shearEd"
            },
            "'Shrp'": {
                "<event>": "sharpen",
                "<key>": "sharpness"
            },
            "'SplC'": {
                "<event>": "splitChannels",
                "<key>": "supplementalCategories"
            },
            "'Spot'": {
                "<enumValue>": "spotColor",
                "<key>": "spot"
            },
            "'SprS'": {
                "<typeValue>": {
                    "'GEft'": "sprayedStrokes"
                },
                "<enumValue>": "separationSetup",
                "<event>": "sprayedStrokes"
            },
            "'StrL'": {
                "<enumType>": "strokeLocation",
                "<key>": "strokeLength"
            },
            "'Strt'": {
                "<classKey>": {
                    "currentToolOptions": "saturation",
                    "fileNamingRules": "start",
                    "HSBColorClass": "saturation",
                    "hueSatAdjustment": "saturation",
                    "hueSatAdjustmentV2": "saturation",
                    "lineClass": "start",
                    "range": "start",
                    "vibrance": "saturation"
                },
                "<eventKey>": {
                    "replaceColor": "saturation",
                    "variations": "saturation",
                    "vibrance": "saturation"
                },
                "<enumValue>": "saturation"
            },
            "'TEXT'": {
                "<enumType>": "textType",
                "<key>": "textType"
            },
            "'TIFF'": {
                "<class>": "TIFFFormat",
                "<enumValue>": "TIFF"
            },
            "'TglO'": {
                "<enumValue>": "toggleOptionsPalette",
                "<key>": "toggleOthers"
            },
            "'TrnG'": {
                "<classKey>": {
                    "application": "transparencyGrid",
                    "transparencyPrefs": "transparencyGridSize"
                },
                "<enumType>": "transparencyGridSize",
                "<enumValue>": "transparencyGamutPreferences"
            },
            "'TrnS'": {
                "<classKey>": {
                    "bevelEmboss": "transparencyShape",
                    "dropShadow": "transparencyShape",
                    "innerGlow": "transparencyShape",
                    "innerShadow": "transparencyShape",
                    "outerGlow": "transparencyShape"
                },
                "<class>": "transparencyStop",
                "<unknown>": "transferSpec"
            },
            "'Trns'": {
                "<enumValue>": "transparent",
                "<key>": "transparency"
            },
            "'TxtC'": {
                "<classKey>": {
                    "'GEfc'": "textureCoverage",
                    "textLayer": "textClickPoint"
                },
                "<eventKey>": {
                    "underpainting": "textureCoverage"
                }
            },
            "'TxtF'": {
                "<event>": "textureFill",
                "<key>": "textureFile"
            },
            "'UsrM'": {
                "<enumType>": "userMaskOptions",
                "<key>": "userMaskEnabled"
            },
            "'null'": {
                "<class>": "null",
                "<enumValue>": "null",
                "<event>": "null",
                "<key>": "target"
            }
        };

        function getFromId(context, parentContext) {
            var uniIdStr;
            var kind = context[0];
            var id = context[1];
            if (id < smallestHashValue) {
                uniIdStr = app.typeIDToStringID(id);
            } else {
                uniIdStr = "'" + app.typeIDToCharID(id) + "'";
                if (that.meaningfulIds) {
                    if (uniIdStr in contextRules) {
                        function resolveIdStr(candidates) {
                            var idStr = "";
                            for (var parentString in candidates) {
                                if (candidates.hasOwnProperty(parentString)) {
                                    if (parentContext[1] === that.uniIdStrToId(parentString)) {
                                        idStr = candidates[parentString];
                                        break;
                                    }
                                }
                            }
                            return idStr;
                        }

                        var resolvedIdStr = "";
                        var rule = contextRules[uniIdStr];
                        if (parentContext) {
                            switch (kind) {
                                case "<key>":
                                    if ((parentContext[0] === "<class>") && ("<classKey>" in rule)) {
                                        resolvedIdStr = resolveIdStr(rule["<classKey>"]);
                                    } else if ((parentContext[0] === "<event>") && ("<eventKey>" in rule)) {
                                        resolvedIdStr = resolveIdStr(rule["<eventKey>"]);
                                    }
                                    break;
                                case "<enumValue>":
                                    if ((parentContext[0] === "<enumType>") && ("<typeValue>" in rule)) {
                                        resolvedIdStr = resolveIdStr(rule["<typeValue>"]);
                                    }
                                    break;
                            }
                        }
                        if (resolvedIdStr !== "") {
                            uniIdStr = resolvedIdStr;
                        } else if (kind in rule) {
                            uniIdStr = rule[kind];
                        }
                    } else {
                        var stringIDStr = app.typeIDToStringID(id);
                        if (stringIDStr !== "") {
                            uniIdStr = stringIDStr;
                        }
                    }
                }
            }
            return uniIdStr;
        }

        var incompatiblePlatformPath = "";
        var getEventId = app.stringIDToTypeID("get");
        var targetKeyId = app.stringIDToTypeID("target");
        var propertyClassId = app.stringIDToTypeID("property");

        function getFromReference(ref) {
            var propertyId = 0;
            var arr = [];
            do {
                try {
                    var desiredClassId = ref.getDesiredClass();
                } catch (e) {
                    break;
                }
                if (propertyId !== 0) {
                    var propertyCompact = that.buildCompact("<property>", getFromId(["<key>", propertyId], ["<class>", desiredClassId]));
                    arr.push(that.buildCompact(getFromId(["<class>", propertyClassId]), propertyCompact));
                    propertyId = 0;
                }
                var desiredCompact;
                var aFormID = ref.getForm();
                switch (aFormID) {
                    case ReferenceFormType.CLASSTYPE:
                        desiredCompact = that.buildCompact("<class>", null);
                        break;
                    case ReferenceFormType.ENUMERATED:
                        var enumTypeContext = ["<enumType>", ref.getEnumeratedType()];
                        var enumValueContext = ["<enumValue>", ref.getEnumeratedValue()];
                        desiredCompact = that.buildCompact("<enumerated>", that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext)));
                        break;
                    case ReferenceFormType.IDENTIFIER:
                        desiredCompact = that.buildCompact("<identifier>", ref.getIdentifier());
                        break;
                    case ReferenceFormType.INDEX:
                        desiredCompact = that.buildCompact("<index>", ref.getIndex());
                        break;
                    case ReferenceFormType.NAME:
                        desiredCompact = that.buildCompact("<name>", ref.getName());
                        break;
                    case ReferenceFormType.OFFSET:
                        desiredCompact = that.buildCompact("<offset>", ref.getOffset());
                        break;
                    case ReferenceFormType.PROPERTY:
                        if (desiredClassId === propertyClassId) {
                            propertyId = ref.getProperty();
                        } else {
                            desiredCompact = that.buildCompact("<property>", getFromId(["<key>", ref.getProperty()], ["<class>", desiredClassId]));
                        }
                        break;
                    default:
                        throw new Error("\n[jamEngine getFromReference] Unknown reference form type: " + aFormID);
                        break;
                }
                if (desiredClassId !== propertyClassId) {
                    arr.push(that.buildCompact(getFromId(["<class>", desiredClassId]), desiredCompact));
                }
                ref = ref.getContainer();
            } while (ref);
            return arr;
        }

        function getFromList(list) {
            var arr = [];
            var itemCount = list.count;
            for (var itemIndex = 0; itemIndex < itemCount; itemIndex++) {
                var itemCompact;
                var typeID;
                try {
                    typeID = list.getType(itemIndex);
                } catch (e) {
                    continue;
                }
                switch (typeID) {
                    case DescValueType.BOOLEANTYPE:
                        itemCompact = that.buildCompact("<boolean>", list.getBoolean(itemIndex));
                        break;
                    case DescValueType.CLASSTYPE:
                        itemCompact = that.buildCompact("<class>", getFromId(["<class>", list.getClass(itemIndex)]));
                        break;
                    case DescValueType.DOUBLETYPE:
                        itemCompact = that.buildCompact("<double>", list.getDouble(itemIndex));
                        break;
                    case DescValueType.ENUMERATEDTYPE:
                        var enumTypeContext = ["<enumType>", list.getEnumerationType(itemIndex)];
                        var enumValueContext = ["<enumValue>", list.getEnumerationValue(itemIndex)];
                        itemCompact = that.buildCompact("<enumerated>", that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext)));
                        break;
                    case DescValueType.INTEGERTYPE:
                        itemCompact = that.buildCompact("<integer>", list.getInteger(itemIndex));
                        break;
                    case DescValueType.LISTTYPE:
                        itemCompact = that.buildCompact("<list>", getFromList(list.getList(itemIndex)));
                        break;
                    case DescValueType.OBJECTTYPE:
                        var objectTypeContext = ["<class>", list.getObjectType(itemIndex)];
                        var objectValue = list.getObjectValue(itemIndex);
                        itemCompact = that.buildCompact("<object>", that.buildCompact(getFromId(objectTypeContext), getFromDescriptor(objectValue, objectTypeContext)));
                        break;
                    case DescValueType.ALIASTYPE:
                        try {
                            var fileRef = list.getPath(itemIndex);
                            itemCompact = that.buildCompact("<path>", fileRef.fsName);
                        } catch (e) {
                            itemCompact = that.buildCompact("<path>", incompatiblePlatformPath);
                        }
                        break;
                    case DescValueType.REFERENCETYPE:
                        itemCompact = that.buildCompact("<reference>", getFromReference(list.getReference(itemIndex)));
                        break;
                    case DescValueType.STRINGTYPE:
                        itemCompact = that.buildCompact("<string>", list.getString(itemIndex));
                        break;
                    case DescValueType.UNITDOUBLE:
                        var unitTypeContext = ["<unit>", list.getUnitDoubleType(itemIndex)];
                        var doubleValue = list.getUnitDoubleValue(itemIndex);
                        itemCompact = that.buildCompact("<unitDouble>", that.buildCompact(getFromId(unitTypeContext), doubleValue));
                        break;
                    default:
                        var isRawType;
                        var isLargeIntegerType;
                        try {
                            isRawType = (typeID === DescValueType.RAWTYPE);
                        } catch (e) {
                        }
                        try {
                            isLargeIntegerType = (typeID === DescValueType.LARGEINTEGERTYPE);
                        } catch (e) {
                        }
                        if (isRawType) {
                            itemCompact = that.buildCompact("<data>", list.getData(itemIndex));
                        } else if (isLargeIntegerType) {
                            itemCompact = that.buildCompact("<largeInteger>", list.getLargeInteger(itemIndex));
                        } else {
                            throw new Error("\n[jamEngine getFromList] Unknown descriptor value type: " + typeID);
                        }
                        break;
                }
                arr[itemIndex] = itemCompact;
            }
            return arr;
        }

        function getFromDescriptor(desc, parentContext) {
            if (desc) {
                var obj = {};
                var keyCount;
                try {
                    keyCount = desc.count;
                } catch (e) {
                    return null;
                }
                for (var keyIndex = 0; keyIndex < keyCount; keyIndex++) {
                    var keyID = desc.getKey(keyIndex);
                    var keyString = getFromId(["<key>", keyID], parentContext);
                    var keyCompact;
                    var typeID;
                    try {
                        typeID = desc.getType(keyID);
                    } catch (e) {
                        continue;
                    }
                    switch (typeID) {
                        case DescValueType.BOOLEANTYPE:
                            keyCompact = that.buildCompact("<boolean>", desc.getBoolean(keyID));
                            break;
                        case DescValueType.CLASSTYPE:
                            keyCompact = that.buildCompact("<class>", getFromId(["<class>", desc.getClass(keyID)]));
                            break;
                        case DescValueType.DOUBLETYPE:
                            keyCompact = that.buildCompact("<double>", desc.getDouble(keyID));
                            break;
                        case DescValueType.ENUMERATEDTYPE:
                            var enumTypeContext = ["<enumType>", desc.getEnumerationType(keyID)];
                            var enumValueContext = ["<enumValue>", desc.getEnumerationValue(keyID)];
                            keyCompact = that.buildCompact("<enumerated>", that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext)));
                            break;
                        case DescValueType.INTEGERTYPE:
                            keyCompact = that.buildCompact("<integer>", desc.getInteger(keyID));
                            break;
                        case DescValueType.LISTTYPE:
                            keyCompact = that.buildCompact("<list>", getFromList(desc.getList(keyID)));
                            break;
                        case DescValueType.OBJECTTYPE:
                            var objectTypeContext = ["<class>", desc.getObjectType(keyID)];
                            var objectValue = desc.getObjectValue(keyID);
                            keyCompact = that.buildCompact("<object>", that.buildCompact(getFromId(objectTypeContext), getFromDescriptor(objectValue, objectTypeContext)));
                            break;
                        case DescValueType.ALIASTYPE:
                            try {
                                var fileRef = desc.getPath(keyID);
                                keyCompact = that.buildCompact("<path>", fileRef.fsName);
                            } catch (e) {
                                keyCompact = that.buildCompact("<path>", incompatiblePlatformPath);
                            }
                            break;
                        case DescValueType.REFERENCETYPE:
                            keyCompact = that.buildCompact("<reference>", getFromReference(desc.getReference(keyID)));
                            break;
                        case DescValueType.STRINGTYPE:
                            keyCompact = that.buildCompact("<string>", desc.getString(keyID));
                            break;
                        case DescValueType.UNITDOUBLE:
                            var unitTypeContext = ["<unit>", desc.getUnitDoubleType(keyID)];
                            var doubleValue = desc.getUnitDoubleValue(keyID);
                            keyCompact = that.buildCompact("<unitDouble>", that.buildCompact(getFromId(unitTypeContext), doubleValue));
                            break;
                        default:
                            var isRawType;
                            var isLargeIntegerType;
                            try {
                                isRawType = (typeID === DescValueType.RAWTYPE);
                            } catch (e) {
                            }
                            try {
                                isLargeIntegerType = (typeID === DescValueType.LARGEINTEGERTYPE);
                            } catch (e) {
                            }
                            if (isRawType) {
                                keyCompact = that.buildCompact("<data>", desc.getData(keyID));
                            } else if (isLargeIntegerType) {
                                keyCompact = that.buildCompact("<largeInteger>", desc.getLargeInteger(keyID));
                            } else {
                                throw new Error("\n[jamEngine getFromDescriptor] Unknown descriptor value type: " + typeID);
                            }
                            break;
                    }
                    obj[keyString] = keyCompact;
                }
                return obj;
            } else {
                return null;
            }
        }

        jamEngine.jsonToActionDescriptor = function (descriptorObj) {
            that = this;
            var actionDescriptor;
            if (descriptorObj) {
                actionDescriptor = new ActionDescriptor();
                putInDescriptor(actionDescriptor, descriptorObj);
            }
            return actionDescriptor;
        };
        jamEngine.jsonToActionReference = function (referenceArr) {
            that = this;
            var actionReference;
            if (referenceArr) {
                actionReference = new ActionReference();
                putInReference(actionReference, referenceArr);
            }
            return actionReference;
        };
        jamEngine.eventIdAndActionDescriptorToJson = function (eventId, actionDescriptor) {
            that = this;
            var eventIdContext = ["<event>", eventId];
            return {
                "<event>": getFromId(eventIdContext),
                "<descriptor>": getFromDescriptor(actionDescriptor, eventIdContext)
            };
        };
        jamEngine.classIdAndActionDescriptorToJson = function (classId, actionDescriptor) {
            that = this;
            var classIdContext = ["<class>", classId];
            return {
                "<class>": getFromId(classIdContext),
                "<descriptor>": getFromDescriptor(actionDescriptor, classIdContext)
            };
        };
        jamEngine.actionReferenceToJson = function (actionReference) {
            that = this;
            return getFromReference(actionReference);
        };

        function getReferenceClassId(ref) {
            classId = 0;
            do {
                try {
                    var desiredClassId = ref.getDesiredClass();
                } catch (e) {
                    break;
                }
                if (desiredClassId !== propertyClassId) {
                    classId = desiredClassId;
                    break;
                }
                ref = ref.getContainer();
            } while (ref);
            return classId;
        }

        jamEngine.jsonPlay = function (eventUniIdStr, descriptorObj, displayDialogs) {
            var eventId = this.uniIdStrToId(eventUniIdStr);
            var desc = this.jsonToActionDescriptor(descriptorObj);
            var parentContext;
            if (eventId === getEventId) {
                var ref = desc.getReference(targetKeyId);
                parentContext = ["<class>", getReferenceClassId(ref)];
            } else {
                parentContext = ["<event>", eventId];
            }
            return getFromDescriptor(app.executeAction(eventId, desc, displayDialogs), parentContext);
        };
        jamEngine.jsonGet = function (referenceArr) {
            var ref = this.jsonToActionReference(referenceArr);
            return getFromDescriptor(app.executeActionGet(ref), ["<class>", getReferenceClassId(ref)]);
        };
        jamEngine.normalizeJsonItem = function (item, options) {
            function normalizeItem(item) {
                var explicit = that.parseCompact(item);
                var type = explicit[0];
                var value = explicit[1];
                var normalizedValue;
                switch (type) {
                    case "<boolean>":
                    case "<data>":
                    case "<double>":
                    case "<identifier>":
                    case "<index>":
                    case "<integer>":
                    case "<largeInteger>":
                    case "<name>":
                    case "<offset>":
                    case "<path>":
                    case "<string>":
                        normalizedValue = value;
                        break;
                    case "<class>":
                        normalizedValue = value && getFromId(["<class>", that.uniIdStrToId(value)]);
                        break;
                    case "<enumerated>":
                        var enumerated = that.parseCompact(value);
                        var enumTypeContext = ["<enumType>", that.uniIdStrToId(enumerated[0])];
                        var enumValueContext = ["<enumValue>", that.uniIdStrToId(enumerated[1])];
                        normalizedValue = that.buildCompact(getFromId(enumTypeContext), getFromId(enumValueContext, enumTypeContext));
                        break;
                    case "<list>":
                        normalizedValue = [];
                        for (var i = 0; i < value.length; i++) {
                            normalizedValue.push(normalizeItem(value[i]));
                        }
                        break;
                    case "<object>":
                        var object = that.parseCompact(value);
                        var objectClassContext = ["<class>", that.uniIdStrToId(object[0])];
                        var objectDescriptor = object[1];
                        var normalizedDescriptor;
                        if (objectDescriptor === null) {
                            normalizedDescriptor = null;
                        } else {
                            normalizedDescriptor = {};
                            for (var key in objectDescriptor) {
                                if (objectDescriptor.hasOwnProperty(key)) {
                                    var objectKeyContext = ["<key>", that.uniIdStrToId(key)];
                                    normalizedDescriptor[getFromId(objectKeyContext, objectClassContext)] = normalizeItem(objectDescriptor[key]);
                                }
                            }
                        }
                        normalizedValue = that.buildCompact(getFromId(objectClassContext), normalizedDescriptor);
                        break;
                    case "<property>":
                        normalizedValue = getFromId(["<key>", that.uniIdStrToId(value)]);
                        break;
                    case "<reference>":
                        normalizedValue = [];
                        for (var i = 0; i < value.length; i++) {
                            var container = that.parseCompact(value[i]);
                            normalizedValue.push(that.buildCompact(getFromId(["<class>", that.uniIdStrToId(container[0])]), normalizeItem(container[1])));
                        }
                        break;
                    case "<unitDouble>":
                        var unitDouble = that.parseCompact(value);
                        var unitTypeContext = ["<unit>", that.uniIdStrToId(unitDouble[0])];
                        normalizedValue = that.buildCompact(getFromId(unitTypeContext), unitDouble[1]);
                        break;
                    default:
                        throw new Error("\n[jamEngine.normalizeJsonItem] Unknown item type: " + type);
                        break;
                }
                return that.buildCompact(type, normalizedValue);
            }

            that = this;
            var saveMeaningfulIds = this.meaningfulIds;
            var saveParseFriendly = this.parseFriendly;
            if (options && (options.constructor === Object)) {
                if (typeof options.meaningfulIds !== 'undefined') {
                    this.meaningfulIds = options.meaningfulIds;
                }
                if (typeof options.parseFriendly !== 'undefined') {
                    this.parseFriendly = options.parseFriendly;
                }
            }
            var normalizedItem = normalizeItem(item);
            this.meaningfulIds = saveMeaningfulIds;
            this.parseFriendly = saveParseFriendly;
            return normalizedItem;
        };

        function simplifyRef(ref) {
            var simplifiedRef = [];
            for (var i = 0; i < ref.length; i++) {
                var element = ref[i];
                var simplifiedElement = {};
                var desiredClass = element[0];
                var form = element[1][0];
                var value = element[1][1];
                switch (form) {
                    case "<class>":
                    case "<identifier>":
                    case "<index>":
                    case "<name>":
                    case "<offset>":
                    case "<property":
                        simplifiedElement[desiredClass] = value;
                        break;
                    case "<enumerated>":
                        simplifiedElement[desiredClass] = value[1];
                        break;
                    default:
                        throw new Error("\n[jamEngine simplifyRef] Unexpected element form: " + form);
                        break;
                }
                simplifiedRef.push(simplifiedElement);
            }
            return simplifiedRef;
        }

        function simplifyItem(item, hook) {
            var simplifiedItem;
            var type = item[0];
            var value = item[1];
            switch (type) {
                case "<boolean>":
                case "<class>":
                case "<data>":
                case "<double>":
                case "<integer>":
                case "<largeInteger>":
                case "<path>":
                case "<string>":
                    simplifiedItem = value;
                    break;
                case "<list>":
                    simplifiedItem = simplifyList(value, hook);
                    break;
                case "<enumerated>":
                case "<unitDouble>":
                    simplifiedItem = value[1];
                    break;
                case "<object>":
                    simplifiedItem = simplifyDesc(value[1], hook);
                    break;
                case "<reference>":
                    simplifiedItem = simplifyRef(value);
                    break;
                default:
                    throw new Error("\n[jamEngine simplifyItem] Unexpected item type: " + type);
                    break;
            }
            return simplifiedItem;
        }

        function simplifyList(list, hook) {
            var simplifiedList = [];
            for (var i = 0; i < list.length; i++) {
                simplifiedList.push(simplifyItem(list[i], hook));
            }
            return simplifiedList;
        }

        function simplifyDesc(desc, hook) {
            var getDefaultValue = function (desc, key) {
                return simplifyItem(desc[key], hook);
            };
            var simplifiedDesc = {};
            for (var key in desc) {
                if (desc.hasOwnProperty(key)) {
                    var value = undefined;
                    if (typeof hook === 'function') {
                        value = hook(desc, key, getDefaultValue);
                    }
                    if (typeof value === 'undefined') {
                        value = simplifyItem(desc[key], hook);
                    }
                    simplifiedDesc[key] = value;
                }
            }
            return simplifiedDesc;
        }

        jamEngine.simplifyObject = function (object, hookFunction) {
            return simplifyDesc((this.normalizeJsonItem(object, {
                meaningfulIds: true,
                parseFriendly: true
            }))[1][1], hookFunction);
        };
        jamEngine.simplifyList = function (list, hookFunction) {
            return simplifyList((this.normalizeJsonItem(list, {
                meaningfulIds: true,
                parseFriendly: true
            }))[1], hookFunction);
        };
        jamEngine.parseCompact = function (compact) {
            var result = [];
            if (compact.constructor === Object) {
                var keys = [];
                for (var k in compact) {
                    if (compact.hasOwnProperty(k)) {
                        keys.push(k);
                    }
                }
                if (keys.length === 1) {
                    result[0] = keys[0];
                    result[1] = compact[keys[0]];
                } else {
                    throw new Error("\n[jamEngine.parseCompact] Syntax error: " + compact.toSource());
                }
            } else if (compact.constructor === Array) {
                if (compact.length === 2) {
                    result[0] = compact[0];
                    result[1] = compact[1];
                } else {
                    throw new Error("\n[jamEngine.parseCompact] Syntax error: " + compact.toSource());
                }
            } else {
                throw new Error("\n[jamEngine.parseCompact] JavaScript object or array expected");
            }
            return result;
        };
        jamEngine.compactToExplicit = function (compact, typeKey, valueKey) {
            var explicit = {};
            var typeValue = this.parseCompact(compact);
            explicit[typeKey || "<type>"] = typeValue[0];
            explicit[valueKey || "<value>"] = typeValue[1];
            return explicit;
        };
        jamEngine.buildCompact = function (type, value) {
            var compact;
            if (typeof type === 'string') {
                if (this.parseFriendly) {
                    compact = [type, value];
                } else {
                    compact = {};
                    compact[type] = value;
                }
            } else {
                throw new Error("\n[jamEngine.buildCompact] String expected");
            }
            return compact;
        };
        jamEngine.explicitToCompact = function (explicit, typeKey, valueKey) {
            var compact;
            if (explicit.constructor === Object) {
                compact = this.buildCompact(explicit[typeKey || "<type>"], explicit[valueKey || "<value>"]);
            } else {
                throw new Error("\n[jamEngine.explicitToCompact] JavaScript object expected");
            }
            return compact;
        };
        for (var charIdStr in conflictingStringIdStrs) {
            if (conflictingStringIdStrs.hasOwnProperty(charIdStr)) {
                var stringIdStrs = conflictingStringIdStrs[charIdStr];
                for (var index = stringIdStrs.length - 1; index >= 0; index--) {
                    var stringIdStr = stringIdStrs[index];
                    if (!(app.charIDToTypeID(charIdStr.substring(1, 5)) === app.stringIDToTypeID(stringIdStr))) {
                        stringIdStrs.splice(index, 1);
                    }
                }
                if (stringIdStrs.length < 2) {
                    delete conflictingStringIdStrs[charIdStr];
                }
            }
        }
        for (var charIdStr in contextRules) {
            if (contextRules.hasOwnProperty(charIdStr)) {
                if (charIdStr in conflictingStringIdStrs) {
                    var rule = contextRules[charIdStr];
                    for (var kind in rule) {
                        if (rule.hasOwnProperty(kind)) {
                            switch (kind) {
                                case "<class>":
                                case "<event>":
                                case "<enumType>":
                                case "<enumValue>":
                                case "<key>":
                                case "<unknown>":
                                    if (app.charIDToTypeID(charIdStr.substring(1, 5)) != app.stringIDToTypeID(rule[kind])) {
                                        throw new Error("\n[jamEngine] " + "\"" + charIdStr + "\" and \"" + rule[kind] + "\" are not equivalent ID strings");
                                    }
                                    break;
                                case "<classKey>":
                                case "<eventKey>":
                                case "<typeValue>":
                                    for (var parent in rule[kind]) {
                                        if (rule[kind].hasOwnProperty(parent)) {
                                            if (app.charIDToTypeID(charIdStr.substring(1, 5)) != app.stringIDToTypeID(rule[kind][parent])) {
                                                throw new Error("\n[jamEngine] " + "\"" + charIdStr + "\" and \"" + rule[kind][parent] + "\" are not equivalent ID strings");
                                            }
                                        }
                                    }
                                    break;
                            }
                        }
                    }
                } else {
                    delete contextRules[charIdStr];
                }
            }
        }
    }());
}
// jamJSON.jsxinc v3.6 (minified)
if (!this.jamJSON) {
    this.jamJSON = {};
    (function () {
        var state;
        var stack;
        var container;
        var key;
        var value;
        var escapes = {
            '\\': '\\',
            '"': '"',
            '/': '/',
            't': '\t',
            'n': '\n',
            'r': '\r',
            'f': '\f',
            'b': '\b'
        };
        var action = {
            '{': {
                go: function () {
                    stack.push({
                        state: 'ok'
                    });
                    container = {};
                    state = 'firstokey';
                },
                ovalue: function () {
                    stack.push({
                        container: container,
                        state: 'ocomma',
                        key: key
                    });
                    container = {};
                    state = 'firstokey';
                },
                firstavalue: function () {
                    stack.push({
                        container: container,
                        state: 'acomma'
                    });
                    container = {};
                    state = 'firstokey';
                },
                avalue: function () {
                    stack.push({
                        container: container,
                        state: 'acomma'
                    });
                    container = {};
                    state = 'firstokey';
                }
            },
            '}': {
                firstokey: function () {
                    var pop = stack.pop();
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                },
                ocomma: function () {
                    var pop = stack.pop();
                    container[key] = value;
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                }
            },
            '[': {
                go: function () {
                    stack.push({
                        state: 'ok'
                    });
                    container = [];
                    state = 'firstavalue';
                },
                ovalue: function () {
                    stack.push({
                        container: container,
                        state: 'ocomma',
                        key: key
                    });
                    container = [];
                    state = 'firstavalue';
                },
                firstavalue: function () {
                    stack.push({
                        container: container,
                        state: 'acomma'
                    });
                    container = [];
                    state = 'firstavalue';
                },
                avalue: function () {
                    stack.push({
                        container: container,
                        state: 'acomma'
                    });
                    container = [];
                    state = 'firstavalue';
                }
            },
            ']': {
                firstavalue: function () {
                    var pop = stack.pop();
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                },
                acomma: function () {
                    var pop = stack.pop();
                    container.push(value);
                    value = container;
                    container = pop.container;
                    key = pop.key;
                    state = pop.state;
                }
            },
            ':': {
                colon: function () {
                    if (container.hasOwnProperty(key)) {
                        throw new SyntaxError('\n[jamJSON.parse] Duplicate key: "' + key + '"');
                    }
                    state = 'ovalue';
                }
            },
            ',': {
                ocomma: function () {
                    container[key] = value;
                    state = 'okey';
                },
                acomma: function () {
                    container.push(value);
                    state = 'avalue';
                }
            },
            'true': {
                go: function () {
                    value = true;
                    state = 'ok';
                },
                ovalue: function () {
                    value = true;
                    state = 'ocomma';
                },
                firstavalue: function () {
                    value = true;
                    state = 'acomma';
                },
                avalue: function () {
                    value = true;
                    state = 'acomma';
                }
            },
            'false': {
                go: function () {
                    value = false;
                    state = 'ok';
                },
                ovalue: function () {
                    value = false;
                    state = 'ocomma';
                },
                firstavalue: function () {
                    value = false;
                    state = 'acomma';
                },
                avalue: function () {
                    value = false;
                    state = 'acomma';
                }
            },
            'null': {
                go: function () {
                    value = null;
                    state = 'ok';
                },
                ovalue: function () {
                    value = null;
                    state = 'ocomma';
                },
                firstavalue: function () {
                    value = null;
                    state = 'acomma';
                },
                avalue: function () {
                    value = null;
                    state = 'acomma';
                }
            }
        };
        var number = {
            go: function () {
                state = 'ok';
            },
            ovalue: function () {
                state = 'ocomma';
            },
            firstavalue: function () {
                state = 'acomma';
            },
            avalue: function () {
                state = 'acomma';
            }
        };
        var string = {
            go: function () {
                state = 'ok';
            },
            firstokey: function () {
                key = value;
                state = 'colon';
            },
            okey: function () {
                key = value;
                state = 'colon';
            },
            ovalue: function () {
                state = 'ocomma';
            },
            firstavalue: function () {
                state = 'acomma';
            },
            avalue: function () {
                state = 'acomma';
            }
        };
        var commentFunc = function () {
        };

        function debackslashify(text) {
            return text.replace(/\\(?:u(.{4})|([^u]))/g, function (a, b, c) {
                return (b) ? String.fromCharCode(parseInt(b, 16)) : escapes[c];
            });
        }

        jamJSON.parse = function (text, validate, allowComments) {
            if (validate) {
                var tx = /^[\x20\t\n\r]*(?:([,:\[\]{}]|true|false|null)|(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?)|"((?:[^\r\n\t\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;
                var txc = /^[\x20\t\n\r]*(?:(\/(?:\/.*|\*(?:.|[\r\n])*?\*\/))|([,:\[\]{}]|true|false|null)|(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+\-]?[0-9]+)?)|"((?:[^\r\n\t\\\"]|\\(?:["\\\/trnfb]|u[0-9a-fA-F]{4}))*)")/;
                var r;
                var i;
                var actionFunc;
                state = 'go';
                stack = [];
                try {
                    while (true) {
                        i = (allowComments) ? 1 : 0;
                        r = (allowComments) ? txc.exec(text) : tx.exec(text);
                        if (!r) {
                            break;
                        }
                        if (allowComments && r[1]) {
                            actionFunc = commentFunc;
                        } else if (r[i + 1]) {
                            actionFunc = action[r[i + 1]][state];
                        } else if (r[i + 2]) {
                            value = +r[i + 2];
                            actionFunc = number[state];
                        } else {
                            value = debackslashify(r[i + 3]);
                            actionFunc = string[state];
                        }
                        if (actionFunc) {
                            actionFunc();
                            text = text.slice(r[0].length);
                        } else {
                            break;
                        }
                    }
                } catch (e) {
                    state = e;
                }
                if (state !== 'ok' || /[^\x20\t\n\r]/.test(text)) {
                    throw state instanceof SyntaxError ? state : new SyntaxError('\n[jamJSON.parse] Invalid JSON');
                }
                return value;
            } else {
                return eval('(' + text + ')');
            }
        };
        var escapable = /[\\\"\x00-\x1F\x7F-\x9F\u00AD\u0600-\u0604\u070F\u17B4\u17B5\u200C-\u200F\u2028-\u202F\u2060-\u206F\uFEFF\uFFF0-\uFFFF]/g;
        var meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        };
        var gap;
        var indent;
        var prefixIndent;

        function quote(string) {
            escapable.lastIndex = 0;
            return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return (typeof c === 'string') ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16).toUpperCase()).slice(-4);
            }) + '"' : '"' + string + '"';
        }

        function str(value) {
            var i;
            var k;
            var v;
            var mind = gap;
            var partial;
            switch (typeof value) {
                case 'string':
                    return quote(value);
                case 'number':
                    return isFinite(value) ? String(value) : 'null';
                case 'boolean':
                case 'null':
                    return String(value);
                case 'object':
                    if (!value) {
                        return 'null';
                    }
                    gap += indent;
                    partial = [];
                    if (value.constructor === Array) {
                        for (i = 0; i < value.length; i++) {
                            partial[i] = str(value[i]);
                        }
                        v = (partial.length === 0) ? (gap ? '[\n' + prefixIndent + mind + ']' : '[ ]') : (gap ? '[\n' + prefixIndent + gap + partial.join(',\n' + prefixIndent + gap) + '\n' + prefixIndent + mind + ']' : '[ ' + partial.join(', ') + ' ]');
                        gap = mind;
                        return v;
                    } else {
                        for (k in value) {
                            if (value.hasOwnProperty(k)) {
                                v = str(value[k]);
                                if (v) {
                                    partial.push(quote(k) + (gap && ((v.charAt(0) === '{') || (v.charAt(0) === '[')) ? ':\n' + prefixIndent + gap : ': ') + v);
                                }
                            }
                        }
                        v = (partial.length === 0) ? (gap ? '{\n' + prefixIndent + mind + '}' : '{ }') : (gap ? '{\n' + prefixIndent + gap + partial.join(',\n' + prefixIndent + gap) + '\n' + prefixIndent + mind + '}' : '{ ' + partial.join(', ') + ' }');
                        gap = mind;
                        return v;
                    }
                default:
                    throw new SyntaxError("\n[jamJSON.stringify] Invalid JSON");
            }
        }

        jamJSON.stringify = function (value, space, prefix) {
            var i;
            gap = '';
            indent = '';
            prefixIndent = '';
            if (typeof space === 'number') {
                for (i = 0; i < space; i++) {
                    indent += ' ';
                }
            } else if (typeof space === 'string') {
                indent = space;
            }
            if (typeof prefix === 'number') {
                for (i = 0; i < prefix; i++) {
                    prefixIndent += ' ';
                }
            } else if (typeof prefix === 'string') {
                prefixIndent = prefix;
            }
            return prefixIndent + str(value);
        };
    }());
}
// jamStyles.jsxinc v3.6 (minified)
if (!this.jamStyles) {
    this.jamStyles = {};
    (function () {
        jamStyles.isStylesFile = function (file) {
            return (file.type === '8BSL') || file.name.match(/\.asl$/i);
        };
        jamStyles.isStylesPalette = function (file) {
            return File.decode(file.name).match(/^Styles.psp$/i);
        };
        jamStyles.toLayerEffectsObject = function (layerEffects) {
            function restoreDesc(desc, hintData) {
                var restoredDesc = {};
                for (var key in desc) {
                    if (desc.hasOwnProperty(key)) {
                        var value = desc[key];
                        var typedValue;
                        var restoredList;
                        switch (key) {
                            case "align":
                            case "antiAlias":
                            case "antialiasGloss":
                            case "continuity":
                            case "dither":
                            case "enabled":
                            case "invert":
                            case "invertTexture":
                            case "layerConceals":
                            case "linked":
                            case "reverse":
                            case "showTransparency":
                            case "useGlobalAngle":
                            case "useShape":
                            case "useTexture":
                            case "vectorColor":
                                typedValue = ["<boolean>", value];
                                break;
                            case "book":
                            case "ID":
                            case "name":
                                typedValue = ["<string>", localize(value)];
                                break;
                            case "bookKey":
                                typedValue = ["<data>", value];
                                break;
                            case "bookID":
                            case "location":
                            case "midpoint":
                            case "randomSeed":
                            case "smoothness":
                                typedValue = ["<integer>", value];
                                break;
                            case "a":
                            case "b":
                            case "black":
                            case "blue":
                            case "brightness":
                            case "cyan":
                            case "gray":
                            case "green":
                            case "interpolation":
                            case "luminance":
                            case "magenta":
                            case "red":
                            case "saturation":
                            case "yellowColor":
                                typedValue = ["<double>", value];
                                break;
                            case "angle":
                            case "hue":
                            case "localLightingAngle":
                            case "localLightingAltitude":
                                typedValue = ["<unitDouble>", ["angleUnit", value]];
                                break;
                            case "chokeMatte":
                            case "highlightOpacity":
                            case "inputRange":
                            case "noise":
                            case "opacity":
                            case "scale":
                            case "shadingNoise":
                            case "shadowOpacity":
                            case "strengthRatio":
                            case "textureDepth":
                                typedValue = ["<unitDouble>", ["percentUnit", value]];
                                break;
                            case "blur":
                            case "distance":
                            case "size":
                            case "softness":
                                typedValue = ["<unitDouble>", ["pixelsUnit", value]];
                                break;
                            case "horizontal":
                            case "vertical":
                                typedValue = (hintData) ? ["<unitDouble>", [hintData, value]] : ["<double>", value];
                                break;
                            case "type":
                                var enumType;
                                switch (value) {
                                    case "linear":
                                    case "radial":
                                    case "angle":
                                    case "reflected":
                                    case "diamond":
                                    case "shapeburst":
                                        enumType = "gradientType";
                                        break;
                                    case "foregroundColor":
                                    case "backgroundColor":
                                    case "userStop":
                                        enumType = "colorStopType";
                                        break;
                                }
                                typedValue = ["<enumerated>", [enumType, value]];
                                break;
                            case "colorSpace":
                                typedValue = ["<enumerated>", ["colorSpace", value]];
                                break;
                            case "gradientForm":
                                typedValue = ["<enumerated>", ["gradientForm", value]];
                                break;
                            case "paintType":
                                typedValue = ["<enumerated>", ["frameFill", value]];
                                break;
                            case "bevelDirection":
                                typedValue = ["<enumerated>", ["bevelEmbossStampStyle", value]];
                                break;
                            case "bevelStyle":
                                typedValue = ["<enumerated>", ["bevelEmbossStyle", value]];
                                break;
                            case "bevelTechnique":
                                typedValue = ["<enumerated>", ["bevelTechnique", value]];
                                break;
                            case "glowTechnique":
                                typedValue = ["<enumerated>", ["matteTechnique", value]];
                                break;
                            case "innerGlowSource":
                                typedValue = ["<enumerated>", ["innerGlowSourceType", value]];
                                break;
                            case "style":
                                typedValue = ["<enumerated>", ["frameStyle", value]];
                                break;
                            case "highlightMode":
                            case "mode":
                            case "shadowMode":
                                typedValue = ["<enumerated>", ["blendMode", value]];
                                break;
                            case "bevelEmboss":
                            case "chromeFX":
                            case "dropShadow":
                            case "frameFX":
                            case "gradientFill":
                            case "innerGlow":
                            case "innerShadow":
                            case "outerGlow":
                            case "pattern":
                            case "patternFill":
                            case "solidFill":
                                typedValue = ["<object>", [key, restoreDesc(value)]];
                                break;
                            case "color":
                            case "highlightColor":
                            case "shadowColor":
                                var colorClass;
                                if ((("book" in value) && ("name" in value)) || (("bookID" in value) && ("bookKey" in value))) {
                                    colorClass = "bookColor";
                                } else if (("cyan" in value) && ("magenta" in value) && ("yellowColor" in value) && ("black" in value)) {
                                    colorClass = "CMYKColorClass";
                                } else if ("gray" in value) {
                                    colorClass = "grayscale";
                                } else if (("hue" in value) && ("saturation" in value) && ("brightness" in value)) {
                                    colorClass = "HSBColorClass";
                                } else if (("luminance" in value) && ("a" in value) && ("b" in value)) {
                                    colorClass = "labColor";
                                } else if (("red" in value) && ("green" in value) && ("blue" in value)) {
                                    colorClass = "RGBColor";
                                }
                                typedValue = ["<object>", [colorClass, restoreDesc(value)]];
                                break;
                            case "gradient":
                                typedValue = ["<object>", ["gradientClassEvent", restoreDesc(value)]];
                                break;
                            case "mappingShape":
                            case "transparencyShape":
                                typedValue = ["<object>", ["shapingCurve", restoreDesc(value)]];
                                break;
                            case "offset":
                                typedValue = ["<object>", ["point", restoreDesc(value, "percentUnit")]];
                                break;
                            case "phase":
                                typedValue = ["<object>", ["point", restoreDesc(value)]];
                                break;
                            case "minimum":
                            case "maximum":
                                restoredList = [];
                                for (var i = 0; i < value.length; i++) {
                                    restoredList.push(["<integer>", value[i]]);
                                }
                                typedValue = ["<list>", restoredList];
                                break;
                            case "colors":
                                restoredList = [];
                                for (var i = 0; i < value.length; i++) {
                                    restoredList.push(["<object>", ["colorStop", restoreDesc(value[i])]]);
                                }
                                typedValue = ["<list>", restoredList];
                                break;
                            case "transparency":
                                restoredList = [];
                                for (var i = 0; i < value.length; i++) {
                                    restoredList.push(["<object>", ["transparencyStop", restoreDesc(value[i])]]);
                                }
                                typedValue = ["<list>", restoredList];
                                break;
                            case "curve":
                                restoredList = [];
                                for (var i = 0; i < value.length; i++) {
                                    restoredList.push(["<object>", ["curvePoint", restoreDesc(value[i])]]);
                                }
                                typedValue = ["<list>", restoredList];
                                break;
                            case "layerEffects":
                                typedValue = ["<object>", ["layerEffects", restoreDesc(value)]];
                                break;
                            default:
                                typedValue = null;
                                break;
                        }
                        if (typedValue) {
                            restoredDesc[key] = typedValue;
                        }
                    }
                }
                return restoredDesc;
            }

            return restoreDesc({
                "layerEffects": layerEffects
            })["layerEffects"];
        };
        jamStyles.fromLayerEffectsObject = function (layerEffectsObject) {
            return jamEngine.simplifyObject(layerEffectsObject);
        };
        jamStyles.toBlendOptionsObject = function (blendOptions) {
            function restoreDesc(desc) {
                var restoredDesc = {};
                for (var key in desc) {
                    if (desc.hasOwnProperty(key)) {
                        var value = desc[key];
                        var typedValue;
                        var restoredList;
                        switch (key) {
                            case "blendClipped":
                            case "blendInterior":
                            case "transparencyShapesLayer":
                            case "layerMaskAsGlobalMask":
                            case "vectorMaskAsGlobalMask":
                                typedValue = ["<boolean>", value];
                                break;
                            case "mode":
                                typedValue = ["<enumerated>", ["blendMode", value]];
                                break;
                            case "srcBlackMin":
                            case "srcBlackMax":
                            case "srcWhiteMin":
                            case "srcWhiteMax":
                            case "destBlackMin":
                            case "destBlackMax":
                            case "destWhiteMin":
                            case "destWhiteMax":
                                typedValue = ["<integer>", value];
                                break;
                            case "fillOpacity":
                            case "opacity":
                                typedValue = ["<unitDouble>", ["percentUnit", value]];
                                break;
                            case "knockout":
                                typedValue = ["<enumerated>", ["knockout", value]];
                                break;
                            case "channel":
                                typedValue = ["<reference>", [
                                    ["channel", ["<enumerated>", ["channel", value]]]
                                ]];
                                break;
                            case "blendRange":
                                restoredList = [];
                                for (var i = 0; i < value.length; i++) {
                                    restoredList.push(["<object>", ["blendRange", restoreDesc(value[i])]]);
                                }
                                typedValue = ["<list>", restoredList];
                                break;
                            case "channelRestrictions":
                                restoredList = [];
                                for (var i = 0; i < value.length; i++) {
                                    restoredList.push(["<enumerated>", ["channel", value[i]]]);
                                }
                                typedValue = ["<list>", restoredList];
                                break;
                            case "blendOptions":
                                typedValue = ["<object>", ["blendOptions", restoreDesc(value)]];
                                break;
                            default:
                                typedValue = null;
                                break;
                        }
                        if (typedValue) {
                            restoredDesc[key] = typedValue;
                        }
                    }
                }
                return restoredDesc;
            }

            return restoreDesc({
                "blendOptions": blendOptions
            })["blendOptions"];
        };
        jamStyles.fromBlendOptionsObject = function (blendOptionsObject) {
            var replaceChannelHook = function (desc, key, getDefaultValue) {
                var replacedValue = undefined;
                if (key === "channel") {
                    var value = getDefaultValue(desc, key);
                    replacedValue = value[0]["channel"];
                }
                return replacedValue;
            };
            return jamEngine.simplifyObject(blendOptionsObject, replaceChannelHook);
        };
        jamStyles.toDocumentModeObject = function (documentMode) {
            function restoreDesc(desc) {
                var restoredDesc = {};
                for (var key in desc) {
                    if (desc.hasOwnProperty(key)) {
                        var value = desc[key];
                        var typedValue;
                        var restoredList;
                        switch (key) {
                            case "colorSpace":
                                typedValue = ["<enumerated>", ["colorSpace", value]];
                                break;
                            case "depth":
                                typedValue = ["<integer>", value];
                                break;
                            case "documentMode":
                                typedValue = ["<object>", ["documentMode", restoreDesc(value)]];
                                break;
                            default:
                                typedValue = null;
                                break;
                        }
                        if (typedValue) {
                            restoredDesc[key] = typedValue;
                        }
                    }
                }
                return restoredDesc;
            }

            return restoreDesc({
                "documentMode": documentMode
            })["documentMode"];
        };
        jamStyles.fromDocumentModeObject = function (documentModeObject) {
            return jamEngine.simplifyObject(documentModeObject);
        };

        function getDocumentMode() {
            var documentMode = {};
            var saveMeaningfulIds = jamEngine.meaningfulIds;
            var saveParseFriendly = jamEngine.parseFriendly;
            jamEngine.meaningfulIds = true;
            jamEngine.parseFriendly = true;
            var resultDescObj;
            resultDescObj = jamEngine.jsonGet([
                ["property", ["<property>", "mode"]],
                ["document", ["<enumerated>", ["ordinal", "targetEnum"]]]
            ]);
            documentMode["colorSpace"] = resultDescObj["mode"][1][1];
            resultDescObj = jamEngine.jsonGet([
                ["property", ["<property>", "depth"]],
                ["document", ["<enumerated>", ["ordinal", "targetEnum"]]]
            ]);
            documentMode["depth"] = resultDescObj["depth"][1];
            jamEngine.meaningfulIds = saveMeaningfulIds;
            jamEngine.parseFriendly = saveParseFriendly;
            return documentMode;
        }

        function getDocumentResolution() {
            var saveMeaningfulIds = jamEngine.meaningfulIds;
            var saveParseFriendly = jamEngine.parseFriendly;
            jamEngine.meaningfulIds = true;
            jamEngine.parseFriendly = true;
            var resultDescObj = jamEngine.jsonGet([
                ["property", ["<property>", "resolution"]],
                ["document", ["<enumerated>", ["ordinal", "targetEnum"]]]
            ]);
            jamEngine.meaningfulIds = saveMeaningfulIds;
            jamEngine.parseFriendly = saveParseFriendly;
            return resultDescObj["resolution"][1][1];
        }

        jamStyles.setLayerStyle = function (layerStyleObj) {
            if (layerStyleObj && (("blendOptions" in layerStyleObj) || ("layerEffects" in layerStyleObj))) {
                var layerDesc = {};
                if ("blendOptions" in layerStyleObj) {
                    defaultBlendOptionsObj = {
                        "mode": "normal",
                        "opacity": 100,
                        "fillOpacity": 100,
                        "channelRestrictions": [],
                        "knockout": "none",
                        "blendInterior": false,
                        "blendClipped": true,
                        "transparencyShapesLayer": true,
                        "layerMaskAsGlobalMask": false,
                        "vectorMaskAsGlobalMask": false,
                        "blendRange": []
                    };
                    var documentMode = getDocumentMode();
                    var channelRestrictions;
                    var blendRangeChannels;
                    switch (documentMode["colorSpace"]) {
                        case "CMYKColorEnum":
                            channelRestrictions = ["cyan", "magenta", "yellow", "black"];
                            blendRangeChannels = ["gray", "cyan", "magenta", "yellow", "black"];
                            break;
                        case "duotone":
                        case "grayScale":
                            channelRestrictions = ["black"];
                            blendRangeChannels = ["black"];
                            break;
                        case "labColor":
                            channelRestrictions = ["lightness", "a", "b"];
                            blendRangeChannels = ["lightness", "a", "b"];
                            break;
                        case "RGBColor":
                            channelRestrictions = ["red", "green", "blue"];
                            blendRangeChannels = ["gray", "red", "green", "blue"];
                            break;
                    }
                    defaultBlendOptionsObj["channelRestrictions"] = channelRestrictions;
                    for (var i = 0; i < blendRangeChannels.length; i++) {
                        defaultBlendRangeObj = {
                            "channel": blendRangeChannels[i],
                            "srcBlackMin": 0,
                            "srcBlackMax": 0,
                            "srcWhiteMin": 255,
                            "srcWhiteMax": 255,
                            "destBlackMin": 0,
                            "destBlackMax": 0,
                            "destWhiteMin": 255,
                            "destWhiteMax": 255
                        };
                        defaultBlendOptionsObj["blendRange"].push(defaultBlendRangeObj);
                    }
                    var blendOptionsObj = jamUtils.mergeData(layerStyleObj["blendOptions"], defaultBlendOptionsObj);
                    var blendOptionsDesc = this.toBlendOptionsObject(blendOptionsObj)[1][1];
                    for (var key in blendOptionsDesc) {
                        if (blendOptionsDesc.hasOwnProperty(key)) {
                            layerDesc[key] = blendOptionsDesc[key];
                        }
                    }
                }
                var layerEffects;
                if ("layerEffects" in layerStyleObj) {
                    layerEffects = layerStyleObj["layerEffects"];
                    layerDesc["layerEffects"] = this.toLayerEffectsObject(layerEffects);
                }
                jamEngine.jsonPlay("set", {
                    "target": ["<reference>", [
                        ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                    ]],
                    "to": ["<object>", ["layer", layerDesc]]
                });
                if (layerEffects) {
                    if ("scale" in layerEffects) {
                        this.scaleLayerEffects((getDocumentResolution() / 72) / (layerEffects["scale"] / 100) * 100);
                    }
                }
            } else {
                this.clearLayerStyle();
            }
        };

        function getPresetStylesCount() {
            var saveMeaningfulIds = jamEngine.meaningfulIds;
            var saveParseFriendly = jamEngine.parseFriendly;
            jamEngine.meaningfulIds = true;
            jamEngine.parseFriendly = true;
            var resultDescObj = jamEngine.jsonGet([
                ["property", ["<property>", "presetManager"]],
                ["application", ["<enumerated>", ["ordinal", "targetEnum"]]]
            ]);
            var presetManagerArr = resultDescObj["presetManager"][1];
            var presetStylesCount;
            for (var i = 0; i < presetManagerArr.length; i++) {
                var preset = presetManagerArr[i][1];
                if (preset[0] === "styleClass") {
                    presetStylesCount = preset[1]["name"][1].length;
                    break;
                }
            }
            jamEngine.meaningfulIds = saveMeaningfulIds;
            jamEngine.parseFriendly = saveParseFriendly;
            return presetStylesCount;
        }

        function isStyledLayer() {
            var saveMeaningfulIds = jamEngine.meaningfulIds;
            var saveParseFriendly = jamEngine.parseFriendly;
            jamEngine.meaningfulIds = true;
            jamEngine.parseFriendly = true;
            var isLayer = false;
            try {
                var resultDescObj = jamEngine.jsonGet([
                    ["property", ["<property>", "background"]],
                    ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                ]);
                isLayer = !resultDescObj["background"][1];
            } catch (e) {
            }
            var saveMeaningfulIds = jamEngine.meaningfulIds;
            var saveParseFriendly = jamEngine.parseFriendly;
            return isLayer;
        }

        jamStyles.getLayerStyle = function () {
            var layerStyleObj = null;
            if (isStyledLayer()) {
                var presetStylesCountBefore = getPresetStylesCount();
                var date = new Date();
                var tempStyleName = "Temp-Layer-Style-" + date.getTime();
                jamEngine.jsonPlay("make", {
                    "target": ["<reference>", [
                        ["style", ["<class>", null]]
                    ]],
                    "name": ["<string>", tempStyleName],
                    "using": ["<reference>", [
                        ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                    ]],
                    "blendOptions": ["<boolean>", true],
                    "layerEffects": ["<boolean>", true]
                });
                var presetStylesCount = getPresetStylesCount();
                if (presetStylesCount === (presetStylesCountBefore + 1)) {
                    var tempStylesFile = new File(Folder.temp + "/" + tempStyleName + ".asl");
                    jamEngine.jsonPlay("set", {
                        "target": ["<path>", tempStylesFile.fsName],
                        "to": ["<list>", [
                            ["<reference>", [
                                ["style", ["<index>", presetStylesCount]]
                            ]]
                        ]]
                    });
                    jamEngine.jsonPlay("delete", {
                        "target": ["<list>", [
                            ["<reference>", [
                                ["style", ["<index>", presetStylesCount]]
                            ]]
                        ]]
                    });
                    var tempStylesFileData = this.dataFromStylesFile(tempStylesFile);
                    if (typeof tempStylesFileData === 'string') {
                        //alert(tempStylesFileData + "\n" + "Styles file: “" + decodeURI(tempStylesFile.name) + "”");
                    } else {
                        layerStyleObj = tempStylesFileData["styles"][0];
                        if ("name" in layerStyleObj) {
                            delete layerStyleObj["name"];
                        }
                        if ("ID" in layerStyleObj) {
                            delete layerStyleObj["ID"];
                        }
                        if ("documentMode" in layerStyleObj) {
                            delete layerStyleObj["documentMode"];
                        }
                        if ("layerEffects" in layerStyleObj) {
                            var layerEffects = layerStyleObj["layerEffects"];
                            if ("masterFXSwitch" in layerEffects) {
                                delete layerEffects["masterFXSwitch"];
                            }
                        }
                    }
                    if (arguments.length > 0) {
                        var extraInfo = arguments[0];
                        if (extraInfo && (extraInfo.constructor === Object)) {
                            if ("patterns" in extraInfo) {
                                var tempStylesFilePatterns = this.patternsFromStylesFile(tempStylesFile);
                                if (typeof tempStylesFilePatterns === 'string') {
                                    //alert(tempStylesFilePatterns + "\n" + "Styles file: “" + decodeURI(tempStylesFile.name) + "”");
                                } else {
                                    extraInfo["patterns"] = tempStylesFilePatterns;
                                }
                            }
                        }
                    }
                    tempStylesFile.remove();
                }
            }
            return layerStyleObj;
        };


        jamStyles.copyLayerStyle = function () {
            try {
                jamEngine.jsonPlay("copyEffects", null);
            } catch (e) {
            }
        };
        jamStyles.pasteLayerStyle = function () {
            try {
                jamEngine.jsonPlay("pasteEffects", {});
            } catch (e) {
            }
        };
        jamStyles.clearLayerStyle = function () {
            try {
                jamEngine.jsonPlay("disableLayerStyle", {
                    "target": ["<reference>", [
                        ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                    ]]
                });
            } catch (e) {
            }
        };
        jamStyles.applyLayerStyle = function (styleName, merge) {
            var descriptor = {
                "target": ["<reference>", [
                    ["style", ["<name>", styleName]]
                ]],
                "to": ["<reference>", [
                    ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                ]]
            };
            if ((typeof merge !== 'undefined') && merge) {
                descriptor["merge"] = ["<boolean>", merge];
            }
            jamEngine.jsonPlay("applyStyle", descriptor);
        };
        jamStyles.scaleLayerEffects = function (scale) {
            jamEngine.jsonPlay("scaleEffectsEvent", {
                "scale": ["<unitDouble>", ["percentUnit", scale]]
            });
        };
        jamStyles.removeLayerEffect = function (effect) {
            try {
                jamEngine.jsonPlay("disableSingleFX", {
                    "target": ["<reference>", [
                        [effect, ["<class>", null]],
                        ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                    ]]
                });
            } catch (e) {
            }
        };
        jamStyles.removeLayerEffects = function (effects) {
            for (var i = 0; i < effects.length; i++) {
                this.removeLayerEffect(effects[i]);
            }
        };
        jamStyles.removeAllLayerEffects = function () {
            try {
                jamEngine.jsonPlay("disableLayerFX", {
                    "target": ["<reference>", [
                        ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                    ]]
                });
            } catch (e) {
            }
        };
        jamStyles.showHideLayerEffects = function (effects, show) {
            var references = [];
            for (var i = 0; i < effects.length; i++) {
                references.push(["<reference>", [
                    [effects[i],
                        ["<class>", null]
                    ],
                    ["layer", ["<enumerated>", ["ordinal", "targetEnum"]]]
                ]]);
            }
            try {
                jamEngine.jsonPlay((show) ? "show" : "hide", {
                    "target": ["<list>", references]
                }, DialogModes.NO);
            } catch (e) {
            }
        };
        jamStyles.showHideLayerEffect = function (effect, show) {
            this.showHideLayerEffects([effect], show);
        };
        jamStyles.showHideAllLayerEffects = function (show) {
            this.showHideLayerEffects(["layerEffects"], show);
        };
        jamStyles.showHideAllDocumentEffects = function (show) {
            jamEngine.jsonPlay("set", {
                "target": ["<reference>", [
                    ["property", ["<property>", "layerFXVisible"]],
                    ["document", ["<enumerated>", ["ordinal", "targetEnum"]]]
                ]],
                "to": ["<object>", ["layerFXVisible", {
                    "layerFXVisible": ["<boolean>", show || false]
                }]]
            });
        };

        function setGlobalAngle(target, globalLightingAngle, globalAltitude) {
            var globalAngle = {
                "globalLightingAngle": ["<unitDouble>", ["angleUnit", globalLightingAngle]]
            };
            if (typeof globalAltitude !== 'undefined') {
                globalAngle["globalAltitude"] = ["<unitDouble>", ["angleUnit", globalAltitude]];
            }
            jamEngine.jsonPlay("set", {
                "target": ["<reference>", [
                    ["property", ["<property>", "globalAngle"]],
                    [target, ["<enumerated>", ["ordinal", "targetEnum"]]]
                ]],
                "to": ["<object>", ["globalAngle", globalAngle]]
            });
        };
        jamStyles.setApplicationGlobalAngle = function (globalLightingAngle, globalAltitude) {
            setGlobalAngle("application", globalLightingAngle, globalAltitude);
        };
        jamStyles.setDocumentGlobalAngle = function (globalLightingAngle, globalAltitude) {
            setGlobalAngle("document", globalLightingAngle, globalAltitude);
        };

        function readBEInt(file, byteCount) {
            var bytes = file.read(byteCount);
            var intValue = 0;
            for (var index = 0; index < byteCount; index++) {
                intValue = (intValue << 8) + bytes.charCodeAt(index);
            }
            return intValue;
        }

        function readUnicodeString(file) {
            var unicodeString = "";
            var unicodeLength = readBEInt(file, 4);
            for (var index = 0; index < unicodeLength; index++) {
                var unicodeChar = readBEInt(file, 2);
                if (unicodeChar !== 0) {
                    unicodeString += String.fromCharCode(unicodeChar);
                }
            }
            return unicodeString;
        }

        function readBytes(file, byteCount) {
            return file.read(byteCount);
        }

        function readPascalString(file) {
            var stringLength = readBEInt(file, 1);
            return readBytes(file, stringLength);
        }

        jamStyles.dataFromStylesFile = function (stylesFile, includePatternsInfo) {
            var imageModes = ["Bitmap", "Grayscale", "Indexed", "RGB", "CMYK", null, null, "Multichannel", "Duotone", "Lab"];
            var file;
            if (typeof stylesFile === 'string') {
                file = new File(stylesFile);
            } else if (stylesFile instanceof File) {
                file = stylesFile;
            } else {
                throw new Error('\n[jamStyles.dataFromStylesFile] Invalid argument');
            }
            var fileData;
            if (file.open("r")) {
                try {
                    file.encoding = 'BINARY';
                    var formatVersion;
                    if (this.isStylesPalette(file)) {
                        formatVersion = 2;
                    } else if (this.isStylesFile(file)) {
                        formatVersion = readBEInt(file, 2);
                    }
                    if (formatVersion === 2) {
                        var magicNumber = file.read(4);
                        if (magicNumber === '8BSL') {
                            var subVersion = readBEInt(file, 2);
                            if (subVersion === 3) {
                                var patternsLength = readBEInt(file, 4);
                                var patternsEnd = file.tell() + patternsLength;
                                if (includePatternsInfo) {
                                    var patterns = [];
                                    while (file.tell() < patternsEnd) {
                                        var pattern = {};
                                        var patternLength = readBEInt(file, 4);
                                        var patternEnd = file.tell() + patternLength;
                                        var patternVersion = readBEInt(file, 4);
                                        pattern["version"] = patternVersion;
                                        if (patternVersion === 1) {
                                            pattern["imageMode"] = imageModes[readBEInt(file, 4)];
                                            pattern["height"] = readBEInt(file, 2);
                                            pattern["width"] = readBEInt(file, 2);
                                            pattern["name"] = readUnicodeString(file);
                                            pattern["ID"] = readPascalString(file);
                                        } else {
                                            pattern["error"] = "Unsupported version";
                                        }
                                        patterns.push(pattern);
                                        file.seek(patternEnd + ((4 - (patternLength % 4)) % 4), 0);
                                    }
                                }
                                file.seek(patternsEnd, 0);
                                var saveMeaningfulIds = jamEngine.meaningfulIds;
                                var saveParseFriendly = jamEngine.parseFriendly;
                                jamEngine.meaningfulIds = true;
                                jamEngine.parseFriendly = true;
                                var actionDescriptor;
                                var jsonDesc;
                                var styles = [];
                                var styleCount = readBEInt(file, 4);
                                for (var i = 0; i < styleCount; i++) {
                                    var style = {};
                                    var styleLength = readBEInt(file, 4);
                                    var styleEnd = file.tell() + styleLength;
                                    actionDescriptor = jamActions.readActionDescriptor(file);
                                    jsonDesc = jamEngine.classIdAndActionDescriptorToJson(0, actionDescriptor)["<descriptor>"];
                                    style["name"] = jsonDesc["name"][1];
                                    style["ID"] = jsonDesc["ID"][1];
                                    actionDescriptor = jamActions.readActionDescriptor(file);
                                    jsonDesc = jamEngine.classIdAndActionDescriptorToJson(0, actionDescriptor)["<descriptor>"];
                                    if ("documentMode" in jsonDesc) {
                                        style["documentMode"] = this.fromDocumentModeObject(jsonDesc["documentMode"]);
                                    }
                                    if ("blendOptions" in jsonDesc) {
                                        style["blendOptions"] = this.fromBlendOptionsObject(jsonDesc["blendOptions"]);
                                    }
                                    if ("layerEffects" in jsonDesc) {
                                        style["layerEffects"] = this.fromLayerEffectsObject(jsonDesc["layerEffects"]);
                                    }
                                    styles.push(style);
                                    file.seek(styleEnd, 0);
                                }
                                jamEngine.meaningfulIds = saveMeaningfulIds;
                                jamEngine.parseFriendly = saveParseFriendly;
                                fileData = {};
                                if (includePatternsInfo) {
                                    fileData["patterns"] = patterns;
                                }
                                fileData["styles"] = styles;
                            } else {
                                throw new Error("Unrecognized styles file format! Sub-version: " + subVersion);
                            }
                        } else {
                            throw new Error("Unrecognized styles file format! Magic number: " + magicNumber);
                        }
                    } else {
                        throw new Error("Unrecognized styles file format! Format version: " + formatVersion);
                    }
                } catch (e) {
                    fileData = e.message;
                } finally {
                    file.close();
                }
            } else {
                fileData = "Cannot open file";
            }
            return fileData;
        };
        jamStyles.patternsFromStylesFile = function (stylesFile) {
            var file;
            if (typeof stylesFile === 'string') {
                file = new File(stylesFile);
            } else if (stylesFile instanceof File) {
                file = stylesFile;
            } else {
                throw new Error('\n[jamStyles.patternsFromStylesFile] Invalid argument');
            }
            var patternsData;
            if (file.open("r")) {
                try {
                    file.encoding = 'BINARY';
                    var formatVersion;
                    if (this.isStylesPalette(file)) {
                        formatVersion = 2;
                    } else if (this.isStylesFile(file)) {
                        formatVersion = readBEInt(file, 2);
                    }
                    if (formatVersion === 2) {
                        var magicNumber = file.read(4);
                        if (magicNumber === '8BSL') {
                            var subVersion = readBEInt(file, 2);
                            if (subVersion === 3) {
                                var patternsLength = readBEInt(file, 4);
                                var patternsEnd = file.tell() + patternsLength;
                                var patternsData = [];
                                while (file.tell() < patternsEnd) {
                                    var patternLength = readBEInt(file, 4);
                                    patternsData.push(readBytes(file, patternLength));
                                    file.seek((4 - (patternLength % 4)) % 4, 1);
                                }
                            } else {
                                throw new Error("Unrecognized styles file format! Sub-version: " + subVersion);
                            }
                        } else {
                            throw new Error("Unrecognized styles file format! Magic number: " + magicNumber);
                        }
                    } else {
                        throw new Error("Unrecognized styles file format! Format version: " + formatVersion);
                    }
                } catch (e) {
                    patternsData = e.message;
                } finally {
                    file.close();
                }
            } else {
                patternsData = "Cannot open file";
            }
            return patternsData;
        };
        jamStyles.patternsFileFromPatterns = function (patternsFile, patternsData) {
            var file;
            if (typeof patternsFile === 'string') {
                file = new File(patternsFile);
            } else if (patternsFile instanceof File) {
                file = patternsFile;
            } else {
                throw new Error('\n[jamStyles.patternsFileFromPatterns] Invalid argument');
            }
            if (file.open('w', '8BPT', '8BIM')) {
                file.encoding = "BINARY";
                file.write('8BPT');
                file.write('\x00\x01');
                var count = patternsData.length;
                file.write(String.fromCharCode((count >> 24) & 0xFF, (count >> 16) & 0xFF, (count >> 8) & 0xFF, count & 0xFF));
                for (var index = 0; index < count; index++) {
                    file.write(patternsData[index]);
                }
                file.close();
            }
        };
    }());
}
// jamUtils.jsxinc v3.6 (minified)
if (!this.jamUtils) {
    this.jamUtils = {};
    (function () {
        jamUtils.toDistanceUnit = function (amount, amountBasePerInch) {
            return (amount / amountBasePerInch) * 72.0;
        };
        jamUtils.fromDistanceUnit = function (amount, amountBasePerInch) {
            return (amount / 72.0) * amountBasePerInch;
        };
        jamUtils.fontExists = function (fontPostScriptName) {
            var useDOM = true;
            var found = false;
            if (useDOM) {
                for (var i = 0; i < app.fonts.length; i++) {
                    if (app.fonts[i].postScriptName === fontPostScriptName) {
                        found = true;
                        break;
                    }
                }
            } else {
                var saveMeaningfulIds = jamEngine.meaningfulIds;
                var saveParseFriendly = jamEngine.parseFriendly;
                jamEngine.meaningfulIds = true;
                jamEngine.parseFriendly = true;
                var resultDescriptorObj = jamEngine.jsonGet([
                    ["property", ["<property>", "fontList"]],
                    ["application", ["<enumerated>", ["ordinal", "targetEnum"]]]
                ]);
                var fontPostScriptNameArr = resultDescriptorObj["fontList"][1][1]["fontPostScriptName"][1];
                for (var i = 0; i < fontPostScriptNameArr.length; i++) {
                    if (fontPostScriptNameArr[i][1] === fontPostScriptName) {
                        found = true;
                        break;
                    }
                }
                jamEngine.meaningfulIds = saveMeaningfulIds;
                jamEngine.parseFriendly = saveParseFriendly;
            }
            return found;
        };
        jamUtils.loadAction = function (action, actionSet, actionsFilePath) {
            try {
                jamEngine.jsonGet([
                    ["action", ["<name>", action]],
                    ["actionSet", ["<name>", actionSet]]
                ]);
                var found = true;
            } catch (e) {
                var found = false;
            }
            if (!found) {
                jamEngine.jsonPlay("open", {
                    "target": ["<path>", actionsFilePath]
                });
            }
        };
        jamUtils.loadActionSet = function (actionSet, actionsFilePath) {
            try {
                jamEngine.jsonGet([
                    ["actionSet", ["<name>", actionSet]]
                ]);
                var found = true;
            } catch (e) {
                var found = false;
            }
            if (!found) {
                jamEngine.jsonPlay("open", {
                    "target": ["<path>", actionsFilePath]
                });
            }
        };
        jamUtils.loadPreset = function (presetProperty, presetName, presetFilePath) {
            var useDOM = false;
            var useOpen = true;
            var classes = {
                "brush": "brush",
                "colors": "color",
                "gradientClassEvent": "gradientClassEvent",
                "style": "styleClass",
                "pattern": "'PttR'",
                "shapingCurve": "shapingCurve",
                "customShape": "customShape",
                "toolPreset": "toolPreset"
            };
            var presetClass = classes[presetProperty];
            var saveMeaningfulIds = jamEngine.meaningfulIds;
            var saveParseFriendly = jamEngine.parseFriendly;
            jamEngine.meaningfulIds = true;
            jamEngine.parseFriendly = true;
            var found = false;
            var resultDescriptorObj = jamEngine.jsonGet([
                ["property", ["<property>", "presetManager"]],
                ["application", ["<enumerated>", ["ordinal", "targetEnum"]]]
            ]);
            var presetManagerArr = resultDescriptorObj["presetManager"][1];
            for (var i = 0; i < presetManagerArr.length; i++) {
                var presets = presetManagerArr[i][1];
                if (presets[0] === presetClass) {
                    var presetsArr = presets[1]["name"][1];
                    for (var j = 0; j < presetsArr.length; j++) {
                        if (presetsArr[j][1] === presetName) {
                            found = true;
                            break;
                        }
                    }
                    break;
                }
            }
            if (!found) {
                if (useDOM) {
                    app.load(new File(presetFilePath));
                } else if (useOpen) {
                    jamEngine.jsonPlay("open", {
                        "target": ["<path>", presetFilePath]
                    });
                } else {
                    jamEngine.jsonPlay("set", {
                        "target": ["<reference>", [
                            ["property", ["<property>", presetProperty]],
                            ["application", ["<enumerated>", ["ordinal", "targetEnum"]]]
                        ]],
                        "to": ["<path>", presetFilePath],
                        "append": ["<boolean>", true]
                    });
                }
            }
            jamEngine.meaningfulIds = saveMeaningfulIds;
            jamEngine.parseFriendly = saveParseFriendly;
        };

        function getFileObject(file) {
            var fileObject;
            if (file instanceof File) {
                fileObject = file;
            } else if (typeof file === 'string') {
                fileObject = new File(file);
            } else {
                throw new Error('\n[jamUtils getFileObject] Invalid argument');
            }
            return fileObject;
        }

        jamUtils.readTextFile = function (textFile) {
            var text = null;
            var file = getFileObject(textFile);
            if (file.open("r")) {
                text = file.read();
                file.close();
            }
            return text;
        };
        jamUtils.readJsonFile = function (jsonFile) {
            return jamJSON.parse(this.readTextFile(jsonFile), true);
        };
        jamUtils.writeTextFile = function (textFile, text) {
            var file = getFileObject(textFile);
            if (file.open('w', 'TEXT')) {
                file.encoding = 'UTF-8';
                file.lineFeed = 'unix';
                file.write('\uFEFF');
                file.write(text);
                file.close();
            }
        };
        jamUtils.writeJsonFile = function (jsonFile, data, space) {
            this.writeTextFile(jsonFile, jamJSON.stringify(data, space));
        };
        jamUtils.cloneData = function (data) {
            var clone;
            if (data === null) {
                clone = data;
            } else if (data.constructor === Object) {
                clone = {};
                for (var k in data) {
                    if (data.hasOwnProperty(k)) {
                        clone[k] = this.cloneData(data[k]);
                    }
                }
            } else if (data.constructor === Array) {
                clone = [];
                for (var i = 0; i < data.length; i++) {
                    clone.push(this.cloneData(data[i]));
                }
            } else {
                clone = data;
            }
            return clone;
        };
        jamUtils.mergeData = function (data, defaultData) {
            for (var k in defaultData) {
                if (defaultData.hasOwnProperty(k)) {
                    if (k in data) {
                        if ((defaultData[k] !== null) && (defaultData[k].constructor === Object)) {
                            data[k] = this.mergeData(data[k], defaultData[k]);
                        }
                    } else {
                        data[k] = this.cloneData(defaultData[k]);
                    }
                }
            }
            return data;
        };
        var jsonCustomOptionsStringKey = "jsonCustomOptions";
        jamUtils.getCustomOptions = function (signature, defaultOptions) {
            var saveMeaningfulIds = jamEngine.meaningfulIds;
            var saveParseFriendly = jamEngine.parseFriendly;
            jamEngine.meaningfulIds = true;
            jamEngine.parseFriendly = false;
            try {
                var resultObj = jamEngine.classIdAndActionDescriptorToJson(jamEngine.uniIdStrToId(signature), app.getCustomOptions(signature));
                var customOptions = jamJSON.parse(resultObj["<descriptor>"][jsonCustomOptionsStringKey]["<string>"], true)
            } catch (e) {
                var customOptions = {};
            }
            jamEngine.meaningfulIds = saveMeaningfulIds;
            jamEngine.parseFriendly = saveParseFriendly;
            return this.mergeData(customOptions, defaultOptions);
        };
        jamUtils.putCustomOptions = function (signature, customOptions, persistent) {
            var descriptorObj = {};
            descriptorObj[jsonCustomOptionsStringKey] = ["<string>", jamJSON.stringify(customOptions)];
            app.putCustomOptions(signature, jamEngine.jsonToActionDescriptor(descriptorObj), persistent);
        };
        jamUtils.eraseCustomOptions = function (signature) {
            app.eraseCustomOptions(signature);
        };
        jamUtils.dataToHexaString = function (dataString, lowercase) {
            var hexaDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
            var hexaString = "";
            var length = dataString.length;
            for (var index = 0; index < length; index++) {
                var dataByte = dataString.charCodeAt(index);
                if ((dataByte >= 0x00) && (dataByte <= 0xFF)) {
                    hexaString += hexaDigits[(dataByte & 0xF0) >> 4] + hexaDigits[dataByte & 0x0F];
                } else {
                    throw new Error("\n[jamUtils.dataToHexaString] Invalid data string");
                }
            }
            if (lowercase) {
                hexaString = hexaString.toLowerCase();
            }
            return hexaString;
        };
        jamUtils.hexaToDataString = function (hexaString) {
            var dataString = "";
            var length = hexaString.length;
            if (((length % 2) === 0) && (/^[0-9A-Fa-f]*$/.test(hexaString))) {
                for (var index = 0; index < length; index += 2) {
                    var byteString = hexaString.slice(index, index + 2);
                    dataString += String.fromCharCode(parseInt(byteString, 16));
                }
            } else {
                throw new Error("\n[jamUtils.hexaToDataString] Invalid hexa string");
            }
            return dataString;
        };
    }());
}

//------------------------------------------------------------------------------

var expandTabs = false;

var textPromptString = "Save layer style to JSON file:";
var patternsPromptString = "Save layer effects patterns to file:";

var signature = "json-action-manager-get-layer-style-options";

var defaultOptions = {
    defaultFile: "~/Desktop/layer-style.json",
    defaultPatternsFile: "~/Desktop/layer-style.pat",
    dialogWidth: 768,
    dialogHeight: 1024,
    dialogX: 0,
    dialogY: 0
};

var defaultFile = new File(defaultOptions.defaultFile);
var defaultPatternsFile = new File(defaultOptions.defaultPatternsFile);

//------------------------------------------------------------------------------

function displayDialog(jsonText, patternsData) {
    // Get an available UI font among a list of favorites
    function getAvailableUIFont(fontsArray) {
        // List all fonts available in Photoshop in JSON format
        var fontsObj = {};
        for (var i = 0; i < app.fonts.length; i++) {
            var family = app.fonts[i].family;
            if (!(family in fontsObj)) {
                fontsObj[family] = {};
            }
            fontsObj[family][app.fonts[i].style] = {
                "name": app.fonts[i].name
            };
        }
        var availableFont;
        var fontFamily;
        var fontStyle;
        var fontSize;
        for (var i = 0; i < fontsArray.length; i++) {
            fontFamily = fontsArray[i][0];
            if (fontFamily in fontsObj) {
                fontStyle = fontsArray[i][1];
                if (fontStyle in fontsObj[fontFamily]) {
                    fontSize = fontsArray[i][2];
                    availableFont = ScriptUI.newFont(fontFamily, fontStyle, fontSize)
                    break;
                }
            }
        }
        return availableFont;
    }

    var monospacedFont =
        getAvailableUIFont(
            [
                ["Monaco", "Regular", 12],
                ["Lucida Sans Typewriter", "Regular", 14],
                ["Courier", "Regular", 16],
                ["Courier New", "Regular", 14]
            ]
        );
    defaultFile = new File(customOptions.defaultFile);
    defaultPatternsFile = new File(customOptions.defaultPatternsFile);
    var dialog = new Window('dialog', "Get Layer Style", undefined, {
        resizeable: true
    });
    dialog.orientation = "column";
    dialog.preferredSize.width = customOptions.dialogWidth;
    dialog.preferredSize.height = customOptions.dialogHeight;
    dialog.onResizing = function () {
        this.layout.resize();
    };
    dialog.onShow = function () {
        var x = customOptions.dialogX;
        var y = customOptions.dialogY;
        if ((x !== 0) || (y !== 0)) {
            this.location.x = x;
            this.location.y = y;
        }
        logArea.text = jsonText;
    };
    var codeGroup = dialog.add('group');
    codeGroup.orientation = "column";
    codeGroup.alignment = ["fill", "fill"];
    var logArea = codeGroup.add('edittext', undefined, "", {
        multiline: true,
        readonly: true
    });
    logArea.alignment = ["fill", "fill"];
    logArea.minimumSize = [-1, 64];
    if (monospacedFont) {
        logArea.graphics.font = monospacedFont;
    }
    var actionButtonsGroup = codeGroup.add('group');
    actionButtonsGroup.alignment = ["center", "bottom"];
    actionButtonsGroup.orientation = "column";
    var saveButton = actionButtonsGroup.add('button', undefined, 'Save...');
    saveButton.onClick = function () {
        var textFile = defaultFile.saveDlg(textPromptString);
        if (textFile) {
            jamUtils.writeTextFile(textFile, jsonText);
            defaultFile = textFile;
        }
    };
    var exportTitle = "Export Patterns...";
    var numberStrings = ["Zero", "One", "Two", "Three"];
    if (patternsData.length > 0) {
        exportTitle = "Export " + numberStrings[patternsData.length] + " Pattern" + ((patternsData.length > 1) ? "s" : "") + "..."
    }
    var exportButton = actionButtonsGroup.add('button', undefined, exportTitle);
    exportButton.enabled = (patternsData !== null) && (patternsData.length > 0);
    exportButton.onClick = function () {
        var patternsFile = defaultPatternsFile.saveDlg(patternsPromptString);
        if (patternsFile) {
            jamStyles.patternsFileFromPatterns(patternsFile, patternsData);
            defaultPatternsFile = patternsFile;
        }
    };
    var buttonsGroup = dialog.add('group');
    buttonsGroup.alignment = ["right", "bottom"];
    buttonsGroup.orientation = "row";
    buttonsGroup.alignChildren = "fill";
    var cancelButton = buttonsGroup.add('button', undefined, 'Cancel', {
        name: "cancel"
    });
    cancelButton.onClick = function () {
        dialog.close(false);
    };
    var okButton = buttonsGroup.add('button', undefined, 'OK', {
        name: "ok"
    });
    okButton.onClick = function () {
        customOptions.defaultFile = defaultFile.fsName;
        customOptions.defaultPatternsFile = defaultPatternsFile.fsName;
        customOptions.dialogWidth = dialog.size.width;
        customOptions.dialogHeight = dialog.size.height;
        customOptions.dialogX = dialog.location.x;
        customOptions.dialogY = dialog.location.y;
        dialog.close(true);
    };
    return dialog.show();
}

//------------------------------------------------------------------------------

var appVersion = parseFloat(app.version);
if (appVersion >= 9) // CS2
{
    var extraInfo = {
        "patterns": null
    };
    var layerStyle = jamStyles.getLayerStyle(extraInfo);
    if (layerStyle) {
        var patternsData = extraInfo["patterns"];
        var jsonText = jamJSON.stringify(layerStyle, (expandTabs) ? 4 : '\t');
        if (appVersion == 9) {
            var textFile = defaultFile.saveDlg(textPromptString);
            if (textFile) {
                jamUtils.writeTextFile(textFile, jsonText);
            }
            if ((patternsData !== null) && (patternsData.length > 0)) {
                var patternsFile = defaultPatternsFile.saveDlg(patternsPromptString);
                if (patternsFile) {
                    jamStyles.patternsFileFromPatterns(patternsFile, patternsData);
                }
            }
        } else {
            var customOptions = jamUtils.getCustomOptions(signature, defaultOptions);
            //if (displayDialog(jsonText, patternsData)) {
            //    jamUtils.putCustomOptions(signature, customOptions, true);
            //}
        }
    } else {
        alert("No layer selected.");
    }
} else {
    alert("Sorry, this script requires Photoshop CS2 or later.");
}

//------------------------------------------------------------------------------