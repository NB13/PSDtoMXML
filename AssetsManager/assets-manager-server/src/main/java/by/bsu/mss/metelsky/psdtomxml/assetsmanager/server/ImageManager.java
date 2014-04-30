package by.bsu.mss.metelsky.psdtomxml.assetsmanager.server;


import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class ImageManager {

    protected static final Logger logger = Logger.getLogger(ImageManager.class);
    public static final String HASH_MAPPING_FILE_NAME = "hashMapping.txt";

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
        try {
            loadHashToPathMapping();
        } catch (Exception e) {
            logger.error("Cannot load image library", e);
        }
    }

    private void loadHashToPathMapping() throws IOException {
        File mappingFile = new File(libraryPath + File.pathSeparator + HASH_MAPPING_FILE_NAME);
        if (mappingFile.exists()) {
            String mapping = FileUtils.readFileToString(mappingFile);
            String[] pairs = mapping.split("\n");
            for (String pair : pairs) {
                String md5 = pair.substring(libraryPath.indexOf(' '));
                String imagePath = pair.substring(libraryPath.indexOf(' ') + 1);
                imageHashToFileName.put(md5, imagePath);
            }
        }
    }

    public synchronized String getImagePath(String imageMD5) {
        logger.info("Get image in library " + imageMD5);
        return imageHashToFileName.get(imageMD5);
    }

    public synchronized void addImageToLibrary(String path, byte[] image, String imageMD5) throws Exception {
        logger.info("Add image to library " + path + " " + image.length);
        String imagePath = libraryPath + File.pathSeparator + path;
        FileUtils.writeByteArrayToFile(new File(imagePath), image);
        addImageMD5(imageMD5, imagePath);
    }

    private void addImageMD5(String imageMD5, String imagePath) throws IOException {
        imageHashToFileName.put(imageMD5, imagePath);
        FileUtils.writeStringToFile(new File(libraryPath + File.pathSeparator + HASH_MAPPING_FILE_NAME), imageMD5 + " " + imagePath, true);
    }
}
