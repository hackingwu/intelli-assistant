package cn.intellijassistant.admin.domain;

import lombok.Data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/31
 * @Description:
 */
@Entity
@Data
public class OperationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String openid;

    @Column(columnDefinition = "TINYINT")
    private int type;

    //长度500
    private String content;

    private Long timeCreate;
}
