package cn.intellijassistant.admin.util;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/31
 * @Description:
 */
public class StringUtil {
    public static boolean isEmpty(String s) {
        return s == null || s.trim().length() == 0;
    }

    public static String safeLength(String s, int len) {
        if (s.length() > len) {
            return s.substring(0, len);
        }
        return s;
    }
}
