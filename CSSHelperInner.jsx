var justificationMapping = {
    "Justification.CENTER": 'center',
    "Justification.CENTERJUSTIFIED": 'center',
    "Justification.FULLYJUSTIFIED": 'justify',
    "Justification.LEFT": 'left',
    "Justification.LEFTJUSTIFIED": 'left',
    "Justification.RIGHT": 'right',
    "Justification.RIGHTJUSTIFIED": 'right'
}

app.preferences.rulerUnits = Units.PIXELS
app.preferences.typeUnits = TypeUnits.POINTS

var doc = app.activeDocument;
if (doc) {
    var output = {};
    foreachLayerRecursive(doc, function (layer) {
        doc.activeLayer = layer;
        var data;
        var iterateChildren = true;
        if (String(layer.typename) == "LayerSet") {
            if (layer.name.indexOf("button") == 0) {
                data = {type: "button", parameters: parseButton(layer)};
                iterateChildren = false;
            }
        } else {
            if (layer.kind == LayerKind.TEXT) {
                data = { type: 'text', parameters: parseTextLayer(layer)};
            } else {
                data = { type: 'sprite', parameters: parseSpriteLayer(layer)};
            }
        }
        if (!(data === undefined)) {
            putLayerData(output, layer, data);
        }
        return iterateChildren;
    });
    copyTextToClipboard(JSON.stringify(output, null, '\t'));
}

function putLayerData(output, layer, data) {
    var stack = [];
    var currentLayer = layer;
    while (currentLayer.parent && currentLayer.parent.name.indexOf(".psd") < 0) {
        currentLayer = currentLayer.parent;
        stack.push(transformLayerName(currentLayer.name));
    }
    var currentOutput = output;
    for (var i = stack.length - 1; i > -1; i--) {
        if (currentOutput[stack[i]] === undefined) {
            currentOutput[stack[i]] = {};
        }
        currentOutput = currentOutput[stack[i]];
    }
    currentOutput[transformLayerName(layer.name)] = data;
}

function transformLayerName(name) {
    return name.replace(/ /g, '_');
}

function getColorFromObject(obj) {
    var rgbColor = new RGBColor();
    rgbColor.red = obj.red;
    rgbColor.green = obj.green;
    rgbColor.blue = obj.blue;
    return "#" + rgbColor.hexValue.toLowerCase();
}

function objectToString(obj) {
    var result = "";
    if (obj) {
        for (var key in obj) {
            result += '\t' + key + " : " + obj[key] + ";\n";
        }
    }
    return result;
}


function foreachLayerRecursive(doc, action) {
    var iterateChildren = foreachLayer(doc.layerSets, action);
    for (var i = 0; i < doc.layerSets.length; i++) {
        if (iterateChildren[i]) {
            foreachLayerRecursive(doc.layerSets[i], action);
        }
    }
    foreachLayer(doc.artLayers, action);
}

function foreachLayer(layers, action) {
    var iterateChildren = [];
    for (var i = 0; i < layers.length; i++) {
        var iterateThisLayerChildren = action(layers[i]);
        iterateChildren.push(iterateThisLayerChildren);
    }
    return iterateChildren;
}

function layerFullName(layer) {
    var name = transformLayerName(layer.name);
    while (layer.parent && layer.parent.name.indexOf(".psd") < 0) {
        layer = layer.parent;
        name = transformLayerName(layer.name) + "." + name;
    }
    return name;
}

function copyTextToClipboard(text) {
    var folderForTempFiles = Folder.temp.fsName;

    // create a new textfile and put the text into it
    var clipTxtFile = new File(folderForTempFiles + "/ClipBoard.txt");
    clipTxtFile.open('w');
    clipTxtFile.write(text);
//  clipTxtFile.close();

    // use the clip.exe to copy the contents of the textfile to the windows clipboard
    var clipBatFile = new File(folderForTempFiles + "/ClipBoard.bat");
    clipBatFile.open('w');
    clipBatFile.writeln("notepad \"" + folderForTempFiles + "/ClipBoard.txt\"");
    clipBatFile.close();
    clipBatFile.execute();
}

function getActiveLayerFontSize() {
    if (app.version.match(/^\d+/) < 13) return activeDocument.activeLayer.textItem.size;
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
    var desc = executeActionGet(ref).getObjectValue(stringIDToTypeID('textKey'));
    var textSize = desc.getList(stringIDToTypeID('textStyleRange')).getObjectValue(0).getObjectValue(stringIDToTypeID('textStyle')).getDouble(stringIDToTypeID('size'));
    if (desc.hasKey(stringIDToTypeID('transform'))) {
        var mFactor = desc.getObjectValue(stringIDToTypeID('transform')).getUnitDoubleValue(stringIDToTypeID('yy'));
        textSize = (textSize * mFactor).toFixed(2).toString().replace(/0+$/g, '').replace(/\.$/, '');
    }
    return Number(textSize);
};

function parseTextLayer(layer) {
    activeDocument.activeLayer = layer;
    #include "jamActions.js";
    var result = {};
    var textItem = layer.textItem;
    var font = app.fonts.getByName(textItem.font);
    var data = jamStyles.getLayerStyle(layer).layerEffects;
    var outline = data["frameFX"];
    var result = {
        fontFamily: font.family,
        fontWeight: font.style == 'Bold' ? 'bold' : 'normal',
        fontSize: getActiveLayerFontSize(),
        'text-align': justificationMapping[String(textItem.justification)]
    };
    var filter = null;
    if (outline) {
        filter = {};
        filter.type = "glow";
        filter.quality = 3;
        filter.color = getColorFromObject(outline.color);
        filter.alpha = outline.opacity / 100;
        if (outline.size == 1) {
            outline.size = 1.2;
        } else if (outline.size == 2) {
            outline.size = 1.4;
        } else {
            outline.size -= 1;
        }
        filter.blurX = filter.blurY = outline.size;
        filter.strength = 21;
    }
    var solidFill = data["solidFill"];
    if (solidFill) {
        result.alpha = solidFill.opacity / 100;
        result.color = getColorFromObject(solidFill.color);
    }
    if (filter) {
        result.filters = filter;
    }
    return result;
}

function parseSpriteLayer(layer) {
    var doc = app.activeDocument;

    var initialState = doc.activeHistoryState;
    doc.activeLayer = layer;
    doc.resizeCanvas(doc.width * 2, doc.height * 2, AnchorPosition.MIDDLECENTER);
    var quaterWidth = Math.round(doc.width.value / 4);
    var quaterHeight = Math.round(doc.height.value / 4);
    var docPath = activeDocument.path;

    var trimResult = trimLayerToDocument(layer, quaterWidth, quaterHeight);
    var newDocument = trimResult.document;
    var offsetX = trimResult.offsetX;
    var offsetY = trimResult.offsetY;

    var saveOptions = new PNGSaveOptions();
    saveOptions.compression = 9;

    var imageName = layerFullName(layer);
    var imagePath = docPath + "/" + imageName + ".png";
    newDocument.saveAs(new File(imagePath), saveOptions, true);
    newDocument.close(SaveOptions.DONOTSAVECHANGES);

    doc.activeHistoryState = initialState;

    return {path: imagePath, x: offsetX.value, y: offsetY.value };
}

function parseButton(layer) {
    var result = {};
    var states = ["normal", "over", "down", "disabled"];
    for (var i = 0; i < states.length; i++) {
        var state = getChildLayerByName(layer, states[i])
        if (!(state === undefined)) {
            result[states[i]] = parseSpriteLayer(state);
        }
    }
    var label = getChildLayerByName(layer, "label");
    if (!(label === undefined)) {
        result.label = parseTextLayer(label);
    }
    return result;
}

function getChildLayerByName(layer, name){
    for( var i = 0; i < layer.layers.length; i++){
        if( layer.layers[i].name == name){
            return layer.layers[i];
        }
    }
}