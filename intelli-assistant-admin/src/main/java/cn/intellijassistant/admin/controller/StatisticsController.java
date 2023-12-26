package cn.intellijassistant.admin.controller;

import cn.intellijassistant.admin.OperationLogType;
import cn.intellijassistant.admin.domain.Account;
import cn.intellijassistant.admin.domain.OperationLog;
import cn.intellijassistant.admin.domain.Schedule;
import cn.intellijassistant.admin.dto.StatisticsDTO;
import cn.intellijassistant.admin.repository.AccountMapper;
import cn.intellijassistant.admin.repository.OperationLogMapper;
import cn.intellijassistant.admin.repository.ScheduleMapper;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import javax.annotation.Resource;
import java.text.SimpleDateFormat;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/14
 * @Description:
 */
@Controller
@RequestMapping("/admin/statistics")
public class StatisticsController {

    @Resource
    private OperationLogMapper operationLogMapper;
    @Resource
    private ScheduleMapper scheduleMapper;
    @Resource
    private AccountMapper accountMapper;

    SimpleDateFormat simpleDateFormat = new SimpleDateFormat("MM-dd HH:mm");


    @GetMapping("")
    public String getTableData(Model model, @RequestParam(value = "days", required = false) Integer days) {
        if (days == null) days = 1;
        Long now = System.currentTimeMillis();
        Long timeFrom = now - 24*60*60*1000L*days;

        List<OperationLog> operationLogs = operationLogMapper.findByTimeCreateGreaterThan(timeFrom);
        Map<String, List<OperationLog>> operationMap = operationLogs.stream().collect(Collectors.groupingBy(OperationLog::getOpenid));
        operationMap.forEach((key, value)->value.sort(Comparator.comparing(OperationLog::getTimeCreate)));
        //operationLogs.sort(Comparator.comparing(OperationLog::getTimeCreate).reversed());
        List<Schedule> schedules = scheduleMapper.findByTimeCreateGreaterThan(timeFrom);
        Map<String, List<Schedule>> scheduleMap = schedules.stream().collect(Collectors.groupingBy(Schedule::getOpenid));
        scheduleMap.forEach((key, value)->value.sort(Comparator.comparing(Schedule::getTimeCreate)));
        Set<String> openids = operationLogs.stream().map(OperationLog::getOpenid).collect(Collectors.toSet());
        List<Account> accounts = accountMapper.findAllById(openids);
        List<ScheduleMapper.ScheduleProjection> scheduleProjections = scheduleMapper.findByOpenidIn(openids);
        Map<String, TreeSet<Long>> scheduleProjectionMap = scheduleProjections.stream().collect(Collectors.groupingBy(ScheduleMapper.ScheduleProjection::getOpenid,
                Collectors.mapping(ScheduleMapper.ScheduleProjection::getTimeCreate, Collectors.toCollection(TreeSet::new))));
        Map<String, Account> accountMap = accounts.stream().collect(Collectors.toMap(Account::getId, Function.identity()));
        Map<String, AtomicInteger> counterMap = new HashMap<>();
        Map<String, List<StatisticsDTO>> statisticsMap = new HashMap<>();
        operationMap.forEach((key, value) ->{
            if (key.length() == 0) return;
            List<StatisticsDTO> statisticsDTOS = value.stream().map(operationLog -> {
                final String openid = operationLog.getOpenid();
                StatisticsDTO statisticsDTO = new StatisticsDTO();
                statisticsDTO.setId(operationLog.getId());
                statisticsDTO.setOpenid(openid);
                if (statisticsDTO.getOpenid().length() > 10) {
                    statisticsDTO.setOpenid(statisticsDTO.getOpenid().substring(10));
                }
                Account account = accountMap.get(openid);
                if (account != null) {
                    statisticsDTO.setUserCreateTime(simpleDateFormat.format(account.getTimeCreate()));
                }
                statisticsDTO.setOperatorTime(simpleDateFormat.format(operationLog.getTimeCreate()));
                TreeSet<Long> treeSet = scheduleProjectionMap.get(openid);
                if (treeSet != null && treeSet.size() > 0) {
                    statisticsDTO.setCount(treeSet.size());
                    Optional.ofNullable(treeSet.lower(operationLog.getTimeCreate())).map(simpleDateFormat::format).ifPresent(statisticsDTO::setLastOperateTime);
                }
                statisticsDTO.setOperatorType(OperationLogType.findByValue(Math.abs(operationLog.getType())) + (operationLog.getType() < 0 ? "失败":""));
                statisticsDTO.setScheduleDescription(operationLog.getContent());
                if (operationLog.getType() >= 10 && operationLog.getType() % 10 < 3) {

                    List<Schedule> theSchedules = scheduleMap.get(openid);
                    if (theSchedules != null && theSchedules.size() > 0) {
                        AtomicInteger atomicInteger = counterMap.computeIfAbsent(openid, (id)->new AtomicInteger());
                        if (atomicInteger.get() < theSchedules.size()) {
                            Schedule schedule = theSchedules.get(atomicInteger.getAndAdd(1));
                            if (schedule != null) {
                                statisticsDTO.setScheduleDescription(statisticsDTO.getScheduleDescription() + "\n"+schedule.getDescription());
                                statisticsDTO.setScheduleMainInfo(getScheduleMainInfo(schedule));
                            }
                        }
                    }
                }
                return statisticsDTO;
            }).collect(Collectors.toList());
            statisticsMap.put(key, statisticsDTOS);
        });
        model.addAttribute("operationLogNum", operationLogs.size());
        model.addAttribute("operationAccountNum", operationLogs.stream().map(OperationLog::getOpenid).collect(Collectors.toSet()).size());
        model.addAttribute("scheduleNum", schedules.size());
        model.addAttribute("scheduleAccountNum", ""+schedules.stream().map(Schedule::getOpenid).collect(Collectors.toSet()).size());
        model.addAttribute("freshAccountNum", ""+accounts.stream().filter(account -> account.getTimeCreate()>timeFrom).count());
        model.addAttribute("oldAccountNum", ""+accounts.stream().filter(account -> account.getTimeCreate()<timeFrom).count());

        List<Map.Entry<String, List<StatisticsDTO>>> statistics = statisticsMap.entrySet().stream().sorted((entry1, entry2)-> {
           String lastTime1 = entry1.getValue().get(entry1.getValue().size() - 1).getOperatorTime();
           String lastTime2 = entry2.getValue().get(entry2.getValue().size() - 1).getOperatorTime();
           return lastTime2.compareTo(lastTime1);
        }).collect(Collectors.toList());
        model.addAttribute("statistics", statistics);

        return "table";
    }

    public String getScheduleMainInfo(Schedule schedule) {
        return String.format("标题:%s, 地点:%s, 开始时间:%s, 提前提醒:%s", schedule.getTitle(),
                schedule.getLocation(), simpleDateFormat.format(schedule.getStartTime()),
                getAlarmOffsetString(schedule.getAlarmOffset()));
    }
    public String getAlarmOffsetString(int offset) {
        if (offset == 0) {
            return "日程开始时";
        } else if (offset == 5 * 60) {
            return "5分钟前" ;
        } else if (offset == 10 * 60) {
            return "10分钟前";
        } else if (offset == 15 * 60) {
            return "15分钟前";
        } else if (offset == 30 * 60) {
            return "30分钟前";
        } else if (offset == 60 * 60) {
            return "1小时前";
        } else if (offset == 2 * 60 * 60) {
            return "2小时前" ;
        } else if (offset == 24 * 60 * 60) {
            return "1天前" ;
        } else if (offset == 2 * 24 * 60 * 60) {
            return "2天前";
        } else if (offset == 7 * 24 * 60 * 60) {
            return "1周前";
        }
        return "";

    }

}
