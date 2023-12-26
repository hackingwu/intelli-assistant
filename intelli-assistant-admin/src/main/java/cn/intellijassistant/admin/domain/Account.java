package cn.intellijassistant.admin.domain;

import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/1
 * @Description:
 */
@Data
@Entity
public class Account {

    //openid
    @Id
    private String id;

    private boolean commentInvited;

    private Long timeCreate;
}
