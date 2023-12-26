package cn.intellijassistant.admin;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/31
 * @Description:
 */
@Getter
public enum OperationLogType {

    TXT_RECOGNIZE(0, "识别文字"),
    IMAGE_RECOGNIZE(1, "识别图片"),

    PDF_RECOGNIZE(2, "识别PDF"),

    CREATE_SCHEDULE_TXT(10, "创建文字日程"),
    CREATE_SCHEDULE_IMAGE(11, "创建图片日程"),
    CREATE_SCHEDULE_PDF(12, "创建PDF日程"),

    CREATE_SCHEDULE_AGAIN(13, "再一次创建日程"),
    CREATE_SCHEDULE_TXT_CACHE(20, "从缓存创建文字日程"),
    CREATE_SCHEDULE_IMAGE_CACHE(21, "从缓存创建图片日程"),
    CREATE_SCHEDULE_PDF_CACHE(22, "从缓存创建PDF日程"),

    APP_LOAD(50, "应用加载")
    ;
    int value;
    String desc;

    OperationLogType(int value, String desc) {
        this.value = value;
        this.desc = desc;
    }


    static Map<Integer, String> map = new HashMap<>();

    static {
        for (OperationLogType value : OperationLogType.values()) {
            map.put(value.getValue(), value.getDesc());
        }
    }

    public static String findByValue(int v) {
        return map.get(v);
    }
}
