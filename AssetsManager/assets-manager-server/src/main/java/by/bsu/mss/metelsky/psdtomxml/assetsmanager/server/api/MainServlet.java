package by.bsu.mss.metelsky.psdtomxml.assetsmanager.server.api;

import by.bsu.mss.metelsky.psdtomxml.assetsmanager.core.ManagerServerAPI;
import by.bsu.mss.metelsky.psdtomxml.assetsmanager.server.ImageManager;
import org.apache.commons.io.IOUtils;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class MainServlet extends AbstractServlet {


    public static final ImageManager imageManager = new ImageManager("/home/assetsManager/images");

    @Override
    protected void doLogic(HttpServletRequest request, HttpServletResponse response) throws Exception {
        String method = request.getParameter("method");
        switch (ManagerServerAPI.valueOf(method)) {
            case hasImage:
                String imageMD5 = request.getParameter("imageMD5");
                response.getWriter().append(imageManager.hasImageInLibrary(imageMD5) ? "true" : "false");
                response.getWriter().close();
                break;
            case putImage:
                String imagePath = request.getParameter("imagePath");
                byte[] image = IOUtils.toByteArray(request.getInputStream());
                imageManager.addImageToLibrary(imagePath, image);
                break;
            default:
                throw new Exception("Unknown method passed");
        }
    }
}
