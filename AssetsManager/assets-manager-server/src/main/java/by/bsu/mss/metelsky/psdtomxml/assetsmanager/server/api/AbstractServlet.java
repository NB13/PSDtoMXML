package by.bsu.mss.metelsky.psdtomxml.assetsmanager.server.api;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public abstract class AbstractServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    public void doPost(HttpServletRequest request, HttpServletResponse response) {
        doGet(request, response);
    }

    public void doGet(HttpServletRequest request, HttpServletResponse response) {
        try {
            request.setCharacterEncoding("UTF-8");
            response.setCharacterEncoding("UTF8");
            // Set to expire far in the past.
            noCache(response);

            doLogic(request, response);

        } catch (Exception exception) {
            writeException(response, exception);
        }

    }

    abstract protected void doLogic(HttpServletRequest request, HttpServletResponse response)
            throws Exception;

    protected void doOutput(HttpServletResponse response, String string)
            throws Exception {
        response.getWriter().append(string);
        response.getWriter().flush();
    }

    private void writeException(HttpServletResponse resp, Exception e) {
        noCache(resp);
        try {
            resp.getWriter().append("<error>");
            resp.getWriter().append(getErrorMessage(e));
            resp.getWriter().append("</error>");
        } catch (IOException e1) {
        }
    }

    protected void noCache(HttpServletResponse response) {
        response.setHeader("Expires", "Sat, 6 May 1995 12:00:00 GMT");

        // Set standard HTTP/1.1 no-cache headers.
        response.setHeader("Cache-Control",
                "no-store, no-cache, must-revalidate");

        // Set IE extended HTTP/1.1 no-cache headers (use addHeader).
        response.addHeader("Cache-Control", "post-check=0, pre-check=0");

        // Set standard HTTP/1.0 no-cache header.
        response.setHeader("Pragma", "no-cache");
    }

    protected Exception getError(Exception e) {
        return e;
    }

    protected String getErrorMessage(Exception e) {
        return e.getMessage();
    }
}