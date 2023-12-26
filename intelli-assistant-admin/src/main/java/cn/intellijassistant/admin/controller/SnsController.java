package cn.intellijassistant.admin.controller;

import cn.intellijassistant.admin.service.ISnsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/25
 * @Description:
 */
@RequestMapping("/admin/sns")
@RestController
public class SnsController {

    @Autowired
    private ISnsService snsService;


    @GetMapping("/openid")
    public String openid(@RequestParam String code) throws IOException {

        return snsService.openid(code);
    }
}
