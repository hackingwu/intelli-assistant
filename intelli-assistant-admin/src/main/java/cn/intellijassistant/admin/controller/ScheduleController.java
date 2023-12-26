package cn.intellijassistant.admin.controller;

import cn.intellijassistant.admin.domain.Schedule;
import cn.intellijassistant.admin.repository.ScheduleMapper;
import cn.intellijassistant.admin.util.StringUtil;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;
import java.util.UUID;

/**
 * @Author: Jason Wu
 * @Date: 2023/7/24
 * @Description:
 */
@RestController
@RequestMapping("/admin/schedules")
public class ScheduleController {

    @Resource
    private ScheduleMapper scheduleMapper;

    @GetMapping("")
    public List<Schedule> list(@RequestParam("openid") String openid, @RequestParam("timeFrom") Long timeFrom,
                               @RequestParam("timeTo") Long timeTo) {

        return scheduleMapper.findByOpenidAndStartTimeBetweenOrderByStartTimeDesc(openid, timeFrom, timeTo);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        scheduleMapper.deleteById(id);
    }

    @PostMapping("")
    public Schedule save(@RequestBody Schedule schedule) {

        schedule.setId(UUID.randomUUID().toString());
        schedule.setTimeCreate(System.currentTimeMillis());
        schedule.setDescription(StringUtil.safeLength(schedule.getDescription(), 500));
        scheduleMapper.save(schedule);
        return schedule;
    }
}
