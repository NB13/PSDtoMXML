package by.bsu.mss.metelsky.psdtomxml.assetsmanager.core;


import org.apache.commons.codec.binary.Hex;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.security.MessageDigest;

public class MD5Helper {

    public static String imageMD5(byte[] image) throws Exception {
        return imageMD5(ImageIO.read(new ByteArrayInputStream(image)));
    }

    public static String imageMD5(String fileName) throws Exception {
        BufferedImage image = ImageIO.read(new File(fileName));
        return imageMD5(image);
    }

    private static String imageMD5(BufferedImage image) throws Exception {
        ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
        for (int i = 0; i < image.getWidth(); i++) {
            for (int j = 0; j < image.getHeight(); j++) {
                int rgb = image.getRGB(i, j);
                byteStream.write(rgb);
                byteStream.write(rgb >> 8);
                byteStream.write(rgb >> 16);
            }
        }
        MessageDigest md5 = MessageDigest.getInstance("MD5");
        byte[] md5Bytes = md5.digest(byteStream.toByteArray());
        return new String(Hex.encodeHex(md5Bytes));
    }
}
