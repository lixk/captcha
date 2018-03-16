package slide;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletResponse;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Base64;
import java.util.Random;

/**
 * @author lixk
 * @email 1749498702@qq.com
 * @version [1.0, 2018年03月10日]
 * @ClassName: SlideVerify
 * @Description: TODO
 * @since version 1.0
 */
public class SlideVerify {
    //验证码图片文件夹
    private final static String IMAGES_FOLDER = SlideVerify.class.getResource("/../../slideVerify/images/").getPath();
    // 背景图片文件夹
    private final static String BACKGROUND_IMAGES_FOLDER = IMAGES_FOLDER + "background" + File.separator;
    //缩放后背景图片最大尺寸(防止缩放图片尺寸过大)
    private final static int MAX_WIDTH = 500;
    private final static int MAX_HEIGHT = 500;

    // 背景图对象数组
    private static BufferedImage[] BACKGROUND_IMAGES;
    // 背景遮罩图
    private static BufferedImage BACKGROUND_MASK;
    // 滑块遮罩图
    private static BufferedImage BLOCK_MASK;


    static {
        try {
            // 初始化遮罩图
            BACKGROUND_MASK = ImageIO.read(new File(IMAGES_FOLDER + "background_mask.png"));
            BLOCK_MASK = ImageIO.read(new File(IMAGES_FOLDER + "block_mask.png"));
            // 初始化背景图集合
            File[] imageList = new File(BACKGROUND_IMAGES_FOLDER).listFiles();
            BACKGROUND_IMAGES = new BufferedImage[imageList.length];
            for (int i = 0; i < imageList.length; i++) {
                BACKGROUND_IMAGES[i] = ImageIO.read(imageList[i]);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * 绘制背景图和滑块
     *
     * @param image
     * @param width       背景图宽
     * @param height      背景图高
     * @param blockWidth  滑块宽
     * @param blockHeight 滑块高
     * @return
     * @throws Exception
     * @Title: draw
     * @Description: TODO
     */
    private static ResultData draw(BufferedImage image, Integer width, Integer height, Integer blockWidth, Integer blockHeight) throws Exception {
        ResultData result = new ResultData();

        // 创建缩放背景图及遮罩图
        BufferedImage background = zoom(image, width, height); // 背景
        BufferedImage backgroundMask = zoom(BACKGROUND_MASK, blockWidth, blockHeight); // 背景遮罩
        BufferedImage blockMask = zoom(BLOCK_MASK, blockWidth, blockHeight); // 滑块遮罩
        //重新获取宽高
        width = background.getWidth();
        height = background.getHeight();
        blockWidth = backgroundMask.getWidth();
        blockHeight = backgroundMask.getHeight();

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            throw new Exception(String.format("图片宽度不能超过%d, 高度不能超过%d！", MAX_WIDTH, MAX_HEIGHT));
        }
        // 滑块在背景上的最大偏移值
        int maxOffsetX = width - 2 * blockWidth;
        int maxOffsetY = height - blockHeight;
        if (maxOffsetX < 0 || maxOffsetY < 0) {
            throw new Exception("背景图宽度不能小于2倍遮罩图宽度，高度不能小于遮罩图高度！");
        }
        // 生成滑块随机坐标
        int posX = new Random().nextInt(maxOffsetX) + blockWidth;
        int posY = new Random().nextInt(maxOffsetY);

        result.posX = posX;
        result.posY = posY;

        {/*********************** 绘制滑块 ****************************/
            BufferedImage block = new BufferedImage(blockWidth, blockHeight, BufferedImage.TYPE_INT_ARGB);
            // 遍历背景遮罩图片的每一个像素
            for (int y = 0; y < blockHeight; y++) {
                for (int x = 0; x < blockWidth; x++) {
                    int shape_pixel = backgroundMask.getRGB(x, y);
                    int a = shape_pixel >> 24 & 0xff; // alpha 透明度值
                    // 如果该像素不完全透明，从背景图中获取对应位置的像素数据，填充到滑块图片对应位置
                    if (a != 0) {
                        int bg_pixel = background.getRGB(x + posX, y + posY);
                        block.setRGB(x, y, bg_pixel);
                    }
                }
            }

            // 绘制滑块遮罩
            Graphics g = block.getGraphics();
            g.drawImage(blockMask, 0, 0, null);
            g.dispose();
            // 滑块编码
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            ImageIO.write(block, "png", os);
            result.block = Base64.getEncoder().encodeToString(os.toByteArray());
        }

        {/*********************** 绘制底图 ****************************/
            // 在背景图上绘制遮罩图片
            Graphics g = background.getGraphics();
            g.drawImage(backgroundMask, posX, posY, null);
            g.dispose();
            // 背景图片编码
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            ImageIO.write(background, "jpg", os);
            result.image = Base64.getEncoder().encodeToString(os.toByteArray());
        }

        return result;
    }

    /**
     * 创建滑动验证码
     *
     * @param response
     * @param width       背景宽度
     * @param height      背景高度
     * @param blockWidth  滑块宽度
     * @param blockHeight 滑块高度
     * @return
     * @throws Exception
     * @Title: create
     * @Description: TODO
     */
    public static int create(HttpServletResponse response, Integer width, Integer height, Integer blockWidth, Integer blockHeight) throws Exception {
        // 设置浏览器响应
        response.setCharacterEncoding("utf-8");
        response.setContentType("application/json");
        // 将数据写到response的输出流，返回给前端
        PrintWriter out = response.getWriter();
        Random random = new Random();
        BufferedImage image = BACKGROUND_IMAGES[random.nextInt(BACKGROUND_IMAGES.length)];
        ResultData data = draw(image, width, height, blockWidth, blockHeight);
        String format = "{\"code\": 200, \"data\": { \"image\": \"%s%s\", \"block\": \"%s%s\", \"top\": %d} }";
        out.println(String.format(format, "data:image/jpg;base64,", data.image, "data:image/png;base64,", data.block, data.posY));
        out.close();

        return data.posX;
    }

    /**
     * 缩放图像
     *
     * @param image
     * @param width  缩放后的宽
     * @param height 缩放后的高
     * @return
     * @Title: zoom
     * @Description: TODO
     */
    private static BufferedImage zoom(BufferedImage image, Integer width, Integer height) {
        if (width == null) {
            width = image.getWidth();
        }
        if (height == null) {
            height = image.getHeight();
        }
        // 创建新图片
        BufferedImage newImage = new BufferedImage(width, height, image.getType());
        Graphics g = newImage.createGraphics();
        // 获取并绘制缩放图像
        Image instance = image.getScaledInstance(width, height, image.getType());
        g.drawImage(instance, 0, 0, null);
        g.dispose();
        return newImage;
    }

    /**
     * 滑动验证码实体类
     */
    private static class ResultData {
        public int posX;
        public int posY;
        public String block;
        public String image;
    }

}
