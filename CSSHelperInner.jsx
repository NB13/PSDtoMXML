var a = {};

   a["Ё"]="YO";a["Й"]="I";a["Ц"]="TS";a["У"]="U";a["К"]="K";a["Е"]="E";a["Н"]="N";a["Г"]="G";a["Ш"]="SH";a["Щ"]="SCH";a["З"]="Z";a["Х"]="H";a["Ъ"]="'";
   a["ё"]="yo";a["й"]="i";a["ц"]="ts";a["у"]="u";a["к"]="k";a["е"]="e";a["н"]="n";a["г"]="g";a["ш"]="sh";a["щ"]="sch";a["з"]="z";a["х"]="h";a["ъ"]="'";
   a["Ф"]="F";a["Ы"]="I";a["В"]="V";a["А"]="a";a["П"]="P";a["Р"]="R";a["О"]="O";a["Л"]="L";a["Д"]="D";a["Ж"]="ZH";a["Э"]="E";
   a["ф"]="f";a["ы"]="i";a["в"]="v";a["а"]="a";a["п"]="p";a["р"]="r";a["о"]="o";a["л"]="l";a["д"]="d";a["ж"]="zh";a["э"]="e";
   a["Я"]="Ya";a["Ч"]="CH";a["С"]="S";a["М"]="M";a["И"]="I";a["Т"]="T";a["Ь"]="'";a["Б"]="B";a["Ю"]="YU";
   a["я"]="ya";a["ч"]="ch";a["с"]="s";a["м"]="m";a["и"]="i";a["т"]="t";a["ь"]="'";a["б"]="b";a["ю"]="yu";

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
    var output = {items:[]};
    var docName = doc.name.match(/([^\.]+)/)[1];
    var targetFolder = new Folder( doc.path + "/" + docName);    
    targetFolder.create();     
		
    foreachLayerRecursive(doc, function (layer) {
        var data;
        var iterateChildren = false;
		if( layer.visible == true ){
			doc.activeLayer = layer;
			iterateChildren = true;
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
			} else{ 
				putLayerData(output, layer, {});
			}
		}
        return iterateChildren;
    })
   
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
    var currentOutput = output.items;
    for (var i = stack.length - 1; i > -1; i--) {
		for( var j = 0; j < currentOutput.length; j++ ){
			if( currentOutput[j].id == stack[i]  ){
				break;
			}
		}
		if( currentOutput.length > j && currentOutput[j].id == stack[i]  ){
			currentOutput = currentOutput[j].items;
		} else{
			currentOutput.push( {id:stack[i], items:[]});
			currentOutput = currentOutput[currentOutput.length - 1].items;
		}
    }
	currentOutput.push({id:transformLayerName(layer.name), data:data, items:[]});
}

function transformLayerName(name) {
    name = name.replace(/ /g, '_');
    var result = '';
     for(var i = 0; i < name.length; i++) {
        var c = name.charAt(i);
        result += a[c] || c;
    }
    return result;
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

	doc.activeLayer = layer;
	
	if( !layer.isBackgroundLayer){
		layer.rasterize(RasterizeType.ENTIRELAYER);
		rasterizeLayerStyle();
		doc.crop(new Array(0,0,doc.width,doc.height));
	}
	
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

function rasterizeLayerStyle(){
    var idrasterizeLayer = stringIDToTypeID( "rasterizeLayer" );
    var desc5 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var ref4 = new ActionReference();
        var idLyr = charIDToTypeID( "Lyr " );
        var idOrdn = charIDToTypeID( "Ordn" );
        var idTrgt = charIDToTypeID( "Trgt" );
        ref4.putEnumerated( idLyr, idOrdn, idTrgt );
    desc5.putReference( idnull, ref4 );
    var idWhat = charIDToTypeID( "What" );
    var idrasterizeItem = stringIDToTypeID( "rasterizeItem" );
    var idlayerStyle = stringIDToTypeID( "layerStyle" );
    desc5.putEnumerated( idWhat, idrasterizeItem, idlayerStyle );
    executeAction( idrasterizeLayer, desc5, DialogModes.NO );
}