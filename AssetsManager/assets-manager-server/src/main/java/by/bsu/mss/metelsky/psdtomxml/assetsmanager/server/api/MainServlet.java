package by.bsu.mss.metelsky.psdtomxml.assetsmanager.server.api;

import by.bsu.mss.metelsky.psdtomxml.assetsmanager.core.ManagerServerAPI;
import by.bsu.mss.metelsky.psdtomxml.assetsmanager.server.ImageManager;
import org.apache.commons.io.IOUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class MainServlet extends AbstractServlet {

    public static final ImageManager imageManager = new ImageManager("/home/assetsManager/images");

    @Override
    protected void doLogic(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String method = request.getParameter("method");
        switch (ManagerServerAPI.valueOf(method)) {
            case hasImage:
                processHasImage(request, response);
                break;
            case putImage:
                processPutImage(request);
                break;
            default:
                throw new Exception("Unknown method passed");
        }
    }

    private void processPutImage(HttpServletRequest request) throws Exception {
        String imageMD5 = request.getParameter("imageMD5");
        String imagePath = request.getParameter("imagePath");
        byte[] image = IOUtils.toByteArray(request.getInputStream());
        imageManager.addImageToLibrary(imagePath, image, imageMD5);
    }

    private void processHasImage(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String imageMD5 = request.getParameter("imageMD5");
        String imagePath = imageManager.getImagePath(imageMD5);
        response.getWriter().append(imagePath != null ? imagePath : "false");
        response.getWriter().close();
    }
}
