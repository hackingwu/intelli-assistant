package cn.intellijassistant.admin.dto;

import lombok.Data;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/23
 * @Description:
 */
@Data
public class ScheduleInfoDTO {

    private String title;
    private String dateTimeFrom;

    private Long timestampFrom;

    private String location;

    private String description;
}
