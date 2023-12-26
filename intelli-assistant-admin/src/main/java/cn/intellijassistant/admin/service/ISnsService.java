package cn.intellijassistant.admin.service;

import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;

/**
 * @Author: Jason Wu
 * @Date: 2023/9/4
 * @Description:
 */
public interface ISnsService {
    String openid(@RequestParam String code) throws IOException;
}
