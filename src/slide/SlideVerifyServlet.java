package slide;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;

@WebServlet("/slideVerifyServlet")
public class SlideVerifyServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final String CODE_KEY = "positionX";
    // 允许误差范围
    private static final int RANGE = 5;

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession();
        try {
            Integer imageWidth = getInteger(request, "width");
            Integer imageHeight = getInteger(request, "height");
            Integer blockWidth = getInteger(request, "blockWidth");
            Integer blockHeight = getInteger(request, "blockHeight");

            int positionX = SlideVerify.create(response, imageWidth, imageHeight, blockWidth, blockHeight);
            // 将滑块横坐标放入session，等待验证
            session.setAttribute(CODE_KEY, positionX);
            System.out.println(positionX);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // 前端传回的坐标与session中保存的坐标进行比对，如果在允许误差范围内则验证通过
        Integer posX = getInteger(request,"posX");
        HttpSession session = request.getSession();
        Integer positionX = (Integer) session.getAttribute(CODE_KEY);
        //设置验证码取出后即失效
        session.removeAttribute(CODE_KEY);
        PrintWriter out = response.getWriter();
        if (posX == null || positionX == null) {
            out.println("{\"code\": 300}");
            return;
        }
        if (Math.abs(posX - positionX) > RANGE) {
            out.println("{\"code\": 300}");
        } else {
            out.println("{\"code\": 200}");
        }

    }

    private Integer getInteger(HttpServletRequest request, String parameterName) {
        String parameter = request.getParameter(parameterName);
        return parameter == null ? null : Integer.valueOf(parameter);
    }
}
