package cn.intellijassistant.admin.controller;

import cn.intellijassistant.admin.domain.OperationLog;
import cn.intellijassistant.admin.repository.OperationLogMapper;
import cn.intellijassistant.admin.util.StringUtil;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/31
 * @Description:
 */
@RestController
@RequestMapping("/admin/operation_logs")
public class OperationLogController {

    @Resource
    private OperationLogMapper operationLogMapper;

    @PostMapping("")
    public void save(@RequestBody OperationLog operationLog) {
        operationLog.setTimeCreate(System.currentTimeMillis());
        operationLog.setContent(StringUtil.safeLength(operationLog.getContent(), 500));
        operationLogMapper.save(operationLog);
    }
}
