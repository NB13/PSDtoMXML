package by.bsu.mss.metelsky.psdtomxml.assetsmanager.client;

import by.bsu.mss.metelsky.psdtomxml.assetsmanager.core.MD5Helper;
import by.bsu.mss.metelsky.psdtomxml.assetsmanager.core.ManagerServerAPI;
import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.methods.ByteArrayRequestEntity;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.File;
import java.net.URL;
import java.util.Arrays;

public class AssetsManagerClient {

    public static final String SERVER_URL = "http://188.93.18.98/assetsServer/main";

    private enum Method {
        putImageInLibrary
    }

    public static void main(String[] args) throws Exception {
        String method = null;//args[0];
        String[] parameters = null;//Arrays.copyOfRange(args, 1, args.length);
        method = "putImageInLibrary";
        parameters = new String[]{"C:\\temp\\back.close.png", "back.close"};
        new AssetsManagerClient().processRequest(Method.valueOf(method), parameters);
    }

    private void processRequest(Method method, String[] parameters) throws Exception {
        switch (method) {
            case putImageInLibrary:
                String imageFileName = parameters[0];
                String imagePath = parameters[1];
                String imageMD5 = MD5Helper.imageMD5(imageFileName);
                String hasImageURL = SERVER_URL + "?method=" + ManagerServerAPI.hasImage + "&imageMD5=" + imageMD5;
                String hasImageS = IOUtils.toString(new URL(hasImageURL));
                Boolean hasImage = Boolean.parseBoolean(hasImageS);
                if (!hasImage) {
                    HttpClient httpClient = new HttpClient();
                    PostMethod httpMethod = new PostMethod(SERVER_URL + "?method=" + ManagerServerAPI.putImage + "&imagePath=" + imagePath);
                    byte[] image = FileUtils.readFileToByteArray(new File(imageFileName));
                    httpMethod.setRequestEntity(new ByteArrayRequestEntity(image));
                    httpClient.executeMethod(httpMethod);
                }
                break;
            default:
                throw new Exception("Unknown method");
        }
    }


}
