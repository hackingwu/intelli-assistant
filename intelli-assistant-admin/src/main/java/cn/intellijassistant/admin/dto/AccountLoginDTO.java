package cn.intellijassistant.admin.dto;

import lombok.Data;

/**
 * @Author: Jason Wu
 * @Date: 2023/9/4
 * @Description:
 */
@Data
public class AccountLoginDTO {

    private boolean needInviteComment;

    private String baiduToken;

    private String openid;

}
