package cn.intellijassistant.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @Author: Jason Wu
 * @Date: 2023/9/4
 * @Description:
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BaiduTokenDTO {
    private String token;
    private Long expiredAt;
}
