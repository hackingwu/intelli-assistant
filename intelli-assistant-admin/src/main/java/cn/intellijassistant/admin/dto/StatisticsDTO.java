package cn.intellijassistant.admin.dto;

import lombok.Data;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/14
 * @Description:
 */
@Data
public class StatisticsDTO {

    private Long id;
    private String openid;
    private String userCreateTime;
    private String operatorTime;

    private String lastOperateTime;
    private Integer count;
    private String operatorType;

    private String scheduleDescription;

    private String scheduleMainInfo;
}
