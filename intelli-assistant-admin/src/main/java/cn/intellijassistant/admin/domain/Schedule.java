package cn.intellijassistant.admin.domain;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/24
 * @Description:
 */
@Entity
@Data
public class Schedule {

    @Id
    private String id;
    private String location;
    private String openid;
    private String title;
    private Long startTime;
    //长度500
    private String description;
    private int alarmOffset;

    private Long timeCreate;
}
