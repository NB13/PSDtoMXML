#target photoshop

#include "PhotoshopCommons.jsx";

var doc = app.activeDocument;

if (doc) {
	rasterizeSmartObjects();
}

function rasterizeSmartObjects(){
	foreachLayerRecursive(doc, function(theLayer){
			if (theLayer.kind == LayerKind.SMARTOBJECT) {
				theLayer.rasterize(RasterizeType.ENTIRELAYER);
			};
			return true;
		}
	);
}