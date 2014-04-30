package by.bsu.mss.metelsky.psdtomxml.assetsmanager.server;


import by.bsu.mss.metelsky.psdtomxml.assetsmanager.core.MD5Helper;
import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

public class ImageManager {

    protected static final Logger logger = Logger.getLogger(ImageManager.class);

    protected Map<String, String> imageHashToFileName = new HashMap<String, String>();
    protected String libraryPath;

    public static void main(String[] args) throws IOException {
        new ImageManager("c://temp");
    }

    public ImageManager(String libraryPath) {
        this.libraryPath = libraryPath;
        loadLibrary();
    }

    private void loadLibrary() {
        Iterator<File> fileIterator = FileUtils.iterateFiles(new File(libraryPath), new String[]{"jpg", "png"}, true);
        while (fileIterator.hasNext()) {
            File imageFile = fileIterator.next();
            putImageHashToCache(imageFile.getAbsolutePath());
        }
    }

    protected void putImageHashToCache(String fileName) {
        try {
            imageHashToFileName.put(MD5Helper.imageMD5(fileName), fileName);
        } catch (Exception e) {
            logger.error("Cannot put image to cache " + fileName, e);
        }
    }

    public synchronized Boolean hasImageInLibrary(String imageMD5) {
        logger.info("Check image in library " + imageMD5);
        return imageHashToFileName.containsKey(imageMD5);
    }

    public synchronized void addImageToLibrary(String path, byte[] image) throws Exception {
        logger.info("Add image to library " + path + " " + image.length);
        String md5 = MD5Helper.imageMD5(image);
        String imagePath = libraryPath + File.pathSeparator + path;
        logger.info("Image path " + imagePath);
        FileUtils.writeByteArrayToFile(new File(imagePath), image);
        logger.info("Image written");
        imageHashToFileName.put(md5, imagePath);
    }
}
