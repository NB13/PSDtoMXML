//Return object keys : document, offsetX, offsetY
function trimLayerToDocument( currentLayer, layerOffsetX, layerOffsetY){ 
    var documentWidth = activeDocument.width;
    var documentHeight = activeDocument.height;
    
    activeDocument.activeLayer = currentLayer;	   
	activeDocument.selection.select(Array(Array(0,0),Array(1,0),Array(1,1), Array(0,1), Array(0,0)));
	activeDocument.selection.fill(app.foregroundColor);
	activeDocument.selection.select(Array(Array(documentWidth.value-1,documentHeight.value-1),Array(documentWidth.value,documentHeight.value-1),Array(documentWidth.value,documentHeight.value), Array(documentWidth.value-1,documentHeight.value), Array(documentWidth.value-1,documentHeight.value-1)));
	activeDocument.selection.fill(app.foregroundColor);
	
    currentLayer.copy();
	var newDocument = documents.add(documentWidth, documentHeight, activeDocument.resolution, "temp");
	newDocument.artLayers[0].isBackgroundLayer = false;
	newDocument.artLayers[0].clear();
	
	newDocument.paste();
	
	newDocument.selection.select(Array(Array(0,0),Array(1,0),Array(1,1), Array(0,1), Array(0,0)));
	newDocument.selection.clear();
	newDocument.selection.select(Array(Array(documentWidth.value-1,documentHeight.value-1),Array(documentWidth.value,documentHeight.value-1),Array(documentWidth.value,documentHeight.value), Array(documentWidth.value-1,documentHeight.value), Array(documentWidth.value-1,documentHeight.value-1)));
	newDocument.selection.clear();
	
	newDocument.trim(TrimType.TOPLEFT, true, true, false, false);
	var offsetX = new UnitValue(documentWidth.value - newDocument.width.value - layerOffsetX, documentWidth.type);
	var offsetY = new UnitValue(documentHeight.value - newDocument.height.value - layerOffsetY, documentWidth.type);
	newDocument.trim(TrimType.BOTTOMRIGHT, false, false, true, true);
    
    return { document: newDocument, offsetX: offsetX, offsetY: offsetY};
 }
 
 function foreachLayerRecursive(doc, action) {
    if( doc.layers ){    
        for (var i = 0; i < doc.layers.length; i++) {
            if( action(doc.layers[i])){
                foreachLayerRecursive (doc.layers[i], action)
            }
        }
    }
}
