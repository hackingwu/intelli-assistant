package cn.intellijassistant.admin;

import org.joda.time.DateTime;
import org.junit.jupiter.api.Test;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/10
 * @Description:
 */
public class T1 {

    @Test
    public void t2() {
        int n = 9, n1 = 2;
        char c = (char) n;
        int n2 = '0' + n1;
        System.out.printf("");
        DateTime dateTime = new DateTime("2023-11-09");
        if (dateTime.getHourOfDay() == 0) {
            dateTime = dateTime.withHourOfDay(8);
        }
        System.out.println(dateTime.getMillis());
    }
}

/**
 *
 */
