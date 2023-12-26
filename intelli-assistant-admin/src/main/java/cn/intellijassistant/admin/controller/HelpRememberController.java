package cn.intellijassistant.admin.controller;

import cn.intellijassistant.admin.conf.Configuration;
import cn.intellijassistant.admin.dto.ScheduleInfoDTO;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import okhttp3.Cache;
import okhttp3.Dns;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.dnsoverhttps.DnsOverHttps;
import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;

/**
 * @Author: Jason Wu
 * @Date: 2023/8/23
 * @Description:
 */
@RestController
@Slf4j
@RequestMapping("/admin/help_remember")
public class HelpRememberController {

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private Configuration configuration;

    public String requestBodyFormat;

    @PostConstruct
    public void postConstruct(){
        Resource resource = resourceLoader.getResource("classpath:help_remember_request_body.json");
        try (InputStream inputStream = resource.getInputStream();
             BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            StringBuilder content = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                content.append(line).append("\n");
            }
            requestBodyFormat = content.toString();
            // Use the resource content as needed
        } catch (IOException e) {
            // Handle the exception
        }
    }

    public static final String EMPTY_SCHEDULE_STR = JSON.toJSONString(new ScheduleInfoDTO());
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm");

    Cache appCache = new Cache(new File("cacheDir", "okhttpcache"), 10 * 1024 * 1024);
    OkHttpClient bootstrapClient = new OkHttpClient.Builder().cache(appCache).build();

    //加速国内云对azure的访问
    Dns dns = new DnsOverHttps.Builder().client(bootstrapClient)
            .url(HttpUrl.get("https://1.1.1.1/dns-query"))
            .build();

    OkHttpClient azureClient = bootstrapClient.newBuilder()
            .readTimeout(15, TimeUnit.SECONDS)

            .build();
    public static final ScheduleInfoDTO EMPTY_SCHEDULE = new ScheduleInfoDTO();
    @PostMapping("")
    public ScheduleInfoDTO save(@RequestBody HashMap<String, String> map) {
        long start = System.currentTimeMillis();
        String text = map.get("text");
        if (text == null || text.trim().length() < 6) return EMPTY_SCHEDULE;
        String textJson = JSON.toJSONString(text);
        String formattedDate = dateFormat.format(new Date());
        MediaType mediaType = MediaType.parse("application/json");
        String bodyStr = String.format(requestBodyFormat, formattedDate, textJson);
        okhttp3.RequestBody body = okhttp3.RequestBody.create(mediaType, bodyStr);
        Request request = new Request.Builder()
                .url(configuration.getOpenaiAzureEndpoint())
                .method("POST", body)
                .addHeader("Content-Type", "application/json")
                .addHeader("api-key", configuration.getOpenaiAzureApiKey())
                .build();
        String responseBody = "";
        long requestStart = System.currentTimeMillis();
        try {
            Response response = azureClient.newCall(request).execute();
            responseBody = response.body().string();

        } catch (Exception e) {
            log.error("OPENAI请求失败：{}, text:{}, response: {}", e.getMessage(), text, responseBody);
            return EMPTY_SCHEDULE;
        }
        long requestEnd = System.currentTimeMillis();
        JSONObject jsonObject = JSON.parseObject(responseBody);
        String s = jsonObject.getJSONArray("choices").getJSONObject(0).getJSONObject("message").getJSONObject("function_call").getString("arguments");
        ScheduleInfoDTO result = JSON.parseObject(s, ScheduleInfoDTO.class);
        try {
            DateTime dateTime = new DateTime(result.getDateTimeFrom());
            if (dateTime.getHourOfDay() == 0) dateTime = dateTime.withHourOfDay(8);
            //识别返回的可能会没有小时信息，所以重新识别
            result.setDateTimeFrom(dateTime.toString("yyyy-MM-dd HH:mm"));
            result.setTimestampFrom(dateTime.getMillis());
        } catch (Exception e) {
            log.error("解析失败: text:{}, response:{}", text, responseBody);
        }
        result.setDescription(text);
        log.warn("openai请求耗时:{}, 接口耗时：{}", (requestEnd - requestStart), (System.currentTimeMillis() - start));
        return result;
    }

}
