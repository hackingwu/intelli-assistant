package cn.intellijassistant.admin.controller;

import cn.intellijassistant.admin.conf.Configuration;
import cn.intellijassistant.admin.domain.Account;
import cn.intellijassistant.admin.dto.AccountLoginDTO;
import cn.intellijassistant.admin.dto.BaiduTokenDTO;
import cn.intellijassistant.admin.repository.AccountMapper;
import cn.intellijassistant.admin.repository.ScheduleMapper;
import cn.intellijassistant.admin.service.ISnsService;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.Optional;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/1
 * @Description:
 */
@RestController
@Slf4j
@RequestMapping("/admin/accounts")
public class AccountController {
    @Resource
    private ISnsService snsService;
    @Resource
    private AccountMapper accountMapper;
    @Resource
    private ScheduleMapper scheduleMapper;
    @Resource
    private Configuration configuration;

    private String baiduToken;
    private Long baiduTokenExpiredAt = -1L;

    private String getBaiduToken() {
        if (baiduTokenExpiredAt == -1 || System.currentTimeMillis() > baiduTokenExpiredAt) {
            loadBaiduToken(false);
        }
        return baiduToken;
    }
    static final OkHttpClient HTTP_CLIENT = new OkHttpClient().newBuilder().build();

     final
    private synchronized void loadBaiduToken(boolean refresh) {
        if (!refresh && baiduTokenExpiredAt > System.currentTimeMillis()) return;
        MediaType mediaType = MediaType.parse("application/json");
        RequestBody body = RequestBody.create(mediaType, "");
        String baidubceUrl = String.format("https://aip.baidubce.com/oauth/2.0/token?client_id=%s&client_secret=%s&grant_type=client_credentials",
                configuration.getBaiduBceAK(), configuration.getBaiduBecSK());
        Request request = new Request.Builder()
                .url(baidubceUrl)
                .method("POST", body)
                .addHeader("Content-Type", "application/json")
                .addHeader("Accept", "application/json")
                .build();
        Response response = null;
        try {
            response = HTTP_CLIENT.newCall(request).execute();
            String responseString = response.body().string();
            JSONObject jsonObject = JSON.parseObject(responseString);
            if (jsonObject.getString("error") != null) {
                log.error("登录失败, response:{}", responseString);
                return;
            }
            baiduToken = jsonObject.getString("access_token");
            //往前推5天
            baiduTokenExpiredAt = System.currentTimeMillis() + jsonObject.getLong("expires_in") * 1000 - 432000000;
        } catch (IOException e) {
            log.error("百度登录请求接口失败", e);
        }


    }

    @GetMapping("/invite_comment")
    public boolean inviteComment(@RequestParam("openid") String openid) {
        if (openid == null || openid.length() != 28) return false;
        Optional<Account> userOptional = accountMapper.findById(openid);
        if (userOptional.isPresent()) {
            Account account = userOptional.get();
            if (account.isCommentInvited()) return false;
            return scheduleMapper.countByOpenid(openid) >= 10 ;
        }
        Account account = new Account();
        account.setId(openid);
        account.setCommentInvited(false);
        account.setTimeCreate(System.currentTimeMillis());
        accountMapper.save(account);
        return false;
    }

    @GetMapping("/baiduToken/refresh")
    public BaiduTokenDTO refreshBaiduToken() {
        loadBaiduToken(true);
        return new BaiduTokenDTO(baiduToken, baiduTokenExpiredAt);
    }

    @GetMapping("/login")
    public AccountLoginDTO login(@RequestParam("code") String code) throws IOException {
        AccountLoginDTO result = new AccountLoginDTO();
        result.setBaiduToken(getBaiduToken());
        String openidRespStr = snsService.openid(code);
        String openid = JSON.parseObject(openidRespStr).getString("openid");
        result.setOpenid(openid);
        result.setNeedInviteComment(inviteComment(openid));
        return result;
    }

    @PostMapping("/{id}/commentInvited")
    public void update(@PathVariable String id) {

        accountMapper.commentInvited(id);
    }
}
