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
    var docName = doc.name.match(/([^\.]+)/)[1];
    var targetFolder = new Folder( doc.path + "/" + docName);    
    targetFolder.create();     
    
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
            data.x = layer.bounds[0].value;
            data.y = layer.bounds[1].value;
            data.width = layer.bounds[2].value - data.x;
            data.height = layer.bounds[3].value - data.y;
            putLayerData(output, layer, data);
        }
        return iterateChildren;
    });
   
    var jsonFile = new File(targetFolder + "/data.json");
    jsonFile.open("w");
    jsonFile.writeln(JSON.stringify(output, null, '\t'));
    jsonFile.close();
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
    var textItem = layer.textItem;
    var font = app.fonts.getByName(textItem.font);
    var result = {
        fontFamily: font.family,
        fontWeight: font.style == 'Bold' ? 'bold' : 'normal',
        fontSize: getActiveLayerFontSize(),
        'text-align': justificationMapping[String(textItem.justification)],
        layerStyles: jamStyles.getLayerStyle(layer).layerEffects
    };
    return result;
}

function parseSpriteLayer(layer) {
    var doc = app.activeDocument;

    var initialState = doc.activeHistoryState;
    doc.activeLayer = layer;
    
    var newDocument = app.documents.add( doc.width, doc.height, doc.resolution, "temp", NewDocumentMode.RGB, DocumentFill.TRANSPARENT); 
    newDocument.activeLayer.isBackgroundLayer = false;
    app.activeDocument = doc;
    layer.duplicate(newDocument);
    app.activeDocument = newDocument;
    newDocument.trim(TrimType.TRANSPARENT);
    
    var saveOptions = new PNGSaveOptions();
    saveOptions.compression = 9;

    var imageName = layerFullName(layer);
    var imagePath = targetFolder + "/" + imageName + ".png";
    newDocument.saveAs(new File(imagePath), saveOptions, true);
    newDocument.close(SaveOptions.DONOTSAVECHANGES);

    doc.activeHistoryState = initialState;

    return {path: imagePath};
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